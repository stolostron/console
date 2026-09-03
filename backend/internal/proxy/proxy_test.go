// Copyright Contributors to the Open Cluster Management project

package proxy_test

import (
	"crypto/tls"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/proxy"
)

func newHandler(t *testing.T, upstream http.Handler) http.Handler {
	t.Helper()
	up := httptest.NewServer(upstream)
	t.Cleanup(up.Close)
	target, err := url.Parse(up.URL)
	if err != nil {
		t.Fatal(err)
	}
	return proxy.New(target, nil)
}

func TestPreservesOriginalPath(t *testing.T) {
	var capturedPath string
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	for _, path := range []string{"/multicloud/hub", "/proxy/search", "/events"} {
		resp, err := ts.Client().Get(ts.URL + path)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if capturedPath != path {
			t.Fatalf("%s: upstream path %q", path, capturedPath)
		}
	}
}

func TestForwardsQueryMethodAndBody(t *testing.T) {
	var capturedPath, capturedQuery, capturedMethod, capturedBody string
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		capturedQuery = r.URL.RawQuery
		capturedMethod = r.Method
		b, _ := io.ReadAll(r.Body)
		capturedBody = string(b)
		w.WriteHeader(http.StatusCreated)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	body := `{"q":"clusters"}`
	req, _ := http.NewRequest(http.MethodPost, ts.URL+"/multicloud/proxy/search?limit=10", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if capturedPath != "/multicloud/proxy/search" {
		t.Fatalf("path %q", capturedPath)
	}
	if capturedQuery != "limit=10" {
		t.Fatalf("query %q", capturedQuery)
	}
	if capturedMethod != http.MethodPost {
		t.Fatalf("method %q", capturedMethod)
	}
	if capturedBody != body {
		t.Fatalf("body %q", capturedBody)
	}
}

func TestSetsUpstreamHost(t *testing.T) {
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Captured-Host", r.Host)
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(up.Close)
	target, err := url.Parse(up.URL)
	if err != nil {
		t.Fatal(err)
	}
	h := proxy.New(target, nil)
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	resp, err := ts.Client().Get(ts.URL + "/ping")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	wantHost := target.Host
	if got := resp.Header.Get("X-Captured-Host"); got != wantHost {
		t.Fatalf("upstream Host %q want %q", got, wantHost)
	}
}

func TestForwardsRequestHeaders(t *testing.T) {
	var captured http.Header
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		captured = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/events", nil)
	req.Header.Set("Authorization", "Bearer user-token")
	req.Header.Set("Accept-Encoding", "gzip")
	req.Header.Set("X-Custom", "keep-me")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if captured.Get("Authorization") != "Bearer user-token" {
		t.Fatalf("Authorization %q", captured.Get("Authorization"))
	}
	if captured.Get("Accept-Encoding") != "gzip" {
		t.Fatal("missing Accept-Encoding")
	}
	if captured.Get("X-Custom") != "keep-me" {
		t.Fatal("custom header not forwarded")
	}
}

func TestPassesThroughResponse(t *testing.T) {
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Sidecar", "yes")
		w.WriteHeader(http.StatusTeapot)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	resp, err := ts.Client().Get(ts.URL + "/multicloud/hub")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusTeapot {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if string(body) != `{"ok":true}` {
		t.Fatalf("body %q", body)
	}
	if resp.Header.Get("Content-Type") != "application/json" {
		t.Fatal("missing Content-Type")
	}
	if resp.Header.Get("X-Sidecar") != "yes" {
		t.Fatal("missing X-Sidecar")
	}
}

func TestHTTPSUpstreamWithTLSConfig(t *testing.T) {
	var hit bool
	up := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		hit = true
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(up.Close)
	target, err := url.Parse(up.URL)
	if err != nil {
		t.Fatal(err)
	}
	h := proxy.New(target, &tls.Config{InsecureSkipVerify: true}) //nolint:gosec // test server
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	resp, err := ts.Client().Get(ts.URL + "/ping")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if !hit {
		t.Fatal("TLS upstream not reached")
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestBadGatewayWhenUpstreamUnreachable(t *testing.T) {
	target, err := url.Parse("http://127.0.0.1:1")
	if err != nil {
		t.Fatal(err)
	}
	h := proxy.New(target, nil)
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	resp, err := ts.Client().Get(ts.URL + "/multicloud/hub")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadGateway {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestForwardsWebSocketUpgradeHeaders(t *testing.T) {
	var capturedUpgrade, capturedConnection string
	h := newHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedUpgrade = r.Header.Get("Upgrade")
		capturedConnection = r.Header.Get("Connection")
		w.WriteHeader(http.StatusSwitchingProtocols)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/ws", nil)
	req.Header.Set("Connection", "Upgrade")
	req.Header.Set("Upgrade", "websocket")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if capturedUpgrade != "websocket" {
		t.Fatalf("Upgrade %q", capturedUpgrade)
	}
	if !strings.EqualFold(capturedConnection, "Upgrade") {
		t.Fatalf("Connection %q", capturedConnection)
	}
}
