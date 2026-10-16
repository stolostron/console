// Copyright Contributors to the Open Cluster Management project

package cors_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stolostron/console/backend/internal/cors"
)

func TestMiddleware_ProductionPassthrough(t *testing.T) {
	var called bool
	h := cors.Middleware(true)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusTeapot)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodOptions, ts.URL, nil)
	req.Header.Set("Origin", "https://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if !called {
		t.Fatal("expected handler to run in production")
	}
	if resp.StatusCode != http.StatusTeapot {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if resp.Header.Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("unexpected CORS headers in production")
	}
}

func TestMiddleware_DevelopmentOptionsPreflight(t *testing.T) {
	var called bool
	h := cors.Middleware(false)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusTeapot)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodOptions, ts.URL, nil)
	req.Header.Set("Origin", "https://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	req.Header.Set("Access-Control-Request-Headers", "authorization,content-type")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if called {
		t.Fatal("handler should not run for OPTIONS preflight")
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if resp.Header.Get("Access-Control-Allow-Origin") != "https://localhost:3000" {
		t.Fatalf("allow-origin %q", resp.Header.Get("Access-Control-Allow-Origin"))
	}
	if resp.Header.Get("Access-Control-Allow-Credentials") != "true" {
		t.Fatal("missing allow-credentials")
	}
	if resp.Header.Get("Access-Control-Allow-Methods") != "GET" {
		t.Fatalf("allow-methods %q", resp.Header.Get("Access-Control-Allow-Methods"))
	}
	if resp.Header.Get("Access-Control-Allow-Headers") != "authorization,content-type" {
		t.Fatalf("allow-headers %q", resp.Header.Get("Access-Control-Allow-Headers"))
	}
	if !headerHas(resp.Header, "Vary", "Origin") {
		t.Fatalf("vary %q", resp.Header.Values("Vary"))
	}
}

func TestMiddleware_DevelopmentNonOptionsAddsHeaders(t *testing.T) {
	h := cors.Middleware(false)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	req, _ := http.NewRequest(http.MethodGet, ts.URL, nil)
	req.Header.Set("Origin", "https://localhost:3001")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if resp.Header.Get("Access-Control-Allow-Origin") != "https://localhost:3001" {
		t.Fatalf("allow-origin %q", resp.Header.Get("Access-Control-Allow-Origin"))
	}
	if resp.Header.Get("Access-Control-Allow-Credentials") != "true" {
		t.Fatal("missing allow-credentials")
	}
}

func TestMiddleware_DevelopmentAllowlist(t *testing.T) {
	var called bool
	h := cors.Middleware(false)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	allowed := []string{
		"http://localhost:3000",
		"https://localhost:3000",
		"http://localhost:3001",
		"https://localhost:3001",
		"http://localhost:3002",
		"https://localhost:3002",
	}
	for _, origin := range allowed {
		called = false
		req, _ := http.NewRequest(http.MethodGet, ts.URL, nil)
		req.Header.Set("Origin", origin)
		resp, err := ts.Client().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if !called {
			t.Fatalf("%s did not reach handler", origin)
		}
		if resp.Header.Get("Access-Control-Allow-Origin") != origin {
			t.Fatalf("%s allow-origin %q", origin, resp.Header.Get("Access-Control-Allow-Origin"))
		}
		if resp.Header.Get("Access-Control-Allow-Credentials") != "true" {
			t.Fatalf("%s missing allow-credentials", origin)
		}
		if !headerHas(resp.Header, "Vary", "Origin") {
			t.Fatalf("%s vary %q", origin, resp.Header.Values("Vary"))
		}
	}
}

func TestMiddleware_DevelopmentRejectsUnlistedOrigin(t *testing.T) {
	var called bool
	h := cors.Middleware(false)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		called = true
		w.WriteHeader(http.StatusNoContent)
	}))
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)

	denied := []string{
		"https://evil.example",
		"https://localhost:4000",
		"http://127.0.0.1:3000",
	}
	for _, origin := range denied {
		called = false
		req, _ := http.NewRequest(http.MethodOptions, ts.URL, nil)
		req.Header.Set("Origin", origin)
		req.Header.Set("Access-Control-Request-Method", "GET")
		req.Header.Set("Access-Control-Request-Headers", "authorization")
		resp, err := ts.Client().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if called {
			t.Fatalf("%s OPTIONS reached handler", origin)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", origin, resp.StatusCode)
		}
		if resp.Header.Get("Access-Control-Allow-Origin") != "" {
			t.Fatalf("%s allow-origin %q", origin, resp.Header.Get("Access-Control-Allow-Origin"))
		}
		if resp.Header.Get("Access-Control-Allow-Credentials") != "" {
			t.Fatalf("%s allow-credentials %q", origin, resp.Header.Get("Access-Control-Allow-Credentials"))
		}
		if resp.Header.Get("Access-Control-Allow-Methods") != "" || resp.Header.Get("Access-Control-Allow-Headers") != "" {
			t.Fatalf("%s echoed preflight headers", origin)
		}
		if !headerHas(resp.Header, "Vary", "Origin") {
			t.Fatalf("%s OPTIONS vary %q", origin, resp.Header.Values("Vary"))
		}

		called = false
		req, _ = http.NewRequest(http.MethodGet, ts.URL, nil)
		req.Header.Set("Origin", origin)
		resp, err = ts.Client().Do(req)
		if err != nil {
			t.Fatal(err)
		}
		resp.Body.Close()
		if !called {
			t.Fatalf("%s GET did not reach handler", origin)
		}
		if resp.Header.Get("Access-Control-Allow-Origin") != "" || resp.Header.Get("Access-Control-Allow-Credentials") != "" {
			t.Fatalf("%s GET set CORS headers", origin)
		}
		if !headerHas(resp.Header, "Vary", "Origin") {
			t.Fatalf("%s GET vary %q", origin, resp.Header.Values("Vary"))
		}
	}
}

func headerHas(h http.Header, key, want string) bool {
	for _, v := range h.Values(key) {
		if v == want {
			return true
		}
	}
	return false
}
