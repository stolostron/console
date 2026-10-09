// Copyright Contributors to the Open Cluster Management project

package health_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stolostron/console/backend/internal/health"
)

func TestPingAndLiveness(t *testing.T) {
	p := health.New()
	for _, fn := range []http.HandlerFunc{p.Ping, p.Liveness, p.Readiness} {
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
	p := health.New()
	p.SetLive(false)
	rec := httptest.NewRecorder()
	p.Liveness(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestReadinessDead(t *testing.T) {
	p := health.New()
	p.SetLive(false)
	rec := httptest.NewRecorder()
	p.Readiness(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}
