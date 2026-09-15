// Copyright Contributors to the Open Cluster Management project

package auth_test

import (
	"context"
	"encoding/base64"
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
