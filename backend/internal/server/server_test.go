// Copyright Contributors to the Open Cluster Management project

package server_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/config"
	"github.com/stolostron/console/backend/internal/oauth"
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

func TestOAuthNotProxiedToSidecar(t *testing.T) {
	var sidecarPaths []string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarPaths = append(sidecarPaths, r.URL.Path)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	oa := oauth.New(oauth.Options{
		ClientID:    "cid",
		RedirectURL: "https://localhost:3000/multicloud/login/callback",
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{
				AuthorizationEndpoint: "https://oauth.example.com/oauth/authorize",
				TokenEndpoint:         "https://oauth.example.com/oauth/token",
			}, nil
		},
	})
	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithOAuth(oa), server.WithOAuthLogin())
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	client := &http.Client{
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	for _, path := range []string{"/login", "/multicloud/login"} {
		sidecarPaths = nil
		resp, getErr := client.Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if len(sidecarPaths) != 0 {
			t.Fatalf("%s proxied to sidecar: %v", path, sidecarPaths)
		}
		if resp.StatusCode != http.StatusFound {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
	}

	sidecarPaths = nil
	resp, err := ts.Client().Get(ts.URL + "/logout")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if len(sidecarPaths) != 0 {
		t.Fatalf("logout proxied: %v", sidecarPaths)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("logout status %d", resp.StatusCode)
	}

	sidecarPaths = nil
	resp, err = ts.Client().Get(ts.URL + "/configure")
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if len(sidecarPaths) != 0 {
		t.Fatalf("configure proxied: %v", sidecarPaths)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("configure status %d", resp.StatusCode)
	}
	if !strings.Contains(string(body), `"token_endpoint":"https://oauth.example.com/oauth/token"`) {
		t.Fatalf("configure body %s", body)
	}
}

func TestStatelessProxiesNotProxiedToSidecar(t *testing.T) {
	var sidecarPaths []string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarPaths = append(sidecarPaths, r.URL.Path)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	ok := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Go", r.URL.Path)
		w.WriteHeader(http.StatusOK)
	})

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg,
		server.WithManagedClusterProxy(ok),
		server.WithPrometheusProxy(ok),
		server.WithObservabilityProxy(ok),
		server.WithVMProxy(ok),
	)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	paths := []string{
		"/managedclusterproxy/c1/api/v1/pods",
		"/multicloud/managedclusterproxy/c1/api",
		"/prometheus/query",
		"/multicloud/prometheus/query",
		"/observability/query",
		"/multicloud/observability/query",
		"/virtualmachines/get/c/n/ns",
		"/multicloud/virtualmachines/start",
		"/virtualmachineinstances/pause",
		"/virtualmachinesnapshots/get/c/n/ns",
		"/virtualmachinerestores",
		"/vmResourceUsage/cluster/c/namespace/ns",
	}
	for _, path := range paths {
		sidecarPaths = nil
		req, _ := http.NewRequest(http.MethodGet, ts.URL+path, nil)
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if len(sidecarPaths) != 0 {
			t.Fatalf("%s was proxied to sidecar: %v", path, sidecarPaths)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if resp.Header.Get("X-Go") != path {
			t.Fatalf("%s X-Go %q", path, resp.Header.Get("X-Go"))
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

func TestOAuthAbsentProxiesToSidecar(t *testing.T) {
	var sidecarPaths []string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarPaths = append(sidecarPaths, r.URL.Path)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	resp, err := ts.Client().Get(ts.URL + "/login")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if len(sidecarPaths) != 1 || sidecarPaths[0] != "/login" {
		t.Fatalf("sidecar paths %v", sidecarPaths)
	}
}

func TestConfigureWithoutLoginNotProxied(t *testing.T) {
	var sidecarPaths []string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarPaths = append(sidecarPaths, r.URL.Path)
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	oa := oauth.New(oauth.Options{
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{TokenEndpoint: "https://oauth.example.com/oauth/token"}, nil
		},
	})
	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithOAuth(oa))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	resp, err := ts.Client().Get(ts.URL + "/multicloud/configure")
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if len(sidecarPaths) != 0 {
		t.Fatalf("configure proxied: %v", sidecarPaths)
	}
	if resp.StatusCode != http.StatusOK || !strings.Contains(string(body), "oauth.example.com") {
		t.Fatalf("status %d body %s", resp.StatusCode, body)
	}

	sidecarPaths = nil
	resp, err = ts.Client().Get(ts.URL + "/login")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if len(sidecarPaths) != 1 || sidecarPaths[0] != "/login" {
		t.Fatalf("login should still proxy without WithOAuthLogin: %v", sidecarPaths)
	}
}

func TestDevelopmentCORSOptionsPreflight(t *testing.T) {
	var k8sCalled bool
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Fatal("sidecar should not be called")
	}))
	defer sidecar.Close()

	k8s := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		k8sCalled = true
		w.WriteHeader(http.StatusOK)
	})

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithK8sProxy(k8s))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{"/api", "/multicloud/api"} {
		k8sCalled = false
		req, _ := http.NewRequest(http.MethodOptions, ts.URL+path, nil)
		req.Header.Set("Origin", "https://localhost:3000")
		req.Header.Set("Access-Control-Request-Method", "GET")
		req.Header.Set("Access-Control-Request-Headers", "authorization,content-type")
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if k8sCalled {
			t.Fatalf("%s reached k8s proxy", path)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if resp.Header.Get("Access-Control-Allow-Origin") != "https://localhost:3000" {
			t.Fatalf("%s allow-origin %q", path, resp.Header.Get("Access-Control-Allow-Origin"))
		}
		if resp.Header.Get("Access-Control-Allow-Credentials") != "true" {
			t.Fatalf("%s missing allow-credentials", path)
		}
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

func TestUnmigratedRoutesStillProxied(t *testing.T) {
	var capturedPath string
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`["/api/v1"]`))
	}))
	defer sidecar.Close()

	ok := http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("go handler should not run")
	})
	k8s := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Fatal("k8s proxy should not handle /apiPaths")
	})

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg,
		server.WithK8sProxy(k8s),
		server.WithPrometheusProxy(ok),
		server.WithManagedClusterProxy(ok),
		server.WithVMProxy(ok),
	)
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{"/multicloud/proxy/search", "/multicloud/events"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if capturedPath != path {
			t.Fatalf("%s sidecar path %q", path, capturedPath)
		}
	}
}

func TestMigratedUserAndClusterInfoNotProxied(t *testing.T) {
	var sidecarHit bool
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarHit = true
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	userH := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"route":"user"}`))
	})
	clusterH := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"route":"cluster"}`))
	})

	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithUser(userH), server.WithClusterInfo(clusterH))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{
		"/hub",
		"/multicloud/hub",
		"/username",
		"/multicloud/authenticated",
		"/apiPaths",
		"/multicloud/operatorCheck",
	} {
		sidecarHit = false
		method := http.MethodGet
		if path == "/multicloud/operatorCheck" {
			method = http.MethodPost
		}
		req, _ := http.NewRequest(method, ts.URL+path, strings.NewReader(`{"operator":"advanced-cluster-management"}`))
		if method == http.MethodPost {
			req.Header.Set("Content-Type", "application/json")
		}
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if sidecarHit {
			t.Fatalf("%s was proxied to sidecar", path)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d body %s", path, resp.StatusCode, body)
		}
	}
}

func TestDebugSnapshotNotProxied(t *testing.T) {
	var sidecarHit bool
	sidecar := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sidecarHit = true
		w.WriteHeader(http.StatusTeapot)
	}))
	defer sidecar.Close()

	dump := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"synced":true,"items":[]}`))
	})
	cfg := &config.Config{NodeBackendURL: sidecar.URL, CertsDir: t.TempDir()}
	h, err := server.Handler(cfg, server.WithDebugSnapshot(dump))
	if err != nil {
		t.Fatal(err)
	}
	ts := httptest.NewServer(h)
	defer ts.Close()

	for _, path := range []string{"/debug/informer-snapshot", "/multicloud/debug/informer-snapshot"} {
		sidecarHit = false
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if sidecarHit {
			t.Fatalf("%s was proxied to sidecar", path)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d body %s", path, resp.StatusCode, body)
		}
	}
}
