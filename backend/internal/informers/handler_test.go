// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"k8s.io/client-go/rest"
)

func TestNewSnapshotHandler(t *testing.T) {
	c := newCache(nil)
	h := NewSnapshotHandler(c, &rest.Config{Host: "https://example.com"})
	if h.Cache != c || h.Base == nil {
		t.Fatal("constructor")
	}
}

func TestSnapshotHandlerNoToken(t *testing.T) {
	h := NewSnapshotHandler(newCache(nil), nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/debug/informer-snapshot", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestSnapshotHandlerTokenValidationFails(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer srv.Close()

	c := newCache([]WatchSpec{watch("Namespace", "v1")})
	c.states[0].synced.Store(true)
	h := NewSnapshotHandler(c, &rest.Config{Host: srv.URL})

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/debug/informer-snapshot", nil)
	req.Header.Set("Authorization", "Bearer bad")
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestSnapshotHandlerExcludePolled(t *testing.T) {
	c := newCache([]WatchSpec{
		watch("Namespace", "v1"),
		watch("Application", "argoproj.io/v1alpha1").polled(),
	})
	c.states[0].informer = newTestInformer(t, uObj("v1", "Namespace", "", "default", "uid-ns", nil))
	c.states[0].synced.Store(true)
	c.states[1].informer = newTestInformer(t, uObj("argoproj.io/v1alpha1", "Application", "ns", "app", "uid-app", nil))
	c.states[1].synced.Store(true)

	h := NewSnapshotHandler(c, nil)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/debug/informer-snapshot?excludePolled=true", nil)
	req.Header.Set("Authorization", "Bearer test")
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var doc SnapshotDoc
	if err := json.Unmarshal(rec.Body.Bytes(), &doc); err != nil {
		t.Fatal(err)
	}
	for _, item := range doc.Items {
		if item.Kind == "Application" {
			t.Fatalf("polled item should be excluded: %+v", doc.Items)
		}
	}
	if !strings.Contains(rec.Body.String(), `"kind":"Namespace"`) {
		t.Fatalf("body %s", rec.Body.String())
	}
}

func TestExcludePolledNilCache(t *testing.T) {
	items := []ResourceKey{{Kind: "Application", APIVersion: "argoproj.io/v1alpha1", Name: "x"}}
	got := excludePolled(items, nil)
	if len(got) != 1 {
		t.Fatalf("got %d", len(got))
	}
}
