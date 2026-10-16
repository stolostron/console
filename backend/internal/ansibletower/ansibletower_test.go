// Copyright Contributors to the Open Cluster Management project

package ansibletower

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
)

func authOK(_ http.ResponseWriter, _ *http.Request) (string, bool) {
	return "user-token", true
}

func post(h http.Handler, body any) *httptest.ResponseRecorder {
	raw, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/ansibletower", strings.NewReader(string(raw)))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestUnauthorized(t *testing.T) {
	h := New(Options{})
	rec := post(h, map[string]string{})
	if rec.Code != http.StatusUnauthorized || rec.Body.Len() != 0 {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestBadBody(t *testing.T) {
	h := New(Options{Authn: authOK})
	rec := post(h, map[string]string{"towerHost": "https://evil"})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestProxiesAllowlistedPath(t *testing.T) {
	var gotPath, gotAuth string
	tower := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.RequestURI()
		gotAuth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"count":1}`))
	}))
	defer tower.Close()

	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
		Tower:       tower.Client(),
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     Paths[0] + "?page=2&page_size=20",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if gotAuth != "Bearer 12345" {
		t.Fatalf("auth %q", gotAuth)
	}
	if gotPath != "/api/v2/job_templates/?page=2&page_size=20" {
		t.Fatalf("path %q", gotPath)
	}
	if rec.Body.String() != `{"count":1}` {
		t.Fatalf("body %s", rec.Body.String())
	}
}

func TestSkipsHopByHopHeaders(t *testing.T) {
	tower := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Etag", `"abc"`)
		w.Header().Set("Set-Cookie", "session=secret")
		w.Header().Set("X-Job-Id", "7")
		_, _ = w.Write([]byte(`{"count":0}`))
	}))
	defer tower.Close()
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
		Tower:       tower.Client(),
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     Paths[0],
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("content-type %q", rec.Header().Get("Content-Type"))
	}
	if rec.Header().Get("Cache-Control") != "no-store" || rec.Header().Get("Etag") != `"abc"` {
		t.Fatalf("missing allowlisted header %v", rec.Header())
	}
	if rec.Header().Get("Set-Cookie") != "" || rec.Header().Get("X-Job-Id") != "" {
		t.Fatalf("unexpected header forwarded %v", rec.Header())
	}
}

func TestRefusesRedirects(t *testing.T) {
	followed := false
	target := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		followed = true
	}))
	defer target.Close()
	tower := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, target.URL+"/elsewhere", http.StatusFound)
	}))
	defer tower.Close()
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     Paths[0],
	})
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if followed {
		t.Fatal("followed redirect")
	}
	if rec.Header().Get("Location") != "" {
		t.Fatalf("location %q", rec.Header().Get("Location"))
	}
}

func TestRejectsAbsoluteURL(t *testing.T) {
	tower := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("should not reach tower")
	}))
	defer tower.Close()
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
		Tower:       tower.Client(),
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     "https://evil.example.com" + Paths[0],
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestRejectsNetworkPath(t *testing.T) {
	tower := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("should not reach tower")
	}))
	defer tower.Close()
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
		Tower:       tower.Client(),
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     "//evil.example.com" + Paths[0],
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestSecretForbiddenIs400(t *testing.T) {
	kube := fake.NewSimpleClientset()
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     Paths[0],
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestRejectsBadPath(t *testing.T) {
	tower := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Error("should not reach tower")
	}))
	defer tower.Close()
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
		Tower:       tower.Client(),
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     "/badPath",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestNewDefaultDependencies(t *testing.T) {
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()
	h := New(Options{RESTConfig: &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}})
	if h.Authn == nil || h.KubeForUser == nil || h.Tower == nil {
		t.Fatal("expected default authn, kube, and tower client")
	}
}

func TestMethodNotAllowed(t *testing.T) {
	h := New(Options{Authn: authOK})
	req := httptest.NewRequest(http.MethodGet, "/ansibletower", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestMissingSecretFields400(t *testing.T) {
	h := New(Options{Authn: authOK, KubeForUser: func(string) (kubernetes.Interface, error) { return fake.NewSimpleClientset(), nil }})
	rec := post(h, map[string]string{"secretNamespace": "ns"})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestKubeForUserError400(t *testing.T) {
	h := New(Options{
		Authn: authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) {
			return nil, errors.New("no client")
		},
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     Paths[0],
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestInvalidHostURL400(t *testing.T) {
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte("://bad"), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     Paths[0],
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestInvalidAnsiblePath400(t *testing.T) {
	tower := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	defer tower.Close()
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     "://not-a-url",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestReadBodyError400(t *testing.T) {
	h := New(Options{Authn: authOK})
	req := httptest.NewRequest(http.MethodPost, "/ansibletower", errReader{})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

type errReader struct{}

func (errReader) Read([]byte) (int, error) { return 0, errors.New("read failed") }

func TestGatewayPath(t *testing.T) {
	var gotPath string
	tower := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		_, _ = w.Write([]byte(`{"count":0}`))
	}))
	defer tower.Close()
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       map[string][]byte{"host": []byte(tower.URL), "token": []byte("12345")},
	})
	h := New(Options{
		Authn:       authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) { return kube, nil },
		Tower:       tower.Client(),
	})
	rec := post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     "/api/controller/v2/job_templates/",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if gotPath != "/api/controller/v2/job_templates/" {
		t.Fatalf("path %q", gotPath)
	}
}
