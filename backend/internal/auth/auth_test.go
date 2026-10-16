// Copyright Contributors to the Open Cluster Management project

package auth_test

import (
	"context"
	"encoding/base64"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/config"
)

func TestTokenFromRequest_CookieWinsOverBearer(t *testing.T) {
	req := &http.Request{Header: http.Header{}}
	req.Header.Set("Cookie", "acm-access-token-cookie=from-cookie")
	req.Header.Set("Authorization", "Bearer from-header")
	if got := auth.TokenFromRequest(req); got != "from-cookie" {
		t.Fatalf("got %q, want cookie token", got)
	}
}

func TestTokenFromRequest_BearerFallback(t *testing.T) {
	req := &http.Request{Header: http.Header{}}
	req.Header.Set("Authorization", "Bearer from-header")
	if got := auth.TokenFromRequest(req); got != "from-header" {
		t.Fatalf("got %q, want bearer token", got)
	}
}

func TestTokenFromRequest_Missing(t *testing.T) {
	req := &http.Request{Header: http.Header{}}
	if got := auth.TokenFromRequest(req); got != "" {
		t.Fatalf("got %q, want empty", got)
	}
}

func TestTokenFromRequest_CookieWithEquals(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: auth.AccessTokenCookie, Value: "abc=def"})
	if got := auth.TokenFromRequest(req); got != "abc=def" {
		t.Fatalf("got %q, want cookie value with equals", got)
	}
}

func TestNewTokenReviewer_RequiresClusterAPIURL(t *testing.T) {
	_, err := auth.NewTokenReviewer(&config.Config{}, auth.ServiceAccount{Token: "t"})
	if err == nil {
		t.Fatal("expected error when CLUSTER_API_URL is empty")
	}
}

func TestValidateUserToken_OKAndUnauthorized(t *testing.T) {
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("Authorization") != "Bearer good" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"kind":"APIVersions"}`))
	}))
	defer ts.Close()

	base := &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
	if err := auth.ValidateUserToken(context.Background(), base, "good"); err != nil {
		t.Fatal(err)
	}
	if err := auth.ValidateUserToken(context.Background(), base, "bad"); err == nil {
		t.Fatal("expected unauthorized token to fail")
	}
}

func TestLoadServiceAccount_EnvFallback(t *testing.T) {
	dir := t.TempDir()
	restore := auth.SetServiceAccountDir(dir)
	defer restore()

	cfg := &config.Config{
		Token:         "env-token",
		CACert:        base64.StdEncoding.EncodeToString([]byte("ca-bytes")),
		ServiceCACert: base64.StdEncoding.EncodeToString([]byte("svc-ca")),
	}
	sa, ok := auth.LoadServiceAccount(cfg)
	if !ok {
		t.Fatal("expected token from env")
	}
	if sa.Token != "env-token" {
		t.Fatalf("token %q", sa.Token)
	}
	if string(sa.CACert) != "ca-bytes" {
		t.Fatalf("ca %q", sa.CACert)
	}
	if string(sa.ServiceCACert) != "svc-ca" {
		t.Fatalf("service ca %q", sa.ServiceCACert)
	}
}

func TestLoadServiceAccount_FromFiles(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "token"), []byte("file-token"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "ca.crt"), []byte("file-ca"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "service-ca.crt"), []byte("file-svc-ca"), 0o600); err != nil {
		t.Fatal(err)
	}
	restore := auth.SetServiceAccountDir(dir)
	defer restore()

	cfg := &config.Config{Token: "ignored"}
	sa, ok := auth.LoadServiceAccount(cfg)
	if !ok {
		t.Fatal("expected token from file")
	}
	if sa.Token != "file-token" {
		t.Fatalf("token %q", sa.Token)
	}
	if string(sa.CACert) != "file-ca" {
		t.Fatalf("ca %q", sa.CACert)
	}
	if string(sa.ServiceCACert) != "file-svc-ca" {
		t.Fatalf("service ca %q", sa.ServiceCACert)
	}
}

func TestLoadServiceAccount_Missing(t *testing.T) {
	dir := t.TempDir()
	restore := auth.SetServiceAccountDir(dir)
	defer restore()

	cfg := &config.Config{}
	if _, ok := auth.LoadServiceAccount(cfg); ok {
		t.Fatal("expected missing token")
	}
}

func TestStatusError(t *testing.T) {
	var nilErr *auth.StatusError
	if nilErr.Error() != "status error" {
		t.Fatalf("nil StatusError: %q", nilErr.Error())
	}
	se := &auth.StatusError{Status: 403}
	if se.Error() != "token validation status 403" {
		t.Fatalf("got %q", se.Error())
	}
}

func TestTokenFromRequest_NilRequest(t *testing.T) {
	if got := auth.TokenFromRequest(nil); got != "" {
		t.Fatalf("got %q", got)
	}
}

func TestLoadServiceAccount_InvalidCACertBase64(t *testing.T) {
	dir := t.TempDir()
	restore := auth.SetServiceAccountDir(dir)
	defer restore()
	cfg := &config.Config{Token: "t", CACert: "not-valid-base64!!!", ServiceCACert: "also-invalid"}
	sa, ok := auth.LoadServiceAccount(cfg)
	if !ok || sa.Token != "t" {
		t.Fatalf("token ok=%v sa=%+v", ok, sa)
	}
	if len(sa.CACert) != 0 {
		t.Fatalf("invalid CA should be ignored, got %q", sa.CACert)
	}
	if len(sa.ServiceCACert) != 0 {
		t.Fatalf("invalid service CA env should be ignored, got %q", sa.ServiceCACert)
	}
}

func TestRESTConfig_InsecureWithoutCA(t *testing.T) {
	cfg, err := auth.RESTConfig(&config.Config{ClusterAPIURL: "https://hub.example"}, auth.ServiceAccount{Token: "t"})
	if err != nil {
		t.Fatal(err)
	}
	if !cfg.Insecure {
		t.Fatal("expected insecure without CA")
	}
}

func TestUserRESTConfig(t *testing.T) {
	base := &rest.Config{Host: "https://hub", BearerToken: "sa", BearerTokenFile: "/token"}
	got := auth.UserRESTConfig(base, "user")
	if got.BearerToken != "user" || got.BearerTokenFile != "" || got.Host != base.Host {
		t.Fatalf("config %+v", got)
	}
}

func TestValidateUserTokenStatus_NilConfig(t *testing.T) {
	_, err := auth.ValidateUserTokenStatus(context.Background(), nil, "t")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestValidateUserTokenStatus_CachesClient(t *testing.T) {
	var requests int
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requests++
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()
	base := &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
	if _, err := auth.ValidateUserTokenStatus(context.Background(), base, "a"); err != nil {
		t.Fatal(err)
	}
	if _, err := auth.ValidateUserTokenStatus(context.Background(), base, "b"); err != nil {
		t.Fatal(err)
	}
	if requests != 2 {
		t.Fatalf("requests %d", requests)
	}
}

func TestValidateUserToken_ReturnsStatusError(t *testing.T) {
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusForbidden)
	}))
	defer ts.Close()
	base := &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
	err := auth.ValidateUserToken(context.Background(), base, "t")
	var se *auth.StatusError
	if err == nil || !errors.As(err, &se) || se.Status != http.StatusForbidden {
		t.Fatalf("err %v", err)
	}
}

func TestRequireToken(t *testing.T) {
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	if tok, ok := auth.RequireToken(rec, req); ok || tok != "" {
		t.Fatalf("tok=%q ok=%v", tok, ok)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	req.Header.Set("Authorization", "Bearer yes")
	rec = httptest.NewRecorder()
	tok, ok := auth.RequireToken(rec, req)
	if !ok || tok != "yes" {
		t.Fatalf("tok=%q ok=%v", tok, ok)
	}
}

func TestAuthenticateRequest_StatusAndInternalError(t *testing.T) {
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer ts.Close()
	base := &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer t")
	if _, ok := auth.AuthenticateRequest(context.Background(), base, rec, req); ok {
		t.Fatal("expected failure")
	}
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}

	ts2 := httptest.NewTLSServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	ts2.Close()
	base2 := &rest.Config{Host: ts2.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
	rec = httptest.NewRecorder()
	req = httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer t")
	if _, ok := auth.AuthenticateRequest(context.Background(), base2, rec, req); ok {
		t.Fatal("expected failure")
	}
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

