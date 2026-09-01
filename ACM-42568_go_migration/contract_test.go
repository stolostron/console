/* Copyright Contributors to the Open Cluster Management project */

package contract

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

func catalogDir(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	return filepath.Join(filepath.Dir(file), "catalog")
}

func TestCatalogAgainstBackend(t *testing.T) {
	cfg := LoadConfig()
	if cfg.Token == "" {
		cfg.Token = ocToken()
	}
	if err := ProbeBackend(cfg); err != nil {
		t.Skipf("backend not reachable at %s: %v (set CONTRACT_BACKEND_URL and start npm run plugins)", cfg.BackendURL, err)
	}
	if cfg.Token == "" {
		t.Fatal("CONTRACT_TOKEN is empty (export CONTRACT_TOKEN=$(oc whoami -t))")
	}

	cases, resources, err := LoadCatalog(catalogDir(t))
	if err != nil {
		t.Fatal(err)
	}
	watched := WatchedKindSet(resources)
	t.Logf("backend=%s cases=%d mode=%s", cfg.BackendURL, len(cases), cfg.Mode)

	for _, cs := range cases {
		cs := cs
		paths := []string{cs.Path}
		if cs.AlsoMulticloud {
			paths = append(paths, cfg.MulticloudPath(cs.Path))
		}
		for _, p := range paths {
			p := p
			name := cs.ID
			if p != cs.Path {
				name += "/multicloud"
			}
			t.Run(name, func(t *testing.T) {
				runCase(t, cfg, cs, p, watched)
			})
		}
	}
}

func runCase(t *testing.T, cfg Config, cs Case, path string, watched map[string]struct{}) {
	t.Helper()
	switch strings.ToLower(cs.Kind) {
	case "sse":
		cap, _, err := cfg.CaptureSSE(cfg.BackendURL, cs, path, timeoutFor(cfg, cs))
		if err != nil {
			failOrSkip(t, wrapSoft(cs, err))
			return
		}
		if err := AssertCapture(cs, cap, watched); err != nil {
			failOrSkip(t, err)
			return
		}
		recordAndCompare(t, cfg, cs, path, cap)
	case "websocket":
		if err := cfg.RunWebSocket(cfg.BackendURL, cs, path); err != nil {
			failOrSkip(t, err)
			return
		}
		if cfg.CompareURL != "" {
			if err := cfg.RunWebSocket(cfg.CompareURL, cs, path); err != nil {
				failOrSkip(t, err)
			}
		}
	default:
		cap, err := cfg.Do(cfg.NewHTTPClient(timeoutFor(cfg, cs)), cfg.BackendURL, cs, path)
		if err != nil {
			failOrSkip(t, wrapSoft(cs, err))
			return
		}
		if err := AssertCapture(cs, cap, watched); err != nil {
			failOrSkip(t, err)
			return
		}
		recordAndCompare(t, cfg, cs, path, cap)
	}
}

func recordAndCompare(t *testing.T, cfg Config, cs Case, path string, cap Capture) {
	t.Helper()
	if cfg.Mode == ModeRecord || os.Getenv("CONTRACT_RECORD") == "1" {
		rec := Recorded{
			ID:      cs.ID,
			Path:    path,
			Status:  cap.Status,
			Headers: NormalizeHeaders(cap.HeaderMap()),
			Body:    NormalizeBody(cap.Decoded),
		}
		if err := WriteRecord(cfg.RecordDir, rec); err != nil {
			t.Fatalf("record: %v", err)
		}
	}
	if cfg.CompareURL == "" || strings.EqualFold(cs.Kind, "sse") || strings.EqualFold(cs.Kind, "websocket") {
		return
	}
	other, err := cfg.Do(cfg.NewHTTPClient(timeoutFor(cfg, cs)), cfg.CompareURL, cs, path)
	if err != nil {
		t.Fatalf("compare request: %v", err)
	}
	if err := DiffCaptures(cap, other); err != nil {
		t.Fatalf("compare %s: %v", cfg.CompareURL, err)
	}
}

func failOrSkip(t *testing.T, err error) {
	t.Helper()
	if IsSoftSkip(err) {
		t.Skip(err.Error())
		return
	}
	t.Fatal(err)
}

func wrapSoft(cs Case, err error) error {
	if err == nil {
		return nil
	}
	if IsSoftSkip(err) {
		return err
	}
	if cs.Soft {
		return skipSoft(err.Error())
	}
	return err
}

func timeoutFor(cfg Config, cs Case) time.Duration {
	if cs.TimeoutSeconds > 0 {
		return time.Duration(cs.TimeoutSeconds) * time.Second
	}
	if strings.EqualFold(cs.Kind, "sse") {
		return cfg.SSETimeout
	}
	return cfg.HTTPTimeout
}

func ocToken() string {
	cmd := exec.Command("oc", "whoami", "-t")
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}

func TestLoadCatalog(t *testing.T) {
	cases, resources, err := LoadCatalog(catalogDir(t))
	if err != nil {
		t.Fatal(err)
	}
	if len(cases) < 40 {
		t.Fatalf("expected a full catalog, got %d cases", len(cases))
	}
	if len(resources) < 50 {
		t.Fatalf("expected watched resources, got %d", len(resources))
	}
	seen := map[string]struct{}{}
	for _, c := range cases {
		if c.ID == "" {
			t.Fatal("case missing id")
		}
		if _, ok := seen[c.ID]; ok {
			t.Fatalf("duplicate case id %s", c.ID)
		}
		seen[c.ID] = struct{}{}
	}
}

func TestParseSSE(t *testing.T) {
	raw := []byte("id:1\ndata:{\"type\":\"START\"}\n\n: keepalive\n\nid:2\ndata:{\"type\":\"SETTINGS\",\"settings\":{\"LOG_LEVEL\":\"info\"}}\n\nid:3\ndata:{\"type\":\"LOADED\"}\n\n")
	events, err := ParseSSE(raw)
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 3 {
		t.Fatalf("got %d events: %+v", len(events), events)
	}
	if sseType(events[0]) != "START" || sseType(events[2]) != "LOADED" {
		t.Fatalf("types: %+v", events)
	}
	exp := &SSEExpect{FirstType: "START", LastType: "LOADED", RequireTypes: []string{"START", "SETTINGS", "LOADED"}, SettingsKeys: []string{"LOG_LEVEL"}}
	if err := AssertSSE(exp, events, nil); err != nil {
		t.Fatal(err)
	}
}

func TestNormalizeBodyStripsUID(t *testing.T) {
	raw := []byte(`{"kind":"Namespace","metadata":{"name":"default","uid":"abc","resourceVersion":"1","creationTimestamp":"2024-01-01T00:00:00Z"}}`)
	got := NormalizeBody(raw)
	m := got.(map[string]any)["metadata"].(map[string]any)
	if _, ok := m["uid"]; ok {
		t.Fatal("uid should be stripped")
	}
	if m["name"] != "default" {
		t.Fatalf("name=%v", m["name"])
	}
}

func TestResolveURL(t *testing.T) {
	cfg := Config{BackendURL: "https://localhost:4000"}
	if u := cfg.ResolveURL(cfg.BackendURL, "/ping"); u != "https://localhost:4000/ping" {
		t.Fatal(u)
	}
	cfg.PathPrefix = "/api/proxy/plugin/mce/console/multicloud"
	if u := cfg.ResolveURL(cfg.BackendURL, "/ping"); !strings.HasSuffix(u, "/api/proxy/plugin/mce/console/multicloud/ping") {
		t.Fatal(u)
	}
}

func TestMulticloudPath(t *testing.T) {
	cfg := Config{}
	if p := cfg.MulticloudPath("/ping"); p != "/multicloud/ping" {
		t.Fatal(p)
	}
}

func Example_run() {
	fmt.Println("CONTRACT_BACKEND_URL=https://localhost:4000 CONTRACT_TOKEN=$(oc whoami -t) go test ./...")
}
