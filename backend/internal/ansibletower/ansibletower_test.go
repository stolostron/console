// Copyright Contributors to the Open Cluster Management project

package ansibletower

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"errors"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stolostron/console/backend/internal/httpx"
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
	req.Header.Set(httpx.HeaderContentType, httpx.MIMEJSON)
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
		w.Header().Set(httpx.HeaderContentType, httpx.MIMEJSON)
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
		w.Header().Set(httpx.HeaderContentType, httpx.MIMEJSON)
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
	if rec.Header().Get(httpx.HeaderContentType) != httpx.MIMEJSON {
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
	if h.Authn == nil || h.KubeForUser == nil || h.verify == nil || h.skip == nil {
		t.Fatal("expected default authn, kube, and tower clients")
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
	h := New(Options{
		Authn: authOK,
		KubeForUser: func(string) (kubernetes.Interface, error) {
			return fake.NewSimpleClientset(), nil
		},
	})
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

func towerCred(host string, extra map[string]string) *corev1.Secret {
	data := map[string][]byte{
		"host":  []byte(host),
		"token": []byte("12345"),
	}
	for k, v := range extra {
		data[k] = []byte(v)
	}
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "tower-cred", Namespace: "app-team"},
		Data:       data,
	}
}

func kubeFrom(secret *corev1.Secret) func(string) (kubernetes.Interface, error) {
	kube := fake.NewSimpleClientset(secret)
	return func(string) (kubernetes.Interface, error) { return kube, nil }
}

func postJobTemplates(h http.Handler) *httptest.ResponseRecorder {
	return post(h, map[string]string{
		"secretNamespace": "app-team",
		"secretName":      "tower-cred",
		"ansiblePath":     Paths[0],
	})
}

func TestTLSSkipVerifyEnabledOption(t *testing.T) {
	hit := false
	tower := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hit = true
		_, _ = w.Write([]byte(`{"count":1}`))
	}))
	defer tower.Close()
	h := New(Options{
		Authn:              authOK,
		KubeForUser:        kubeFrom(towerCred(tower.URL, nil)),
		InsecureSkipVerify: true,
	})
	rec := postJobTemplates(h)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if !hit {
		t.Fatal("tower handler was not reached")
	}
}

func TestTLSUntrustedCertRejectedWhenSkipVerifyDisabled(t *testing.T) {
	hit := false
	tower := httptest.NewTLSServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		hit = true
	}))
	defer tower.Close()
	h := New(Options{
		Authn:              authOK,
		KubeForUser:        kubeFrom(towerCred(tower.URL, nil)),
		InsecureSkipVerify: false,
	})
	rec := postJobTemplates(h)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if hit {
		t.Fatal("tower handler ran with an untrusted certificate")
	}
}

func TestTLSHubCA(t *testing.T) {
	caPEM, tower := hubSignedServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"count":1}`))
	}))
	defer tower.Close()
	h := New(Options{
		HubCA: caPEM,
	})
	resp, err := h.client(false).Get(tower.URL)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func hubSignedServer(t *testing.T, handler http.Handler) ([]byte, *httptest.Server) {
	t.Helper()
	caKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	caTmpl := &x509.Certificate{
		SerialNumber:          big.NewInt(1),
		Subject:               pkix.Name{CommonName: "hub-ca"},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(time.Hour),
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageCertSign,
		BasicConstraintsValid: true,
	}
	caDER, err := x509.CreateCertificate(rand.Reader, caTmpl, caTmpl, &caKey.PublicKey, caKey)
	if err != nil {
		t.Fatal(err)
	}
	caCert, err := x509.ParseCertificate(caDER)
	if err != nil {
		t.Fatal(err)
	}
	leafKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	leafTmpl := &x509.Certificate{
		SerialNumber: big.NewInt(2),
		Subject:      pkix.Name{CommonName: "127.0.0.1"},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	leafDER, err := x509.CreateCertificate(rand.Reader, leafTmpl, caCert, &leafKey.PublicKey, caKey)
	if err != nil {
		t.Fatal(err)
	}
	srv := httptest.NewUnstartedServer(handler)
	srv.TLS = &tls.Config{
		MinVersion: tls.VersionTLS12,
		Certificates: []tls.Certificate{{
			Certificate: [][]byte{leafDER},
			PrivateKey:  leafKey,
		}},
	}
	srv.StartTLS()
	return pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: caDER}), srv
}
