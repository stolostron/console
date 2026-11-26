// Copyright Contributors to the Open Cluster Management project

package aggregate

import "testing"

func TestGetApplicationType(t *testing.T) {
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
		{
			Transform: Transform{
				Name: "b", Type: kindArgo, Namespace: "ns", Clusters: []string{"c1"}, Sources: "zebra", Scores: Scores{colHealth: 0},
			},
		},
		{
			Transform: Transform{
				Name:      "a",
				Type:      kindAppSet,
				Namespace: "ns",
				Clusters:  []string{"c2"},
				Sources:   "apple",
				Scores:    Scores{colHealth: 2000},
			},
		},
	}
	got := filterApplications(map[string][]string{"type": {kindAppSet}}, items)
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
	sorted = sortApplications(colSources, false, items)
	if sorted[0].Transform.Name != "a" {
		t.Fatalf("sources asc %s", sorted[0].Transform.Name)
	}
}

func TestSortApplicationsTieBreakStable(t *testing.T) {
	mk := func(name, ns, uid, sources string) App {
		return App{
			Object:    map[string]any{"metadata": map[string]any{"name": name, "namespace": ns, "uid": uid}},
			Transform: Transform{Name: name, Namespace: ns, Sources: sources},
		}
	}
	// Equal sources; input order reversed between runs.
	runA := []App{mk("b-app", "ns", "uid-b", "git"), mk("a-app", "ns", "uid-a", "git")}
	runB := []App{mk("a-app", "ns", "uid-a", "git"), mk("b-app", "ns", "uid-b", "git")}
	sortedA := sortApplications(colSources, false, runA)
	sortedB := sortApplications(colSources, false, runB)
	if sortedA[0].Transform.Name != "a-app" || sortedA[1].Transform.Name != "b-app" {
		t.Fatalf("tie-break by name: %+v", sortedA)
	}
	if sortedA[0].Transform.Name != sortedB[0].Transform.Name || sortedA[1].Transform.Name != sortedB[1].Transform.Name {
		t.Fatalf("unstable: A=%+v B=%+v", sortedA, sortedB)
	}
}

func TestSortApplicationsEmptySourcesLast(t *testing.T) {
	mk := func(name, sources string) App {
		return App{
			Object:    map[string]any{"metadata": map[string]any{"name": name, "namespace": "ns", "uid": name}},
			Transform: Transform{Name: name, Namespace: "ns", Sources: sources},
		}
	}
	runA := []App{mk("empty-app", ""), mk("git-app", "git")}
	runB := []App{mk("git-app", "git"), mk("empty-app", "")}
	sortedA := sortApplications(colSources, false, runA)
	sortedB := sortApplications(colSources, false, runB)
	if sortedA[0].Transform.Name != "git-app" || sortedA[1].Transform.Name != "empty-app" {
		t.Fatalf("empty last asc: %+v", sortedA)
	}
	if sortedA[0].Transform.Name != sortedB[0].Transform.Name || sortedA[1].Transform.Name != sortedB[1].Transform.Name {
		t.Fatalf("unstable empty/non-empty: A=%+v B=%+v", sortedA, sortedB)
	}
}

func TestTruncateSourceName(t *testing.T) {
	if got := truncateSourceName("helloworld", maxSourceNameLength); got != "helloworld" {
		t.Fatalf("short source %q", got)
	}
	exact := "a1234567890123456789"
	if got := truncateSourceName(exact, maxSourceNameLength); got != exact {
		t.Fatalf("exact source %q", got)
	}
	if got := truncateSourceName("this-is-a-very-long-source-path", maxSourceNameLength); got != "this-is-a-very-long-\u2026" {
		t.Fatalf("long source %q", got)
	}
}

func TestGetApplicationSources(t *testing.T) {
	argo := map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "Application",
		"spec": map[string]any{
			"source": map[string]any{"repoURL": "https://example.com/repo.git", "path": " helloworld "},
		},
	}
	if got := getApplicationSources(argo, kindArgo, nil, nil); len(got) != 1 || got[0] != "helloworld" {
		t.Fatalf("argo sources %+v", got)
	}

	argo = map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "Application",
		"spec": map[string]any{
			"source": map[string]any{"repoURL": "https://charts.example.com", "path": " ", "chart": "fallback-chart"},
		},
	}
	if got := getApplicationSources(argo, kindArgo, nil, nil); len(got) != 1 || got[0] != "fallback-chart" {
		t.Fatalf("argo chart fallback %+v", got)
	}

	appSet := map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "ApplicationSet",
		"spec": map[string]any{
			"template": map[string]any{
				"spec": map[string]any{
					"sources": []any{
						map[string]any{"repoURL": "https://example.com/repo.git", "path": "mortgage"},
						map[string]any{"repoURL": "https://charts.example.com", "chart": "dependency-chart"},
						map[string]any{"repoURL": "https://example.com/repo.git", "path": "mortgage"},
					},
				},
			},
		},
	}
	got := getApplicationSources(appSet, kindAppSet, nil, nil)
	if len(got) != 2 || got[0] != "mortgage" || got[1] != "dependency-chart" {
		t.Fatalf("appset sources %+v", got)
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
		"argoproj.io/v1alpha1|Application": {
			uObj("argoproj.io/v1alpha1", "Application", "zeta", "default", map[string]any{
				"metadata": map[string]any{"name": "zeta", "namespace": "default", "uid": "uid-zeta"},
				"spec":     map[string]any{"destination": map[string]any{"name": "in-cluster"}},
			}),
			uObj("argoproj.io/v1alpha1", "Application", "alpha", "default", map[string]any{
				"metadata": map[string]any{"name": "alpha", "namespace": "default", "uid": "uid-alpha"},
				"spec":     map[string]any{"destination": map[string]any{"name": "in-cluster"}},
			}),
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
	eng.mu.Lock()
	eng.rebuildLocalLocked()
	eng.mu.Unlock()
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

func TestGetAppStatusesAndTransformHelpers(t *testing.T) {
	missing := getAppStatuses(kindAppSet, "appset/ns/set", nil, []string{"c1"})
	if missing["c1"].Health.Counts[scoreUnknown] != 1 {
		t.Fatalf("%+v", missing["c1"])
	}
	emptyClusters := getAppStatuses(kindAppSet, "k", nil, nil)
	if emptyClusters["-"].Health.Counts[scoreUnknown] != 1 {
		t.Fatalf("%+v", emptyClusters)
	}
	argoNS := getAppNamespace(map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "Application",
		"metadata":   map[string]any{"namespace": "argocd"},
		"spec":       map[string]any{"destination": map[string]any{"namespace": "workloads"}},
	})
	if argoNS != "workloads" {
		t.Fatal(argoNS)
	}
	if transformString(App{Transform: Transform{Name: "n"}}, colName) != "n" {
		t.Fatal("name col")
	}
	if transformString(App{Transform: Transform{Clusters: []string{"c1", "c2"}}}, colClusters) != "c1" {
		t.Fatal("clusters col")
	}
}

func TestFilterApplicationsAllDimensions(t *testing.T) {
	items := []App{{
		Transform: Transform{
			Type: kindArgo, Clusters: []string{"c1"},
			Scores: Scores{colHealth: 0, colSynced: 0, colDeployed: 0},
		},
	}}
	got := filterApplications(map[string][]string{
		"type":         {kindArgo},
		"cluster":      {"c1"},
		"healthStatus": {"Healthy"},
		"syncStatus":   {"Synced"},
		"podStatuses":  {"Deployed"},
	}, items)
	if len(got) != 1 {
		t.Fatalf("%+v", got)
	}
	if len(filterApplications(map[string][]string{"unknown": {"x"}}, items)) != 0 {
		t.Fatal("unknown filter")
	}
}

func TestAddUIDataApplicationSet(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	e.appSetAppsMap = map[string][]map[string]any{
		"ns/set": {{"metadata": map[string]any{"name": "child"}}},
	}
	appSet := map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "ApplicationSet",
		"metadata":   map[string]any{"name": "set", "namespace": "ns"},
		"spec": map[string]any{
			"generators": []any{map[string]any{
				"clusterDecisionResource": map[string]any{
					"labelSelector": map[string]any{
						"matchLabels": map[string]any{
							"cluster.open-cluster-management.io/placement": "p",
						},
					},
				},
			}},
		},
	}
	row := App{
		Object:    appSet,
		Transform: Transform{Clusters: nil, Statuses: StatusMap{"c": emptyClusterStatuses()}},
	}
	e.cache[cacheAppSet] = &cacheBucket{Resources: []App{row}}
	out := e.addUIData([]App{row})
	if out[0].UIData == nil || len(out[0].UIData.AppSetApps) != 1 {
		t.Fatalf("%+v", out[0].UIData)
	}
	if out[0].UIData.ClusterList == nil || len(out[0].UIData.ClusterList) != 0 {
		t.Fatal("nil clusters normalized")
	}
}
