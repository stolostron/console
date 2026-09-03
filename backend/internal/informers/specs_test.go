// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"testing"
)

func TestDefaultWatchSpecsCount(t *testing.T) {
	specs := DefaultWatchSpecs()
	if len(specs) != 67 {
		t.Fatalf("got %d specs, want 67", len(specs))
	}
	var polled, cacheOnly, withSel int
	for _, s := range specs {
		if s.Polled {
			polled++
		}
		if !s.ForwardEventsToClients {
			cacheOnly++
		}
		if len(s.LabelSelector) > 0 || len(s.FieldSelector) > 0 {
			withSel++
		}
	}
	if polled != 2 {
		t.Fatalf("polled=%d want 2", polled)
	}
	if cacheOnly != 1 {
		t.Fatalf("cacheOnly=%d want 1 (Authentication)", cacheOnly)
	}
	if withSel != 12 {
		t.Fatalf("selector specs=%d want 12", withSel)
	}
}

func TestDefaultWatchSpecsMatchEventsTS(t *testing.T) {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("caller")
	}
	eventsPath := filepath.Join(filepath.Dir(file), "..", "..", "..", "backend-node", "src", "routes", "events.ts")
	src, err := os.ReadFile(eventsPath)
	if err != nil {
		t.Fatal(err)
	}
	tsKeys := parseEventsSpecKeys(t, src)
	if len(tsKeys) != 67 {
		t.Fatalf("events.ts keys=%d", len(tsKeys))
	}
	got := map[string]WatchSpec{}
	for _, s := range DefaultWatchSpecs() {
		got[s.SpecKey()] = s
	}
	for k := range tsKeys {
		if _, ok := got[k]; !ok {
			t.Errorf("missing spec %s", k)
		}
	}
	for k, s := range got {
		if _, ok := tsKeys[k]; !ok {
			t.Errorf("extra spec %s (%s %s)", k, s.APIVersion, s.Kind)
		}
	}
}

func TestWatchSpecBuilders(t *testing.T) {
	s := watch("Secret", "v1").
		labels("cluster.open-cluster-management.io/type", "ans").
		fields("metadata.name", "auto-import-secret").
		polled().
		cacheOnly()
	if s.LabelSelector["cluster.open-cluster-management.io/type"] != "ans" {
		t.Fatal("labels")
	}
	if s.FieldSelector["metadata.name"] != "auto-import-secret" {
		t.Fatal("fields")
	}
	if !s.Polled || s.ForwardEventsToClients {
		t.Fatal("polled/cacheOnly")
	}
	key := s.SpecKey()
	want := "v1|Secret|cluster.open-cluster-management.io/type=ans|metadata.name=auto-import-secret"
	if key != want {
		t.Fatalf("got %q want %q", key, want)
	}
}

func TestWatchSpecDefaultForwardsEvents(t *testing.T) {
	s := watch("Namespace", "v1")
	if !s.ForwardEventsToClients {
		t.Fatal("default should forward")
	}
}

func TestSelectorQueryEmpty(t *testing.T) {
	if SelectorQuery(nil) != "" {
		t.Fatal("expected empty")
	}
}

func TestSelectorQueryOrder(t *testing.T) {
	got := SelectorQuery(map[string]string{"metadata.namespace": "mce", "metadata.name": "svc"})
	if got != "metadata.name=svc,metadata.namespace=mce" {
		t.Fatal(got)
	}
}

var (
	kindRE       = regexp.MustCompile(`kind:\s*'([^']+)'`)
	apiVersionRE = regexp.MustCompile(`apiVersion:\s*'([^']+)'`)
	selectorRE   = regexp.MustCompile(`'([^']+)':\s*'([^']*)'`)
)

func parseEventsSpecKeys(t *testing.T, src []byte) map[string]struct{} {
	t.Helper()
	s := string(src)
	marker := "const definitions: IWatchOptions[] = ["
	start := strings.Index(s, marker)
	if start < 0 {
		t.Fatal("definitions not found")
	}
	rest := s[start+len(marker):]
	end := strings.Index(rest, "\nexport function startWatching")
	body := rest[:end]
	var lines []string
	for _, line := range strings.Split(body, "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), "//") {
			continue
		}
		lines = append(lines, line)
	}
	body = strings.Join(lines, "\n")
	keys := map[string]struct{}{}
	depth, objStart, inQ := 0, -1, false
	for i := 0; i < len(body); i++ {
		c := body[i]
		if c == '\'' && (i == 0 || body[i-1] != '\\') {
			inQ = !inQ
			continue
		}
		if inQ {
			continue
		}
		switch c {
		case '{':
			if depth == 0 {
				objStart = i
			}
			depth++
		case '}':
			depth--
			if depth == 0 && objStart >= 0 {
				obj := body[objStart : i+1]
				km := kindRE.FindStringSubmatch(obj)
				am := apiVersionRE.FindStringSubmatch(obj)
				labels := map[string]string{}
				fields := map[string]string{}
				if j := strings.Index(obj, "labelSelector:"); j >= 0 {
					labels = parseSel(obj[j:])
				}
				if j := strings.Index(obj, "fieldSelector:"); j >= 0 {
					fields = parseSel(obj[j:])
				}
				key := am[1] + "|" + km[1] + "|" + SelectorQuery(labels) + "|" + SelectorQuery(fields)
				keys[key] = struct{}{}
				objStart = -1
			}
		}
	}
	return keys
}

func parseSel(s string) map[string]string {
	b := strings.Index(s, "{")
	e := strings.Index(s[b:], "}")
	inner := s[b : b+e]
	out := map[string]string{}
	for _, m := range selectorRE.FindAllStringSubmatch(inner, -1) {
		out[m[1]] = m[2]
	}
	return out
}
