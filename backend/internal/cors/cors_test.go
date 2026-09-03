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
