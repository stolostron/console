// Copyright Contributors to the Open Cluster Management project

package mcproxy_test

import (
	"context"
	"crypto/tls"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/clusterproxy"
	"github.com/stolostron/console/backend/internal/mcproxy"
)

func newHandler(t *testing.T, upstream http.Handler) http.Handler {
	t.Helper()
	up := httptest.NewTLSServer(upstream)
	t.Cleanup(up.Close)
	target, err := url.Parse(up.URL)
	if err != nil {
		t.Fatal(err)
	}
	return mcproxy.New(mcproxy.Options{
		Resolver:  &clusterproxy.Resolver{Target: target},
		TLSConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec // test server
		Validate:  func(context.Context, string) error { return nil },
	})
}

func TestUnauthorizedWithoutToken(t *testing.T) {
	h := newHandler(t, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("upstream should not be called")
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	resp, err := ts.Client().Get(ts.URL + "/managedclusterproxy/c1/api/v1/pods")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestRewritesPathAndSetsHeaders(t *testing.T) {
	var capturedPath, capturedQuery, capturedAuth, capturedHost, capturedOrigin, capturedMethod string
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		capturedQuery = r.URL.RawQuery
		capturedAuth = r.Header.Get("Authorization")
		capturedHost = r.Host
		capturedOrigin = r.Header.Get("Origin")
		capturedMethod = r.Method
		w.Header().Set("X-Upstream", "yes")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/managedclusterproxy/testcluster/api/v1/pods?watch=true", nil)
	req.Header.Set("Authorization", "Bearer user-token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d body %s", resp.StatusCode, body)
	}
	if capturedPath != "/testcluster/api/v1/pods" {
		t.Fatalf("path %q", capturedPath)
	}
	if capturedQuery != "watch=true" {
		t.Fatalf("query %q", capturedQuery)
	}
	if capturedAuth != "Bearer user-token" {
		t.Fatalf("auth %q", capturedAuth)
	}
	if capturedMethod != http.MethodGet {
		t.Fatalf("method %s", capturedMethod)
	}
	if capturedOrigin == "" || capturedHost == "" {
		t.Fatalf("host %q origin %q", capturedHost, capturedOrigin)
	}
	if string(body) != `{"ok":true}` {
		t.Fatalf("body %s", body)
	}
	if resp.Header.Get("X-Upstream") != "yes" {
		t.Fatal("upstream header not forwarded")
	}
}

func TestCookieToken(t *testing.T) {
	var capturedAuth string
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/managedclusterproxy/c1/api", nil)
	req.AddCookie(&http.Cookie{Name: auth.AccessTokenCookie, Value: "cookie-token"})
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if capturedAuth != "Bearer cookie-token" {
		t.Fatalf("auth %q", capturedAuth)
	}
}

func TestPassesThroughStatus(t *testing.T) {
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusForbidden)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/managedclusterproxy/c1/api", nil)
	req.Header.Set("Authorization", "Bearer t")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestValidateFailureStatus(t *testing.T) {
	h := mcproxy.New(mcproxy.Options{
		Resolver: &clusterproxy.Resolver{HostOverride: "127.0.0.1"},
		Validate: func(context.Context, string) error {
			return &auth.StatusError{Status: http.StatusUnauthorized}
		},
	})
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/managedclusterproxy/c1/api", nil)
	req.Header.Set("Authorization", "Bearer bad")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestUnreachableUpstream(t *testing.T) {
	h := mcproxy.New(mcproxy.Options{
		Resolver:  &clusterproxy.Resolver{HostOverride: "127.0.0.1"},
		TLSConfig: &tls.Config{InsecureSkipVerify: true}, //nolint:gosec // test
		Validate:  func(context.Context, string) error { return nil },
	})
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/managedclusterproxy/c1/api", nil)
	req.Header.Set("Authorization", "Bearer t")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status %d", resp.StatusCode)
	}
}
