// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/informers"
)

type concurrentRecorder struct {
	mu  sync.Mutex
	rec *httptest.ResponseRecorder
}

func newConcurrentRecorder() *concurrentRecorder {
	return &concurrentRecorder{rec: httptest.NewRecorder()}
}

func (c *concurrentRecorder) Header() http.Header {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.rec.Header()
}

func (c *concurrentRecorder) Write(b []byte) (int, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.rec.Write(b)
}

func (c *concurrentRecorder) WriteHeader(code int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.rec.WriteHeader(code)
}

func (c *concurrentRecorder) Flush() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.rec.Flush()
}

func (c *concurrentRecorder) Code() int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.rec.Code
}

func (c *concurrentRecorder) BodyString() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.rec.Body.String()
}

func waitBody(t *testing.T, rec *concurrentRecorder, cancel context.CancelFunc, substr string) string {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	var body string
	for time.Now().Before(deadline) {
		body = rec.BodyString()
		if strings.Contains(body, substr) {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	if !strings.Contains(body, substr) {
		t.Fatalf("missing %s in %s", substr, body)
	}
	return body
}

func TestHandlerUnauthorized(t *testing.T) {
	h := NewHandler(New(nil, nil), StaticAuth{OK: true}, AllowAllAccess{})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/events", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}

	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.Header.Set("Authorization", "Bearer bad")
	h = NewHandler(New(nil, nil), StaticAuth{OK: false}, AllowAllAccess{})
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}
}

func TestHandlerSnapshotSSE(t *testing.T) {
	scheme := runtime.NewScheme()
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	listKinds := map[schema.GroupVersionResource]string{gvr: "NamespaceList"}
	ns := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "v1", "kind": "Namespace",
		"metadata": map[string]any{"name": "default", "uid": "uid-ns"},
	}}
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, ns)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"v1": {GroupVersion: "v1", APIResources: []metav1.APIResource{
			{Name: "namespaces", Kind: "Namespace", Verbs: []string{"list", "watch"}},
		}},
	}}
	ctx, cancelCache := context.WithCancel(context.Background())
	defer cancelCache()
	cache := informers.New([]informers.WatchSpec{{Kind: "Namespace", APIVersion: "v1", ForwardEventsToClients: true}})
	informers.StartCache(ctx, cache, client, mapper)
	deadline := time.Now().Add(8 * time.Second)
	for time.Now().Before(deadline) {
		if cache.HasSynced() {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if !cache.HasSynced() {
		t.Fatal("cache sync")
	}

	hub := New(cache, func() map[string]string { return map[string]string{"LOG_LEVEL": "info"} })
	h := NewHandler(hub, StaticAuth{OK: true}, AllowAllAccess{})

	reqCtx, cancel := context.WithCancel(context.Background())
	req := httptest.NewRequest(http.MethodGet, "/events", nil).WithContext(reqCtx)
	req.AddCookie(&http.Cookie{Name: auth.AccessTokenCookie, Value: "user-token"})
	rec := newConcurrentRecorder()
	done := make(chan struct{})
	go func() {
		h.ServeHTTP(rec, req)
		close(done)
	}()
	body := waitBody(t, rec, cancel, `"type":"LOADED"`)
	<-done

	if rec.Code() != http.StatusOK {
		t.Fatalf("status %d", rec.Code())
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "text/event-stream") {
		t.Fatalf("content-type %s", ct)
	}
	if rec.Header().Get("Cache-Control") != "no-store, no-transform" {
		t.Fatalf("cache-control %s", rec.Header().Get("Cache-Control"))
	}
	if rec.Header().Get("Content-Encoding") != "identity" {
		t.Fatalf("encoding %s", rec.Header().Get("Content-Encoding"))
	}
	cookie := rec.Header().Get("Set-Cookie")
	if !strings.Contains(cookie, "watch=") || !strings.Contains(cookie, "HttpOnly") {
		t.Fatalf("watch cookie %s", cookie)
	}
	for _, typ := range []string{"START", "SETTINGS", "MODIFIED", "EOP", "LOADED"} {
		if !strings.Contains(body, `"type":"`+typ+`"`) {
			t.Fatalf("missing %s in %s", typ, body)
		}
	}
	if strings.Contains(body, `"type":"ADDED"`) {
		t.Fatal("GET /events must not emit ADDED")
	}
	if !strings.Contains(body, `"LOG_LEVEL":"info"`) {
		t.Fatalf("settings %s", body)
	}
	if !strings.HasPrefix(strings.TrimSpace(body), "id:") {
		t.Fatalf("want id: prefix %s", body)
	}
	if strings.Contains(body, "id: ") {
		t.Fatal("no space after id:")
	}

	var payload struct {
		Type   string          `json:"type"`
		Object json.RawMessage `json:"object"`
	}
	foundModified := false
	for _, line := range strings.Split(body, "\n") {
		if !strings.HasPrefix(line, "data:") || strings.HasPrefix(line, "data: ") {
			if strings.HasPrefix(line, "data: ") {
				t.Fatal("data: must not have a space (Node createEventString)")
			}
			continue
		}
		raw := strings.TrimPrefix(line, "data:")
		if err := json.Unmarshal([]byte(raw), &payload); err != nil {
			t.Fatal(err)
		}
		if payload.Type == TypeModified {
			foundModified = true
			if !strings.Contains(string(payload.Object), "default") {
				t.Fatalf("object %s", payload.Object)
			}
		}
	}
	if !foundModified {
		t.Fatal("expected MODIFIED")
	}
}

func TestHandlerSSARDenyOmitsResource(t *testing.T) {
	hub := New(nil, nil)
	h := NewHandler(hub, StaticAuth{OK: true}, denyAccess{})
	reqCtx, cancel := context.WithCancel(context.Background())
	req := httptest.NewRequest(http.MethodGet, "/events", nil).WithContext(reqCtx)
	req.Header.Set("Authorization", "Bearer user")
	rec := newConcurrentRecorder()
	done := make(chan struct{})
	go func() {
		h.ServeHTTP(rec, req)
		close(done)
	}()
	waitBody(t, rec, func() {}, `"type":"LOADED"`)
	hub.OnResource(informers.ResourceEvent{
		Type: TypeModified,
		Object: &unstructured.Unstructured{Object: map[string]any{
			"kind": "Secret", "apiVersion": "v1",
			"metadata": map[string]any{"name": "creds", "namespace": "ns"},
		}},
	})
	time.Sleep(50 * time.Millisecond)
	cancel()
	<-done
	if strings.Contains(rec.BodyString(), "creds") {
		t.Fatalf("denied resource leaked: %s", rec.BodyString())
	}
}

type denyAccess struct{}

func (denyAccess) Allow(_ context.Context, _ string, ev Event) (bool, error) {
	if ev.Type == TypeModified {
		return false, nil
	}
	return true, nil
}

func (denyAccess) Prefetch(context.Context, string, []Event) {}

type errAccess struct{}

func (errAccess) Allow(_ context.Context, _ string, ev Event) (bool, error) {
	if ev.Type == TypeModified {
		return false, errors.New("ssar down")
	}
	return true, nil
}

func (errAccess) Prefetch(context.Context, string, []Event) {}

func TestHandlerLiveModifiedThenLoaded(t *testing.T) {
	hub := New(nil, nil)
	h := NewHandler(hub, StaticAuth{OK: true}, AllowAllAccess{})
	reqCtx, cancel := context.WithCancel(context.Background())
	req := httptest.NewRequest(http.MethodGet, "/events", nil).WithContext(reqCtx)
	req.Header.Set("Authorization", "Bearer user")
	rec := newConcurrentRecorder()
	done := make(chan struct{})
	go func() {
		h.ServeHTTP(rec, req)
		close(done)
	}()
	waitBody(t, rec, func() {}, `"type":"LOADED"`)
	hub.OnResource(informers.ResourceEvent{
		Type: TypeDeleted,
		Object: &unstructured.Unstructured{Object: map[string]any{
			"kind": "Namespace", "apiVersion": "v1",
			"metadata": map[string]any{"name": "gone", "namespace": ""},
		}},
	})
	deadline := time.Now().Add(2 * time.Second)
	var body string
	for time.Now().Before(deadline) {
		body = rec.BodyString()
		if strings.Contains(body, `"type":"DELETED"`) && strings.Count(body, `"type":"LOADED"`) >= 2 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	<-done
	if !strings.Contains(body, `"type":"DELETED"`) {
		t.Fatalf("missing DELETED %s", body)
	}
	if strings.Count(body, `"type":"LOADED"`) < 2 {
		t.Fatalf("live DELETED should be followed by LOADED: %s", body)
	}
	for _, line := range strings.Split(body, "\n") {
		if !strings.Contains(line, `"type":"DELETED"`) {
			continue
		}
		if strings.Contains(line, `"uid"`) {
			t.Fatalf("DELETED must be minimal: %s", line)
		}
	}
}

type staticMapper struct {
	lists map[string]*metav1.APIResourceList
}

func (m staticMapper) ServerResourcesForGroupVersion(gv string) (*metav1.APIResourceList, error) {
	if l, ok := m.lists[gv]; ok {
		return l, nil
	}
	return &metav1.APIResourceList{GroupVersion: gv}, nil
}

func TestHubAPIAuth(t *testing.T) {
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("Authorization") != "Bearer good" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer ts.Close()
	base := &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
	a := NewAPIAuth(base)
	ok, err := a.Authenticate(context.Background(), "good")
	if err != nil || !ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
	var nilAuth *APIAuth
	ok, err = nilAuth.Authenticate(context.Background(), "x")
	if err != nil || ok {
		t.Fatalf("nil ok=%v err=%v", ok, err)
	}
}

func TestNewHandlerNilAccessDefaultsAllowAll(t *testing.T) {
	h := NewHandler(New(nil, nil), StaticAuth{OK: true}, nil)
	if h == nil || h.access == nil {
		t.Fatal("expected default access")
	}
}

type noFlushHubResponse struct {
	header http.Header
	code   int
}

func (w *noFlushHubResponse) Header() http.Header {
	if w.header == nil {
		w.header = make(http.Header)
	}
	return w.header
}

func (w *noFlushHubResponse) Write(b []byte) (int, error) { return len(b), nil }

func (w *noFlushHubResponse) WriteHeader(status int) { w.code = status }

func TestHandlerStreamingUnsupported(t *testing.T) {
	h := NewHandler(New(nil, nil), StaticAuth{OK: true}, AllowAllAccess{})
	rec := &noFlushHubResponse{}
	req := httptest.NewRequest(http.MethodGet, "/events", nil)
	req.Header.Set("Authorization", "Bearer tok")
	h.ServeHTTP(rec, req)
	if rec.code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.code)
	}
}

func TestHandlerLiveSSARErrorSkipsResource(t *testing.T) {
	hub := New(nil, nil)
	h := NewHandler(hub, StaticAuth{OK: true}, errAccess{})
	reqCtx, cancel := context.WithCancel(context.Background())
	req := httptest.NewRequest(http.MethodGet, "/events", nil).WithContext(reqCtx)
	req.Header.Set("Authorization", "Bearer user")
	rec := newConcurrentRecorder()
	go func() { h.ServeHTTP(rec, req) }()
	waitBody(t, rec, func() {}, `"type":"LOADED"`)
	hub.OnResource(informers.ResourceEvent{
		Type: TypeModified,
		Object: &unstructured.Unstructured{Object: map[string]any{
			"kind": "Secret", "apiVersion": "v1",
			"metadata": map[string]any{"name": "creds", "namespace": "ns"},
		}},
	})
	time.Sleep(50 * time.Millisecond)
	cancel()
	if strings.Contains(rec.BodyString(), "creds") {
		t.Fatalf("ssar error leaked resource: %s", rec.BodyString())
	}
}

func TestMarshalEventSettingsEmpty(t *testing.T) {
	body, err := marshalEvent(Event{Type: TypeSettings, Settings: nil})
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(body), `"settings":{}`) {
		t.Fatalf("body %s", body)
	}
}

func TestWriteEventNoFlush(t *testing.T) {
	rec := httptest.NewRecorder()
	enc := newStreamEncoder(rec, rec, "identity")
	if err := writeEvent(enc, Event{Type: TypeStart}, false); err != nil {
		t.Fatal(err)
	}
	enc.Close()
}
