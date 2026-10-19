// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"encoding/json"
	"testing"
)

func TestMissingClusterStatusesJSON(t *testing.T) {
	raw, err := missingClusterStatuses().Health.MarshalJSON()
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != `[[0,0,0,0,1],[{"key":"Status","value":"Missing"}]]` {
		t.Fatalf("%s", raw)
	}
	cs := missingClusterStatuses()
	out, err := cs.MarshalJSON()
	if err != nil {
		t.Fatal(err)
	}
	var m map[string]any
	if err := json.Unmarshal(out, &m); err != nil {
		t.Fatal(err)
	}
	if len(m) != 3 {
		t.Fatalf("%v", m)
	}
}

func TestSearchFloatCoercions(t *testing.T) {
	if searchFloat(map[string]any{"n": float64(2.5)}, "n") != 2.5 {
		t.Fatal("float64")
	}
	if searchFloat(map[string]any{"n": 3}, "n") != 3 {
		t.Fatal("int")
	}
	if searchFloat(map[string]any{"n": json.Number("4")}, "n") != 4 {
		t.Fatal("json.Number")
	}
	if searchFloat(map[string]any{"n": "x"}, "n") != 0 {
		t.Fatal("string")
	}
	if searchFloat(map[string]any{}, "n") != 0 {
		t.Fatal("missing")
	}
}

func TestPlacementAndAPIHelpers(t *testing.T) {
	spec := map[string]any{
		"generators": []any{
			map[string]any{
				"clusterDecisionResource": map[string]any{
					"labelSelector": map[string]any{
						"matchLabels": map[string]any{
							"cluster.open-cluster-management.io/placement": "prod",
						},
					},
				},
			},
		},
	}
	if placementNameFromSpec(spec) != "prod" {
		t.Fatal("placement from spec")
	}
	if placementNameFromSpec(nil) != "" {
		t.Fatal("nil spec")
	}
	if appSetNameFromMapKey("ns/set-1") != "set-1" {
		t.Fatal("map key")
	}
	if appSetNameFromMapKey("nocolon") != "nocolon" {
		t.Fatal("no slash")
	}
	if resourcePlural("Application") != "applications" {
		t.Fatal("plural")
	}
	if resourcePlural("ManagedClusterView") != "managedclusterviews" {
		t.Fatal("suffix s")
	}
	if resourcePlural("") != "" {
		t.Fatal("empty kind")
	}
	if apiGroup("argoproj.io/v1alpha1") != "argoproj.io" {
		t.Fatal("group")
	}
	if apiGroup("v1") != "" {
		t.Fatal("core group")
	}
}

func TestFindObjectWithKey(t *testing.T) {
	root := map[string]any{
		"a": []any{
			map[string]any{"b": map[string]any{"target": "hit"}},
		},
	}
	found := findObjectWithKey(root, "target")
	if found == nil || strVal(found["target"]) != "hit" {
		t.Fatalf("%v", found)
	}
	if findObjectWithKey("nope", "x") != nil {
		t.Fatal("non-map")
	}
}
