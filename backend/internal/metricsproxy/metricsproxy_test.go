// Copyright Contributors to the Open Cluster Management project

package metricsproxy_test

import (
	"crypto/tls"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/metricsproxy"
)

func newTestHandler(t *testing.T, prefix string, upstream http.Handler) http.Handler {
	t.Helper()
	up := httptest.NewServer(upstream)
	t.Cleanup(up.Close)
	target, err := url.Parse(up.URL)
	if err != nil {
		t.Fatal(err)
	}
	tlsCfg := &tls.Config{InsecureSkipVerify: true} //nolint:gosec // test
	return metricsproxy.New(target, tlsCfg, prefix)
}

func TestUnauthorizedWithoutToken(t *testing.T) {
	h := newTestHandler(t, "/prometheus", http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("upstream should not be called")
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	resp, err := ts.Client().Get(ts.URL + "/prometheus/query")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestPrometheusRewritesToAPIV1(t *testing.T) {
	var capturedPath, capturedQuery, capturedAuth string
	h := newTestHandler(t, "/prometheus", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		capturedQuery = r.URL.RawQuery
		capturedAuth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Audit-Id", "drop")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"status":"success"}`))
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/prometheus/query?query=ALERTS", nil)
	req.Header.Set("Authorization", "Bearer user-token")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("X-Custom", "drop")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if capturedPath != "/api/v1/query" {
		t.Fatalf("path %q", capturedPath)
	}
	if capturedQuery != "query=ALERTS" {
		t.Fatalf("query %q", capturedQuery)
	}
	if capturedAuth != "Bearer user-token" {
		t.Fatalf("auth %q", capturedAuth)
	}
	if string(body) != `{"status":"success"}` {
		t.Fatalf("body %s", body)
	}
	if resp.Header.Get("Content-Type") != "application/json" {
		t.Fatal("missing Content-Type")
	}
	if resp.Header.Get("Audit-Id") != "" {
		t.Fatal("Audit-Id should be filtered")
	}
}

func TestObservabilityRewritesToAPIV1(t *testing.T) {
	var capturedPath string
	h := newTestHandler(t, "/observability", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/observability/query_range", nil)
	req.Header.Set("Authorization", "Bearer t")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if capturedPath != "/api/v1/query_range" {
		t.Fatalf("path %q", capturedPath)
	}
}

func TestCookieToken(t *testing.T) {
	var capturedAuth string
	h := newTestHandler(t, "/prometheus", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/prometheus/query", nil)
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

func TestRequestHeaderAllowlist(t *testing.T) {
	var captured http.Header
	h := newTestHandler(t, "/prometheus", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		captured = r.Header.Clone()
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodPost, ts.URL+"/prometheus/query", strings.NewReader(`{"q":"up"}`))
	req.Header.Set("Authorization", "Bearer t")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Custom-Header", "drop-me")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if captured.Get("X-Custom-Header") != "" {
		t.Fatal("custom header should not be forwarded")
	}
	if captured.Get("Content-Type") != "application/json" {
		t.Fatal("missing Content-Type")
	}
}

func TestParseTarget(t *testing.T) {
	u, err := metricsproxy.ParseTarget("", metricsproxy.DefaultPrometheusURL)
	if err != nil {
		t.Fatal(err)
	}
	if u.String() != metricsproxy.DefaultPrometheusURL {
		t.Fatalf("got %s", u)
	}
	u, err = metricsproxy.ParseTarget("https://prom.example.com", metricsproxy.DefaultPrometheusURL)
	if err != nil {
		t.Fatal(err)
	}
	if u.Host != "prom.example.com" {
		t.Fatalf("host %s", u.Host)
	}
}
