// Copyright Contributors to the Open Cluster Management project

package health_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/stolostron/console/backend/internal/health"
)

func TestPingAndLiveness(t *testing.T) {
	p := health.New(nil, nil)
	for _, fn := range []http.HandlerFunc{p.Ping, p.Liveness} {
		rec := httptest.NewRecorder()
		fn(rec, httptest.NewRequest(http.MethodGet, "/", nil))
		if rec.Code != http.StatusOK {
			t.Fatalf("status %d", rec.Code)
		}
		if rec.Body.Len() != 0 {
			t.Fatalf("expected empty body, got %q", rec.Body.String())
		}
	}
}

func TestLivenessDead(t *testing.T) {
	p := health.New(nil, nil)
	p.SetLive(false)
	rec := httptest.NewRecorder()
	p.Liveness(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestReadinessRequiresSidecar(t *testing.T) {
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/ping" {
			t.Errorf("path %s", r.URL.Path)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer sidecar.Close()
	u, _ := url.Parse(sidecar.URL)
	p := health.New(u, nil)
	rec := httptest.NewRecorder()
	p.Readiness(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestReadinessSidecarDown(t *testing.T) {
	u, _ := url.Parse("http://127.0.0.1:1")
	p := health.New(u, nil)
	rec := httptest.NewRecorder()
	p.Readiness(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
	_, _ = io.ReadAll(rec.Body)
}
