// Copyright Contributors to the Open Cluster Management project

package server_test

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/config"
	"github.com/stolostron/console/backend/internal/server"
)

func TestStripMulticloud(t *testing.T) {
	cases := map[string]string{
		"/multicloud":               "/",
		"/multicloud/":              "/",
		"/multicloud/livenessProbe": "/livenessProbe",
		"/multicloud/api/v1/pods":   "/api/v1/pods",
		"/livenessProbe":            "/livenessProbe",
		"/":                         "/",
	}
	for in, want := range cases {
		if got := server.StripMulticloud(in); got != want {
			t.Errorf("StripMulticloud(%q)=%q want %q", in, got, want)
		}
	}
}

func TestProbesAndProxy(t *testing.T) {
	var capturedPath, capturedMethod, capturedBody string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/ping" {
			w.WriteHeader(http.StatusOK)
			return
		}
		capturedPath = r.URL.Path
		capturedMethod = r.Method
		b, _ := io.ReadAll(r.Body)
		capturedBody = string(b)
		w.Header().Set("X-Sidecar", "yes")
		w.WriteHeader(http.StatusTeapot)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer sidecar.Close()

	cfg := &config.Config{
		NodeBackendURL: sidecar.URL,
		CertsDir:       t.TempDir(),
	}
	h, err := server.Handler(cfg)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{"/ping", "/livenessProbe", "/readinessProbe", "/multicloud/ping", "/multicloud/livenessProbe", "/multicloud/readinessProbe"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if len(body) != 0 {
			t.Fatalf("%s expected empty body", path)
		}
	}

	req, _ := http.NewRequest(http.MethodPost, ts.URL+"/multicloud/hub", strings.NewReader("hello"))
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusTeapot {
		t.Fatalf("proxy status %d", resp.StatusCode)
	}
	if string(body) != `{"ok":true}` {
		t.Fatalf("body %s", body)
	}
	if resp.Header.Get("X-Sidecar") != "yes" {
		t.Fatal("missing sidecar header")
	}
	if capturedPath != "/multicloud/hub" {
		t.Fatalf("sidecar path %q, want original /multicloud/hub", capturedPath)
	}
	if capturedMethod != http.MethodPost {
		t.Fatalf("method %s", capturedMethod)
	}
	if capturedBody != "hello" {
		t.Fatalf("body %q", capturedBody)
	}
}

func TestProxyForwardsAuthorization(t *testing.T) {
	var capturedAuth string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedAuth = r.Header.Get("Authorization")
		w.WriteHeader(http.StatusNoContent)
	}))
	defer sidecar.Close()

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/username", nil)
	req.Header.Set("Authorization", "Bearer user-token")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if capturedAuth != "Bearer user-token" {
		t.Fatalf("Authorization %q", capturedAuth)
	}
}

func TestWebSocketUpgradeForwardsOriginalPath(t *testing.T) {
	var capturedPath, capturedUpgrade string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		capturedUpgrade = r.Header.Get("Upgrade")
		w.WriteHeader(http.StatusOK)
	}))
	defer sidecar.Close()

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/proxy/search", nil)
	req.Header.Set("Upgrade", "websocket")
	req.Header.Set("Connection", "Upgrade")
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if capturedPath != "/multicloud/proxy/search" {
		t.Fatalf("path %q", capturedPath)
	}
	if capturedUpgrade != "websocket" {
		t.Fatalf("upgrade %q", capturedUpgrade)
	}
}

func TestRBACEventsNotProxied(t *testing.T) {
	var proxied bool
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxied = true
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	rbac := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("data: {\"type\":\"START\"}\n\n"))
	})
	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithRBACEvents(rbac))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{"/events/rbac", "/multicloud/events/rbac"} {
		proxied = false
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if proxied {
			t.Fatalf("%s was proxied to sidecar", path)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if !strings.Contains(string(body), `"type":"START"`) {
			t.Fatalf("%s body %s", path, body)
		}
	}
}

func TestStaticNotProxiedToSidecar(t *testing.T) {
	var sidecarPaths []string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarPaths = append(sidecarPaths, r.URL.Path)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	staticH := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Static", r.URL.Path)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("plugin"))
	})
	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithStatic(staticH))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{"/plugin/plugin-manifest.json", "/multicloud/plugin/plugin-entry.js", "/index.html", "/"} {
		sidecarPaths = nil
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if len(sidecarPaths) != 0 {
			t.Fatalf("%s proxied to sidecar: %v", path, sidecarPaths)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if string(body) != "plugin" {
			t.Fatalf("%s body %s", path, body)
		}
	}

	sidecarPaths = nil
	resp, err := ts.Client().Get(ts.URL + "/hub")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if len(sidecarPaths) != 1 || sidecarPaths[0] != "/hub" {
		t.Fatalf("hub sidecar paths %v", sidecarPaths)
	}
}

func TestK8sProxyNotProxiedToSidecar(t *testing.T) {
	var sidecarPaths []string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarPaths = append(sidecarPaths, r.URL.Path)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	var k8sPaths []string
	k8s := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		k8sPaths = append(k8sPaths, r.URL.Path)
		w.WriteHeader(http.StatusOK)
	})

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithK8sProxy(k8s))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	paths := []string{
		"/api/v1/namespaces",
		"/apis/apps/v1/deployments",
		"/version",
		"/multicloud/api/v1/pods",
		"/multicloud/apis/rbac.authorization.k8s.io/v1/clusterroles",
		"/multicloud/version/",
	}
	for _, path := range paths {
		sidecarPaths = nil
		k8sPaths = nil
		req, _ := http.NewRequest(http.MethodGet, ts.URL+path, nil)
		req.Header.Set("Authorization", "Bearer token")
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if len(sidecarPaths) != 0 {
			t.Fatalf("%s was proxied to sidecar: %v", path, sidecarPaths)
		}
		if len(k8sPaths) != 1 || k8sPaths[0] != path {
			t.Fatalf("%s k8s paths %v", path, k8sPaths)
		}
	}
}

func TestApiPathsStillProxiedToSidecar(t *testing.T) {
	var capturedPath string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`["/api/v1"]`))
	}))
	defer sidecar.Close()

	k8s := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Fatal("k8s proxy should not handle /apiPaths")
	})

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithK8sProxy(k8s))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{"/apiPaths", "/multicloud/apiPaths"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if capturedPath != path {
			t.Fatalf("%s sidecar path %q", path, capturedPath)
		}
	}

	req, _ := http.NewRequest(http.MethodGet, ts.URL+"/multicloud/hub", nil)
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if capturedPath != "/multicloud/hub" {
		t.Fatalf("hub sidecar path %q", capturedPath)
	}
}
