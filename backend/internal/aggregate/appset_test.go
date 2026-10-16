// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"
)

func TestIncFilterAndStatusCounts(t *testing.T) {
	m := map[string]map[string]int{}
	incFilterCounts(m, "cluster", []string{"a", "a", "b"})
	if m["cluster"]["a"] != 2 || m["cluster"]["b"] != 1 {
		t.Fatalf("%+v", m)
	}
	empty := App{Transform: Transform{Type: kindArgo, Statuses: StatusMap{}}}
	incStatusCounts(m, "healthStatus", empty, colHealth)
	if len(m["healthStatus"]) != 0 {
		t.Fatal("empty statuses")
	}
}

func TestStatusesClusterFilter(t *testing.T) {
	lister := MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
		"argoproj.io/v1alpha1|Application": {
			uObj("argoproj.io/v1alpha1", "Application", "a1", "argocd", nil),
			uObj("argoproj.io/v1alpha1", "Application", "a2", "argocd", nil),
		},
	}
	h := testHandler(t, lister)
	eng := h.Engine
	eng.mu.Lock()
	eng.cache[cacheLocalArgo].Resources = []App{
		{Transform: Transform{Name: "a1", Type: kindArgo, Clusters: []string{"c1"}, Statuses: StatusMap{"c1": emptyClusterStatuses()}, Scores: Scores{colHealth: 0}}},
		{Transform: Transform{Name: "a2", Type: kindArgo, Clusters: []string{"c2"}, Statuses: StatusMap{"c2": emptyClusterStatuses()}, Scores: Scores{colHealth: 0}}},
	}
	eng.mu.Unlock()
	resp := postAggregate(t, h, "/aggregate/statuses", requestStatuses{Clusters: []string{"c2"}})
	defer resp.Body.Close()
	var st resultStatuses
	if err := json.NewDecoder(resp.Body).Decode(&st); err != nil {
		t.Fatal(err)
	}
	if st.ItemCount != "1" {
		t.Fatalf("count %q", st.ItemCount)
	}
}

func TestFetchAppSetStubWithoutREST(t *testing.T) {
	h := testHandler(t, nil)
	stub := map[string]any{
		"metadata": map[string]any{"name": "s", "namespace": "ns"},
	}
	got, err := h.fetchAppSet(context.Background(), "tok", stub)
	if err != nil || metaName(got) != "s" {
		t.Fatalf("%v %v", got, err)
	}
}

func TestStatusesInvalidJSON500(t *testing.T) {
	h := testHandler(t, nil)
	resp := postAggregate(t, h, "/aggregate/statuses", "{")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestEMapsNil(t *testing.T) {
	if eMaps(nil) == nil || len(eMaps(nil)) != 0 {
		t.Fatal("nil slice")
	}
}
