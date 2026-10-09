// Copyright Contributors to the Open Cluster Management project

package aggregate

import "testing"

func namedApp(name string) App {
	return App{Transform: Transform{Name: name}}
}

func TestNextAppPageChunkRedistributesIntoCommaJoinedKeys(t *testing.T) {
	t.Setenv("APP_SEARCH_LIMIT", "5")
	e := NewEngine(nil, nil, nil)
	e.cache[cacheRemoteArgo].Resources = []App{
		namedApp("aa"), namedApp("ab"),
		namedApp("ba"), namedApp("bb"),
		namedApp("ca"), namedApp("cb"),
	}

	var chunks []pageChunk
	first := e.nextAppPageChunk(&chunks, cacheRemoteArgo)
	if first == nil {
		t.Fatal("expected first chunk")
	}
	b := e.cache[cacheRemoteArgo]
	if b.Resources != nil {
		t.Fatal("Resources should be cleared after redistribution")
	}
	if got := countCachedApps(b.ResourceMap); got != 6 {
		t.Fatalf("cached apps %d map %+v", got, mapNames(b.ResourceMap))
	}
	firstKey := joinKeys(first.Keys)
	if len(b.ResourceMap[firstKey]) == 0 {
		t.Fatalf("first chunk %q missing apps: %v", firstKey, mapNames(b.ResourceMap))
	}
	assertAppsStayInKeys(t, b.ResourceMap)

	second := e.nextAppPageChunk(&chunks, cacheRemoteArgo)
	if second == nil {
		t.Fatal("expected second chunk")
	}
	if got := countCachedApps(b.ResourceMap); got != 6 {
		t.Fatalf("apps dropped after second chunk: %v", mapNames(b.ResourceMap))
	}

	var again []pageChunk
	_ = e.nextAppPageChunk(&again, cacheRemoteArgo)
	if got := countCachedApps(b.ResourceMap); got != 6 {
		t.Fatalf("rebuild dropped cached apps: %v", mapNames(b.ResourceMap))
	}
	assertAppsStayInKeys(t, b.ResourceMap)
}

func countCachedApps(m map[string][]App) int {
	n := 0
	for _, list := range m {
		n += len(list)
	}
	return n
}

func mapNames(m map[string][]App) map[string][]string {
	out := map[string][]string{}
	for k, list := range m {
		for _, a := range list {
			out[k] = append(out[k], a.Transform.Name)
		}
	}
	return out
}

func assertAppsStayInKeys(t *testing.T, m map[string][]App) {
	t.Helper()
	for key, list := range m {
		prefixes := map[byte]struct{}{}
		for _, part := range splitComma(key) {
			if part != "" {
				prefixes[part[0]] = struct{}{}
			}
		}
		for _, app := range list {
			if app.Transform.Name == "" {
				continue
			}
			if _, ok := prefixes[app.Transform.Name[0]]; !ok {
				t.Fatalf("app %q not in comma-joined key %q", app.Transform.Name, key)
			}
		}
	}
}

func TestStripMulticloudExactPrefix(t *testing.T) {
	if got := stripMulticloud("/multicloud"); got != "/" {
		t.Fatalf("/multicloud → %q", got)
	}
	if got := stripMulticloud("/multicloud/aggregate/applications"); got != "/aggregate/applications" {
		t.Fatalf("nested → %q", got)
	}
	if got := stripMulticloud("/multicloudfoo"); got != "/multicloudfoo" {
		t.Fatalf("bare prefix must not strip, got %q", got)
	}
	if got := stripMulticloud("/aggregate/applications"); got != "/aggregate/applications" {
		t.Fatalf("passthrough → %q", got)
	}
}
