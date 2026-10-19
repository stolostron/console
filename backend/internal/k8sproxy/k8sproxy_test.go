// Copyright Contributors to the Open Cluster Management project

package k8sproxy_test

import (
	"crypto/tls"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"testing"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/httpx"
	"github.com/stolostron/console/backend/internal/k8sproxy"
)

func newTestHandler(t *testing.T, upstream http.Handler) (*httptest.Server, http.Handler) {
	t.Helper()
	up := httptest.NewServer(upstream)
	t.Cleanup(up.Close)
	clusterURL, err := url.Parse(up.URL)
	if err != nil {
		t.Fatal(err)
	}
	tlsCfg := &tls.Config{InsecureSkipVerify: true} //nolint:gosec // test server
	return up, k8sproxy.New(clusterURL, tlsCfg)
}

func drainResponse(t *testing.T, resp *http.Response) {
	t.Helper()
	if _, err := io.Copy(io.Discard, resp.Body); err != nil {
		t.Fatal(err)
	}
}

func TestUnauthorizedWithoutToken(t *testing.T) {
	var called atomic.Bool
	_, h := newTestHandler(t, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called.Store(true)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	resp, err := ts.Client().Get(ts.URL + "/api/v1/namespaces")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if len(body) != 0 {
		t.Fatalf("expected empty body, got %q", body)
	}
	if called.Load() {
		t.Fatal("upstream should not be called")
	}
}

func TestForwardsBearerToken(t *testing.T) {
	var capturedAuth string
	var capturedMu sync.Mutex
	_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedMu.Lock()
		capturedAuth = r.Header.Get("Authorization")
		capturedMu.Unlock()
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/api/v1/namespaces", nil)
	req.Header.Set("Authorization", "Bearer user-token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	capturedMu.Lock()
	defer capturedMu.Unlock()
	if capturedAuth != "Bearer user-token" {
		t.Fatalf("Authorization %q", capturedAuth)
	}
}

func TestCookieTokenWinsOverBearer(t *testing.T) {
	var capturedAuth string
	var capturedMu sync.Mutex
	_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedMu.Lock()
		capturedAuth = r.Header.Get("Authorization")
		capturedMu.Unlock()
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/api/v1/namespaces", nil)
	req.AddCookie(&http.Cookie{Name: auth.AccessTokenCookie, Value: "cookie-token"})
	req.Header.Set("Authorization", "Bearer header-token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	capturedMu.Lock()
	defer capturedMu.Unlock()
	if capturedAuth != "Bearer cookie-token" {
		t.Fatalf("Authorization %q", capturedAuth)
	}
}

func TestStripsMulticloudPrefix(t *testing.T) {
	var capturedPath, capturedQuery string
	var capturedMu sync.Mutex
	_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedMu.Lock()
		capturedPath = r.URL.Path
		capturedQuery = r.URL.RawQuery
		capturedMu.Unlock()
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/api/v1/namespaces?foo=bar", nil)
	req.Header.Set("Authorization", "Bearer token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	capturedMu.Lock()
	defer capturedMu.Unlock()
	if capturedPath != "/api/v1/namespaces" {
		t.Fatalf("path %q", capturedPath)
	}
	if capturedQuery != "foo=bar" {
		t.Fatalf("query %q", capturedQuery)
	}
}

func TestRequestHeaderAllowlist(t *testing.T) {
	var captured http.Header
	var capturedMu sync.Mutex
	_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedMu.Lock()
		captured = r.Header.Clone()
		capturedMu.Unlock()
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodPost, ts.URL+"/api/v1/namespaces", strings.NewReader(`{"kind":"Namespace"}`))
	req.Header.Set("Authorization", "Bearer token")
	req.Header.Set(httpx.HeaderAccept, httpx.MIMEJSON)
	req.Header.Set("Accept-Encoding", "gzip")
	req.Header.Set(httpx.HeaderContentType, httpx.MIMEJSON)
	req.Header.Set("Content-Length", "20")
	req.Header.Set("X-Custom-Header", "drop-me")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	capturedMu.Lock()
	defer capturedMu.Unlock()

	if captured.Get("Authorization") != "Bearer token" {
		t.Fatalf("Authorization %q", captured.Get("Authorization"))
	}
	if captured.Get(httpx.HeaderAccept) != httpx.MIMEJSON {
		t.Fatal("missing Accept")
	}
	if captured.Get("X-Custom-Header") != "" {
		t.Fatal("custom header should not be forwarded")
	}
	if captured.Get("X-Forwarded-For") != "" {
		t.Fatal("X-Forwarded-For should not be set")
	}
}

func TestResponseHeaderAllowlist(t *testing.T) {
	_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set(httpx.HeaderContentType, httpx.MIMEJSON)
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Audit-Id", "secret")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/api/v1/namespaces", nil)
	req.Header.Set("Authorization", "Bearer token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	if resp.Header.Get(httpx.HeaderContentType) != httpx.MIMEJSON {
		t.Fatal("missing Content-Type")
	}
	if resp.Header.Get("Cache-Control") != "no-cache" {
		t.Fatal("missing Cache-Control")
	}
	if resp.Header.Get("Audit-Id") != "" {
		t.Fatal("Audit-Id should be filtered")
	}
}

func TestPassesThroughStatusCodes(t *testing.T) {
	cases := []int{http.StatusOK, http.StatusUnauthorized, http.StatusForbidden}
	for _, want := range cases {
		t.Run(http.StatusText(want), func(t *testing.T) {
			_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(want)
			}))
			ts := httptest.NewServer(h)
			t.Cleanup(ts.Close)

			req, _ := http.NewRequest(http.MethodGet, ts.URL+"/api/v1/namespaces", nil)
			req.Header.Set("Authorization", "Bearer token")
			resp, err := ts.Client().Do(req)
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()
			drainResponse(t, resp)
			if resp.StatusCode != want {
				t.Fatalf("status %d want %d", resp.StatusCode, want)
			}
		})
	}
}

func TestStreamsRequestBody(t *testing.T) {
	var capturedBody string
	var capturedMu sync.Mutex
	_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		capturedMu.Lock()
		capturedBody = string(b)
		capturedMu.Unlock()
		w.WriteHeader(http.StatusCreated)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	body := `{"kind":"Namespace"}`
	req, _ := http.NewRequest(http.MethodPost, ts.URL+"/apis/apps/v1/namespaces/default/deployments", strings.NewReader(body))
	req.Header.Set("Authorization", "Bearer token")
	req.Header.Set(httpx.HeaderContentType, httpx.MIMEJSON)
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status %d", resp.StatusCode)
	}
	capturedMu.Lock()
	defer capturedMu.Unlock()
	if capturedBody != body {
		t.Fatalf("body %q", capturedBody)
	}
}

func TestBadGatewayWhenUpstreamUnreachable(t *testing.T) {
	clusterURL, err := url.Parse("https://127.0.0.1:1")
	if err != nil {
		t.Fatal(err)
	}
	h := k8sproxy.New(clusterURL, k8sproxy.TLSConfigFromCA(nil))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/api/v1/namespaces", nil)
	req.Header.Set("Authorization", "Bearer token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	if resp.StatusCode != http.StatusBadGateway {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestVersionPath(t *testing.T) {
	var capturedPath string
	var capturedMu sync.Mutex
	_, h := newTestHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedMu.Lock()
		capturedPath = r.URL.Path
		capturedMu.Unlock()
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/version/", nil)
	req.Header.Set("Authorization", "Bearer token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	drainResponse(t, resp)
	capturedMu.Lock()
	defer capturedMu.Unlock()
	if capturedPath != "/version/" {
		t.Fatalf("path %q", capturedPath)
	}
}
