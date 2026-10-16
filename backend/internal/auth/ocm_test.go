// Copyright Contributors to the Open Cluster Management project

package auth_test

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/auth"
)

func TestOCMServiceToken(t *testing.T) {
	var posted url.Values
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/auth/realms/redhat-external/protocol/openid-connect/token" {
			http.NotFound(w, r)
			return
		}
		b, _ := io.ReadAll(r.Body)
		posted, _ = url.ParseQuery(string(b))
		if r.Header.Get("Content-Type") != "application/x-www-form-urlencoded" {
			t.Errorf("content-type %q", r.Header.Get("Content-Type"))
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"mock-access-token"}`))
	}))
	defer sso.Close()
	restore := auth.SetOCMTokenURL(sso.URL + "/auth/realms/redhat-external/protocol/openid-connect/token")
	defer restore()

	id := base64.StdEncoding.EncodeToString([]byte("my-client-id"))
	secret := base64.StdEncoding.EncodeToString([]byte("my-client-secret"))
	tok, err := auth.OCMServiceToken(context.Background(), sso.Client(), id, secret)
	if err != nil {
		t.Fatal(err)
	}
	if tok != "mock-access-token" {
		t.Fatalf("token %q", tok)
	}
	if posted.Get("grant_type") != "client_credentials" {
		t.Fatalf("grant %q", posted.Get("grant_type"))
	}
	if posted.Get("client_id") != "my-client-id" || posted.Get("client_secret") != "my-client-secret" {
		t.Fatalf("decoded fields %v", posted)
	}
}

func TestOCMServiceToken_Error(t *testing.T) {
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte("Invalid credentials"))
	}))
	defer sso.Close()
	restore := auth.SetOCMTokenURL(sso.URL)
	defer restore()
	id := base64.StdEncoding.EncodeToString([]byte("id"))
	secret := base64.StdEncoding.EncodeToString([]byte("secret"))
	_, err := auth.OCMServiceToken(context.Background(), sso.Client(), id, secret)
	if err == nil || !strings.Contains(err.Error(), "token exchange failed (401): Invalid credentials") {
		t.Fatalf("err %v", err)
	}
}

func TestTLSConfigFromCA_AppendsPEM(t *testing.T) {
	cfg := auth.TLSConfigFromCA([]byte("not-pem"), true)
	if cfg.MinVersion != tls.VersionTLS12 {
		t.Fatalf("min version %d", cfg.MinVersion)
	}
	if cfg.RootCAs == nil {
		t.Fatal("expected root pool")
	}
	client := auth.HTTPClient(nil, 0)
	if client.Timeout == 0 || client.Transport == nil {
		t.Fatal("expected timeout and transport")
	}
}

func TestOCMServiceToken_NilClientUsesDefault(t *testing.T) {
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"via-default"}`))
	}))
	defer sso.Close()
	restore := auth.SetOCMTokenURL(sso.URL)
	defer restore()
	id := base64.StdEncoding.EncodeToString([]byte("id"))
	secret := base64.StdEncoding.EncodeToString([]byte("secret"))
	tok, err := auth.OCMServiceToken(context.Background(), nil, id, secret)
	if err != nil {
		t.Fatal(err)
	}
	if tok != "via-default" {
		t.Fatalf("token %q", tok)
	}
}

func TestOCMServiceToken_MissingAccessToken(t *testing.T) {
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"token_type":"bearer"}`))
	}))
	defer sso.Close()
	restore := auth.SetOCMTokenURL(sso.URL)
	defer restore()
	_, err := auth.OCMServiceToken(context.Background(), sso.Client(), "id", "secret")
	if err == nil || !strings.Contains(err.Error(), "missing access_token") {
		t.Fatalf("err %v", err)
	}
}

func TestOCMServiceToken_InvalidJSON(t *testing.T) {
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`not-json`))
	}))
	defer sso.Close()
	restore := auth.SetOCMTokenURL(sso.URL)
	defer restore()
	_, err := auth.OCMServiceToken(context.Background(), sso.Client(), "id", "secret")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestOCMServiceToken_PlainAndRawBase64Credentials(t *testing.T) {
	forms := make(chan url.Values, 3)
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		posted, _ := url.ParseQuery(string(b))
		forms <- posted
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"ok"}`))
	}))
	defer sso.Close()
	restore := auth.SetOCMTokenURL(sso.URL)
	defer restore()

	// Non-base64 values are returned as-is.
	_, err := auth.OCMServiceToken(context.Background(), sso.Client(), "plain-id", "plain-secret")
	if err != nil {
		t.Fatal(err)
	}
	posted := <-forms
	if posted.Get("client_id") != "plain-id" || posted.Get("client_secret") != "plain-secret" {
		t.Fatalf("posted %v", posted)
	}

	// Raw (unpadded) standard encoding also works.
	rawID := base64.RawStdEncoding.EncodeToString([]byte("raw-id"))
	rawSecret := base64.RawStdEncoding.EncodeToString([]byte("raw-secret"))
	_, err = auth.OCMServiceToken(context.Background(), sso.Client(), rawID, rawSecret)
	if err != nil {
		t.Fatal(err)
	}
	posted = <-forms
	if posted.Get("client_id") != "raw-id" || posted.Get("client_secret") != "raw-secret" {
		t.Fatalf("posted %v", posted)
	}

	// Empty credentials stay empty.
	_, err = auth.OCMServiceToken(context.Background(), sso.Client(), "", "")
	if err != nil {
		t.Fatal(err)
	}
	posted = <-forms
	if posted.Get("client_id") != "" || posted.Get("client_secret") != "" {
		t.Fatalf("posted %v", posted)
	}
}
