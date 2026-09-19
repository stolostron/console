// Copyright Contributors to the Open Cluster Management project

package ansibletower

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
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
