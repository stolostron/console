// Copyright Contributors to the Open Cluster Management project

package placementdebug

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func authOK(_ http.ResponseWriter, _ *http.Request) (string, bool) {
	return "user-token", true
}

func TestUnauthorized(t *testing.T) {
	h := New(Options{GetCA: func() []byte { return []byte("ca") }})
	req := httptest.NewRequest(http.MethodPost, "/placement-debug", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized || rec.Body.Len() != 0 {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestUnavailableWithoutCA(t *testing.T) {
	h := New(Options{Authn: authOK, GetCA: func() []byte { return nil }})
	req := httptest.NewRequest(http.MethodPost, "/placement-debug", strings.NewReader(`{"placement":"test"}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status %d", rec.Code)
	}
	var out map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out["error"], "OCM CA bundle") {
		t.Fatalf("%v", out)
	}
}

func TestProxiesUpstream(t *testing.T) {
	var gotAuth, gotHost, gotCT, gotCookie string
	var gotBody []byte
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotHost = r.Host
		gotCT = r.Header.Get("Content-Type")
		gotCookie = r.Header.Get("Cookie")
		gotBody, _ = io.ReadAll(r.Body)
		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("X-Secret", "nope")
		_, _ = w.Write([]byte(`{"aggregatedScores":[]}`))
	}))
	defer upstream.Close()

	h := New(Options{
		Authn:    authOK,
		GetCA:    func() []byte { return []byte("-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----") },
		Endpoint: func() string { return upstream.URL + "/debug/placements/" },
	})
	req := httptest.NewRequest(http.MethodPost, "/placement-debug", strings.NewReader(`{"placement":"test"}`))
	req.Header.Set("Authorization", "Bearer user-token")
	req.Header.Set("Cookie", "session=secret")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if gotAuth != "Bearer user-token" {
		t.Fatalf("auth %q", gotAuth)
	}
	if gotCookie != "" {
		t.Fatalf("cookie forwarded %q", gotCookie)
	}
	if gotCT != "application/json" {
		t.Fatalf("content-type %q", gotCT)
	}
	if string(gotBody) != `{"placement":"test"}` {
		t.Fatalf("body %s", gotBody)
	}
	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("resp ct %q", rec.Header().Get("Content-Type"))
	}
	if rec.Header().Get("X-Secret") != "" {
		t.Fatal("non-allowlisted response header forwarded")
	}
	if gotHost == "" {
		t.Fatal("missing host")
	}
}
