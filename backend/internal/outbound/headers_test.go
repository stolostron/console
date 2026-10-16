// Copyright Contributors to the Open Cluster Management project

package outbound

import (
	"github.com/stolostron/console/backend/internal/httpx"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCopyRequestHeaders(t *testing.T) {
	t.Parallel()
	src := http.Header{}
	src.Set(httpx.HeaderAccept, httpx.MIMEJSON)
	src.Set("X-Other", "nope")
	dst := http.Header{}
	CopyRequestHeaders(dst, src, "tok", ProxyRequestHeaders)
	if dst.Get(httpx.HeaderAccept) != httpx.MIMEJSON {
		t.Fatalf("Accept=%q", dst.Get("Accept"))
	}
	if dst.Get("Authorization") != "Bearer tok" {
		t.Fatalf("Authorization=%q", dst.Get("Authorization"))
	}
	if dst.Get("X-Other") != "" {
		t.Fatal("unexpected X-Other")
	}
}

func TestFilterResponseHeaders(t *testing.T) {
	t.Parallel()
	resp := &http.Response{Header: http.Header{}}
	resp.Header.Set("Content-Type", "text/plain")
	resp.Header.Set("X-Drop", "1")
	if err := FilterResponseHeaders(resp, ProxyResponseHeaders); err != nil {
		t.Fatal(err)
	}
	if resp.Header.Get("Content-Type") != "text/plain" || resp.Header.Get("X-Drop") != "" {
		t.Fatalf("headers=%v", resp.Header)
	}
}

func TestBadGateway(t *testing.T) {
	t.Parallel()
	rec := httptest.NewRecorder()
	BadGateway(rec, nil, nil)
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("code=%d", rec.Code)
	}
}
