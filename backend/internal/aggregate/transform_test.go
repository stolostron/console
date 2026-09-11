// Copyright Contributors to the Open Cluster Management project

package aggregate

import "testing"

func TestGetApplicationType(t *testing.T) {
	if getApplicationType(map[string]any{"apiVersion": "app.k8s.io/v1beta1", "kind": "Application"}, nil) != kindSubscriptionApp {
		t.Fatal("subscription")
	}
	if getApplicationType(map[string]any{"apiVersion": "argoproj.io/v1alpha1", "kind": "Application"}, nil) != kindArgo {
		t.Fatal("argo")
	}
	if getApplicationType(map[string]any{"apiVersion": "argoproj.io/v1alpha1", "kind": "ApplicationSet"}, nil) != kindAppSet {
		t.Fatal("appset")
	}
	flux := map[string]any{
		"label":    "helm.toolkit.fluxcd.io/name=x;helm.toolkit.fluxcd.io/namespace=y",
		"metadata": map[string]any{"namespace": "apps"},
	}
	if getApplicationType(flux, nil) != kindFlux {
		t.Fatal("flux")
	}
	ocp := map[string]any{
		"label":    "app=nginx",
		"metadata": map[string]any{"namespace": "openshift-gitops"},
	}
	if getApplicationType(ocp, []string{"openshift"}) != kindOpenShiftDefault {
		t.Fatal("system ocp")
	}
}

func TestFilterAndSortApplications(t *testing.T) {
	items := []App{
		{Transform: Transform{Name: "b", Type: kindArgo, Namespace: "ns", Clusters: []string{"c1"}, Scores: Scores{colHealth: 0}}},
		{Transform: Transform{Name: "a", Type: kindSubscriptionApp, Namespace: "ns", Clusters: []string{"c2"}, Scores: Scores{colHealth: 2000}}},
	}
	got := filterApplications(map[string][]string{"type": {kindSubscriptionApp}}, items)
	if len(got) != 1 || got[0].Transform.Name != "a" {
		t.Fatalf("%+v", got)
	}
	sorted := sortApplications(colName, false, items)
	if sorted[0].Transform.Name != "a" {
		t.Fatalf("asc %s", sorted[0].Transform.Name)
	}
	sorted = sortApplications(colName, true, items)
	if sorted[0].Transform.Name != "b" {
		t.Fatalf("desc %s", sorted[0].Transform.Name)
	}
	sorted = sortApplications(colHealth, false, items)
	if sorted[0].Transform.Scores[colHealth] != 2000 {
		t.Fatal("higher score first")
	}
}

func TestStatusFilterKey(t *testing.T) {
	item := App{Transform: Transform{Scores: Scores{colHealth: 0, colSynced: 2000, colDeployed: 0}}}
	if statusFilterKey(item, colHealth) != "Healthy" {
		t.Fatal("health")
	}
	if statusFilterKey(item, colSynced) != "OutOfSync" {
		t.Fatal("sync")
	}
	if statusFilterKey(item, colDeployed) != "Deployed" {
		t.Fatal("pod")
	}
}

func TestPaginationPerPageAllAndBreakpoint(t *testing.T) {
	lister := MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
		"app.k8s.io/v1beta1|Application": {
			uObj("app.k8s.io/v1beta1", "Application", "zeta", "default", nil),
			uObj("app.k8s.io/v1beta1", "Application", "alpha", "default", nil),
		},
	}
	h := testHandler(t, lister)
	idx := 0
	resp := postAggregate(t, h, "/aggregate/applications", RequestListView{
		Page:    1,
		PerPage: -1,
		SortBy:  &SortBy{Index: &idx, Direction: "asc"},
	})
	defer resp.Body.Close()
	var all ResultListView
	if err := decodeJSON(resp, &all); err != nil {
		t.Fatal(err)
	}
	if all.ProcessedItemCount != 2 || len(all.Items) != 2 {
		t.Fatalf("%+v", all)
	}

	eng := NewEngine(lister, nil, nil)
	limit := 500
	eng.PreLimit = &limit
	h2 := NewHandler(eng, nil, AllowAll{})
	h2.Authn = testAuthOK
	resp2 := postAggregate(t, h2, "/aggregate/applications", RequestListView{Page: 1, PerPage: 10, Search: "zzz"})
	defer resp2.Body.Close()
	var small ResultListView
	if err := decodeJSON(resp2, &small); err != nil {
		t.Fatal(err)
	}
	if small.IsPreProcessed {
		t.Fatal("<=500 should let the frontend filter")
	}
	if small.ProcessedItemCount != 2 {
		t.Fatalf("unfiltered count %d", small.ProcessedItemCount)
	}
}
