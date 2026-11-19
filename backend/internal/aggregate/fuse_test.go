// Copyright Contributors to the Open Cluster Management project

package aggregate

import "testing"

func TestFuseSubstringAndThreshold(t *testing.T) {
	items := []App{
		{Transform: Transform{Name: "test-app", Namespace: "default", Clusters: []string{"local-cluster"}}},
		{Transform: Transform{Name: "other", Namespace: "kube-system", Clusters: []string{"remote"}}},
	}
	got := fuseFilter(items, "tes")
	if len(got) != 1 || got[0].Transform.Name != "test-app" {
		t.Fatalf("%+v", got)
	}
	got = fuseFilter(items, "zzzzzzzz")
	if len(got) != 0 {
		t.Fatalf("expected no match, got %+v", got)
	}
}

func TestBitapExactAndEmpty(t *testing.T) {
	if bitapScore("", "x") != 0 {
		t.Fatal("empty pattern")
	}
	if bitapScore("abc", "") != 1 {
		t.Fatal("empty text")
	}
	if bitapScore("test", "test-app") != 0 {
		t.Fatal("substring should be exact")
	}
}

func TestBitapApproximateSubstring(t *testing.T) {
	// Fixed-width Levenshtein windows scored abcd vs abcx-app as 0.5 (rejected).
	// Sellers substring distance yields 1 edit / 4 = 0.25, within fuseThreshold.
	score := bitapScore("abcd", "abcx-app")
	if score != 0.25 {
		t.Fatalf("score=%v want 0.25", score)
	}
	if score > fuseThreshold {
		t.Fatalf("score=%v should pass threshold %v", score, fuseThreshold)
	}
}

func TestFuseMatchesMidStringSubstitution(t *testing.T) {
	items := []App{
		{Transform: Transform{Name: "abcx-app", Namespace: "default"}},
		{Transform: Transform{Name: "zzzz", Namespace: "other"}},
	}
	got := fuseFilter(items, "abcd")
	if len(got) != 1 || got[0].Transform.Name != "abcx-app" {
		t.Fatalf("%+v", got)
	}
}

func TestFuseMatchesApplicationSources(t *testing.T) {
	items := []App{
		{Transform: Transform{Name: "other", Namespace: "default", Sources: "helloworld, dependency-chart"}},
		{Transform: Transform{Name: "unrelated", Namespace: "default"}},
	}
	got := fuseFilter(items, "dependency")
	if len(got) != 1 || got[0].Transform.Name != "other" {
		t.Fatalf("%+v", got)
	}
}

func TestFuseFilterStableEqualScoreOrder(t *testing.T) {
	// Same search relevance (exact substring) but different primary keys.
	// Input order is deliberately reversed between runs.
	mk := func(name, ns, uid string) App {
		return App{
			Object:    map[string]any{"metadata": map[string]any{"name": name, "namespace": ns, "uid": uid}},
			Transform: Transform{Name: name, Namespace: ns},
		}
	}
	pattern := "appset"
	runA := []App{mk("zeta-appset", "ns-b", "uid-2"), mk("alpha-appset", "ns-a", "uid-1")}
	runB := []App{mk("alpha-appset", "ns-a", "uid-1"), mk("zeta-appset", "ns-b", "uid-2")}
	gotA := fuseFilter(runA, pattern)
	gotB := fuseFilter(runB, pattern)
	if len(gotA) != 2 || len(gotB) != 2 {
		t.Fatalf("len A=%d B=%d", len(gotA), len(gotB))
	}
	for i := range gotA {
		if gotA[i].Transform.Name != gotB[i].Transform.Name {
			t.Fatalf("unstable at %d: %s vs %s", i, gotA[i].Transform.Name, gotB[i].Transform.Name)
		}
	}
	if gotA[0].Transform.Name != "alpha-appset" || gotA[1].Transform.Name != "zeta-appset" {
		t.Fatalf("want name tie-break order, got %s then %s", gotA[0].Transform.Name, gotA[1].Transform.Name)
	}
}

func TestFuseFilterPrefersBetterScoreBeforeTieBreak(t *testing.T) {
	items := []App{
		{Transform: Transform{Name: "zzzz", Namespace: "default"}},       // no match
		{Transform: Transform{Name: "a-abcx-app", Namespace: "default"}}, // approximate; name sorts before exacts
		{Transform: Transform{Name: "abcd-exact", Namespace: "default"}}, // exact substring
		{Transform: Transform{Name: "abcd-also", Namespace: "other"}},    // exact substring, later name
	}
	got := fuseFilter(items, "abcd")
	if len(got) != 3 {
		t.Fatalf("%+v", got)
	}
	if got[0].Transform.Name != "abcd-also" || got[1].Transform.Name != "abcd-exact" {
		t.Fatalf("exact matches first by name: %+v", got)
	}
	// Name-only order would put a-abcx-app first; score must keep it last.
	if got[2].Transform.Name != "a-abcx-app" {
		t.Fatalf("approximate after exact: %+v", got)
	}
}
