// Copyright Contributors to the Open Cluster Management project

package sse

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

type flushRecorder struct {
	http.ResponseWriter
	flushed bool
}

func (f *flushRecorder) Flush() { f.flushed = true }

func TestBeginUnauthorizedEmptyToken(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	_, _, ok := Begin(rec, req, StaticAuth{OK: true}, "unauthorized")
	if ok || rec.Code != http.StatusUnauthorized {
		t.Fatalf("code=%d ok=%v", rec.Code, ok)
	}
}

func TestBeginUnauthorizedAuthFail(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.Header.Set("Authorization", "Bearer bad")
	_, _, ok := Begin(rec, req, StaticAuth{OK: false}, "unauthorized")
	if ok || rec.Code != http.StatusUnauthorized {
		t.Fatalf("code=%d ok=%v", rec.Code, ok)
	}
}

func TestBeginOK(t *testing.T) {
	t.Parallel()
	base := httptest.NewRecorder()
	rec := &flushRecorder{ResponseWriter: base}
	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.Header.Set("Authorization", "Bearer tok")
	token, flusher, ok := Begin(rec, req, StaticAuth{OK: true}, "unauthorized")
	if !ok || token != "tok" || flusher == nil {
		t.Fatalf("ok=%v token=%q flusher=%v", ok, token, flusher)
	}
}

func TestBeginNoFlusher(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()
	// httptest.ResponseRecorder does not implement http.Flusher in older setups;
	// wrap to ensure non-flusher path when recorder lacks Flush — use a plain writer.
	w := nonFlusher{ResponseWriter: rec}
	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.Header.Set("Authorization", "Bearer tok")
	_, _, ok := Begin(w, req, StaticAuth{OK: true}, "unauthorized")
	if ok {
		t.Fatal("expected failure without Flusher")
	}
}

type nonFlusher struct{ http.ResponseWriter }

func TestAPIAuthNil(t *testing.T) {
	t.Parallel()
	var a *APIAuth
	ok, err := a.Authenticate(context.Background(), "t")
	if ok || err != nil {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestNewAPIAuth(t *testing.T) {
	t.Parallel()
	a := NewAPIAuth(nil)
	if a == nil || a.Base != nil {
		t.Fatalf("unexpected %+v", a)
	}
}
