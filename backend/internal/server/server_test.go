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
	"github.com/stolostron/console/backend/internal/rosa"
	"github.com/stolostron/console/backend/internal/server"
)

func testCfg(t *testing.T) *config.Config {
	t.Helper()
	return &config.Config{CertsDir: t.TempDir()}
}

func newHandler(t *testing.T, opts ...server.Option) http.Handler {
	t.Helper()
	h, err := server.Handler(testCfg(t), opts...)
	if err != nil {
		t.Fatal(err)
	}
	return h
}

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

func TestProbes(t *testing.T) {
	ts := httptest.NewServer(newHandler(t))
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
}

func TestUnknownRouteNotFound(t *testing.T) {
	ts := httptest.NewServer(newHandler(t))
	defer ts.Close()

	req, _ := http.NewRequest(http.MethodPost, ts.URL+"/multicloud/hub", strings.NewReader("hello"))
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if len(body) != 0 {
		t.Fatalf("body %s", body)
	}
}

func TestUnknownMethodNotAllowed(t *testing.T) {
	ts := httptest.NewServer(newHandler(t))
	defer ts.Close()

	req, _ := http.NewRequest(http.MethodDelete, ts.URL+"/ping", nil)
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusMethodNotAllowed {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestRBACEventsRegistered(t *testing.T) {
	rbac := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("data: {\"type\":\"START\"}\n\n"))
	})
	ts := httptest.NewServer(newHandler(t, server.WithRBACEvents(rbac)))
	defer ts.Close()

	for _, path := range []string{"/events/rbac", "/multicloud/events/rbac"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if !strings.Contains(string(body), `"type":"START"`) {
			t.Fatalf("%s body %s", path, body)
		}
	}
}

func TestEventsRegistered(t *testing.T) {
	events := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("id:1\ndata:{\"type\":\"START\"}\n\n"))
	})
	ts := httptest.NewServer(newHandler(t, server.WithEvents(events)))
	defer ts.Close()

	for _, path := range []string{"/events", "/multicloud/events"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if !strings.Contains(string(body), `"type":"START"`) {
			t.Fatalf("%s body %s", path, body)
		}
	}
}

func TestEventsWithoutHandlerReturns404(t *testing.T) {
	ts := httptest.NewServer(newHandler(t))
	defer ts.Close()

	resp, err := ts.Client().Get(ts.URL + "/events")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestOAuthRegistered(t *testing.T) {
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
	ts := httptest.NewServer(newHandler(t, server.WithOAuth(oa), server.WithOAuthLogin()))
	defer ts.Close()

	client := &http.Client{
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}
	for _, path := range []string{"/login", "/multicloud/login"} {
		resp, getErr := client.Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusFound {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
	}

	resp, err := ts.Client().Get(ts.URL + "/logout")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("logout status %d", resp.StatusCode)
	}

	resp, err = ts.Client().Get(ts.URL + "/configure")
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("configure status %d", resp.StatusCode)
	}
	if !strings.Contains(string(body), `"token_endpoint":"https://oauth.example.com/oauth/token"`) {
		t.Fatalf("configure body %s", body)
	}
}

func TestStatelessProxiesRegistered(t *testing.T) {
	ok := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Go", r.URL.Path)
		w.WriteHeader(http.StatusOK)
	})

	ts := httptest.NewServer(newHandler(t,
		server.WithManagedClusterProxy(ok),
		server.WithPrometheusProxy(ok),
		server.WithObservabilityProxy(ok),
		server.WithVMProxy(ok),
	))
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
		req, _ := http.NewRequest(http.MethodGet, ts.URL+path, nil)
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if resp.Header.Get("X-Go") != path {
			t.Fatalf("%s X-Go %q", path, resp.Header.Get("X-Go"))
		}
	}
}

func TestStaticServedUnknownAPINotFound(t *testing.T) {
	staticH := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Static", r.URL.Path)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("plugin"))
	})
	ts := httptest.NewServer(newHandler(t, server.WithStatic(staticH)))
	defer ts.Close()

	for _, path := range []string{"/plugin/plugin-manifest.json", "/multicloud/plugin/plugin-entry.js", "/index.html", "/"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
		if string(body) != "plugin" {
			t.Fatalf("%s body %s", path, body)
		}
	}

	resp, err := ts.Client().Get(ts.URL + "/hub")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("hub status %d", resp.StatusCode)
	}
}

func TestLoginWithoutOAuthReturns404(t *testing.T) {
	ts := httptest.NewServer(newHandler(t))
	defer ts.Close()

	resp, err := ts.Client().Get(ts.URL + "/login")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestConfigureWithoutLoginLeavesLoginUnregistered(t *testing.T) {
	oa := oauth.New(oauth.Options{
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{TokenEndpoint: "https://oauth.example.com/oauth/token"}, nil
		},
	})
	ts := httptest.NewServer(newHandler(t, server.WithOAuth(oa)))
	defer ts.Close()

	resp, err := ts.Client().Get(ts.URL + "/multicloud/configure")
	if err != nil {
		t.Fatal(err)
	}
	body, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK || !strings.Contains(string(body), "oauth.example.com") {
		t.Fatalf("status %d body %s", resp.StatusCode, body)
	}

	resp, err = ts.Client().Get(ts.URL + "/login")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("login without WithOAuthLogin status %d", resp.StatusCode)
	}
}

func TestDevelopmentCORSOptionsPreflight(t *testing.T) {
	var k8sCalled bool
	k8s := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		k8sCalled = true
		w.WriteHeader(http.StatusOK)
	})

	ts := httptest.NewServer(newHandler(t, server.WithK8sProxy(k8s)))
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

func TestK8sProxyRegistered(t *testing.T) {
	var k8sPaths []string
	k8s := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		k8sPaths = append(k8sPaths, r.URL.Path)
		w.WriteHeader(http.StatusOK)
	})

	ts := httptest.NewServer(newHandler(t, server.WithK8sProxy(k8s)))
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
		k8sPaths = nil
		req, _ := http.NewRequest(http.MethodGet, ts.URL+path, nil)
		req.Header.Set("Authorization", "Bearer token")
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if len(k8sPaths) != 1 || k8sPaths[0] != path {
			t.Fatalf("%s k8s paths %v", path, k8sPaths)
		}
	}
}

func TestUnregisteredRoutesReturn404(t *testing.T) {
	ok := http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("go handler should not run")
	})
	k8s := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		t.Fatal("k8s proxy should not handle /apiPaths")
	})

	ts := httptest.NewServer(newHandler(t,
		server.WithK8sProxy(k8s),
		server.WithPrometheusProxy(ok),
		server.WithManagedClusterProxy(ok),
		server.WithVMProxy(ok),
	))
	defer ts.Close()

	for _, path := range []string{"/multicloud/proxy/search", "/multicloud/events"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusNotFound {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
	}
}

func TestMigratedUserAndClusterInfoRegistered(t *testing.T) {
	userH := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"route":"user"}`))
	})
	clusterH := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"route":"cluster"}`))
	})

	ts := httptest.NewServer(newHandler(t, server.WithUser(userH), server.WithClusterInfo(clusterH)))
	defer ts.Close()

	for _, path := range []string{
		"/hub",
		"/multicloud/hub",
		"/username",
		"/multicloud/authenticated",
		"/apiPaths",
		"/multicloud/operatorCheck",
	} {
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
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d body %s", path, resp.StatusCode, body)
		}
	}
}

func TestDebugSnapshotRegistered(t *testing.T) {
	dump := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"synced":true,"items":[]}`))
	})
	ts := httptest.NewServer(newHandler(t, server.WithDebugSnapshot(dump)))
	defer ts.Close()

	for _, path := range []string{"/debug/informer-snapshot", "/multicloud/debug/informer-snapshot"} {
		resp, getErr := ts.Client().Get(ts.URL + path)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d body %s", path, resp.StatusCode, body)
		}
	}
}

func TestAggregateRegistered(t *testing.T) {
	agg := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	})
	ts := httptest.NewServer(newHandler(t, server.WithAggregate(agg)))
	defer ts.Close()

	for _, path := range []string{"/aggregate/applications", "/multicloud/aggregate/statuses", "/aggregate/appSetData"} {
		req, _ := http.NewRequest(http.MethodPost, ts.URL+path, strings.NewReader(`{}`))
		req.Header.Set("Content-Type", "application/json")
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d body %s", path, resp.StatusCode, body)
		}
	}
}

func TestSearchRegistered(t *testing.T) {
	searchH := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	})
	ts := httptest.NewServer(newHandler(t, server.WithSearchProxy(searchH)))
	defer ts.Close()

	for _, path := range []string{"/proxy/search", "/multicloud/proxy/search"} {
		req, _ := http.NewRequest(http.MethodPost, ts.URL+path, strings.NewReader(`{}`))
		req.Header.Set("Content-Type", "application/json")
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d body %s", path, resp.StatusCode, body)
		}

		req, _ = http.NewRequest(http.MethodGet, ts.URL+path, nil)
		req.Header.Set("Upgrade", "websocket")
		req.Header.Set("Connection", "Upgrade")
		resp, getErr = ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s websocket status %d", path, resp.StatusCode)
		}
	}
}

func TestLongTailRegistered(t *testing.T) {
	ok := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	ts := httptest.NewServer(newHandler(t,
		server.WithRosa(ok),
		server.WithAnsibleTower(ok),
		server.WithPlacementDebug(ok),
		server.WithUpgradeRisks(ok),
	))
	defer ts.Close()

	paths := []string{
		"/ansibletower", "/multicloud/ansibletower",
		"/placement-debug", "/multicloud/placement-debug",
		"/upgrade-risks-prediction", "/multicloud/upgrade-risks-prediction",
	}
	for _, p := range rosa.Routes {
		paths = append(paths, p, "/multicloud"+p)
	}
	for _, path := range paths {
		req, _ := http.NewRequest(http.MethodPost, ts.URL+path, strings.NewReader(`{}`))
		req.Header.Set("Content-Type", "application/json")
		resp, getErr := ts.Client().Do(req)
		if getErr != nil {
			t.Fatal(getErr)
		}
		resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("%s status %d", path, resp.StatusCode)
		}
	}
}
