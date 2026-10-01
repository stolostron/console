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
