// Copyright Contributors to the Open Cluster Management project

package aggregate

import "testing"

func TestComputeAppHealthAndSync(t *testing.T) {
	h := emptyStatusEntry()
	computeAppHealthStatus(&h, map[string]any{"healthStatus": "Degraded"})
	if h.Counts[scoreDanger] != 1 {
		t.Fatalf("health %+v", h.Counts)
	}
	s := emptyStatusEntry()
	computeAppSyncStatus(&s, map[string]any{"syncStatus": "OutOfSync"})
	if s.Counts[scoreWarning] != 1 {
		t.Fatalf("sync %+v", s.Counts)
	}
}

func TestComputePodStatusSkipsTerminating(t *testing.T) {
	d := emptyStatusEntry()
	computePodStatus(&d, []map[string]any{
		{"status": "Running"},
		{"status": "Terminating"},
		{"status": "CrashLoopBackOff"},
	})
	if d.Counts[scoreHealthy] != 1 || d.Counts[scoreDanger] != 1 {
		t.Fatalf("%+v", d.Counts)
	}
}

func TestIncStatusCountsArgoOnly(t *testing.T) {
	counts := map[string]map[string]int{"healthStatus": {}}
	sub := App{Transform: Transform{Type: kindSubscriptionApp, Scores: Scores{colHealth: 0}, Statuses: StatusMap{"c": emptyClusterStatuses()}}}
	incStatusCounts(counts, "healthStatus", sub, colHealth)
	if len(counts["healthStatus"]) != 0 {
		t.Fatal("subscription must not increment health")
	}
	argo := App{Transform: Transform{Type: kindArgo, Scores: Scores{colHealth: 0}, Statuses: StatusMap{"c": emptyClusterStatuses()}}}
	incStatusCounts(counts, "healthStatus", argo, colHealth)
	if counts["healthStatus"]["Healthy"] != 1 {
		t.Fatalf("%+v", counts)
	}
}

func TestStatusEntryJSONArray(t *testing.T) {
	e := emptyStatusEntry()
	e.Counts[scoreHealthy] = 2
	raw, err := e.MarshalJSON()
	if err != nil {
		t.Fatal(err)
	}
	if string(raw) != `[[2,0,0,0,0],[]]` {
		t.Fatalf("%s", raw)
	}
}

func TestZeroAvailabilityIsDanger(t *testing.T) {
	appKey := "deployment/ns/myapp"
	cluster := "c"
	related := []mapKind{{
		Kind: "ReplicaSet",
		Items: []map[string]any{{
			"cluster":   cluster,
			"namespace": "ns",
			"label":     "app=myapp",
			"available": 0,
			"desired":   2,
			"_uid":      "rs1",
		}},
	}}
	statuses := map[string]StatusMap{
		appKey: {cluster: emptyClusterStatuses()},
	}
	ids := map[string]*statusIDs{
		statusIDKey(appKey, cluster): {appName: "ns/myapp"},
	}
	computeDeployedPodStatuses(related, statuses, ids, true)
	got := statuses[appKey][cluster].Deployed
	if got.Counts[scoreDanger] != 1 {
		t.Fatalf("danger=%d progress=%d counts=%v", got.Counts[scoreDanger], got.Counts[scoreProgress], got.Counts)
	}
	if got.Counts[scoreProgress] != 0 {
		t.Fatalf("expected no progress, got %d", got.Counts[scoreProgress])
	}
}

func TestIncStatusCountsDeployed(t *testing.T) {
	counts := map[string]map[string]int{"podStatuses": {}}
	appset := App{Transform: Transform{
		Type:     kindAppSet,
		Scores:   Scores{colDeployed: 0},
		Statuses: StatusMap{"c": emptyClusterStatuses()},
	}}
	incStatusCounts(counts, "podStatuses", appset, colDeployed)
	if counts["podStatuses"]["Deployed"] != 1 {
		t.Fatalf("%+v", counts)
	}
}

func TestComputeAppHealthAndSyncBranches(t *testing.T) {
	cases := []struct {
		field  string
		status string
		score  int
	}{
		{"healthStatus", "Healthy", scoreHealthy},
		{"healthStatus", "Progressing", scoreProgress},
		{"healthStatus", "Unknown", scoreUnknown},
		{"healthStatus", "Weird", scoreWarning},
		{"syncStatus", "Synced", scoreHealthy},
		{"syncStatus", "Unknown", scoreUnknown},
		{"syncStatus", "Failed", scoreDanger},
	}
	for _, tc := range cases {
		h := emptyStatusEntry()
		if tc.field == "healthStatus" {
			computeAppHealthStatus(&h, map[string]any{"healthStatus": tc.status})
		} else {
			computeAppSyncStatus(&h, map[string]any{"syncStatus": tc.status})
		}
		if h.Counts[tc.score] != 1 {
			t.Fatalf("%s %s %+v", tc.field, tc.status, h.Counts)
		}
	}
}

func TestExtractMessagesDedupes(t *testing.T) {
	e := emptyStatusEntry()
	item := map[string]any{
		"healthStatus": "Degraded",
		"_foo_condition": "x",
		"_bar_missing":   "y",
	}
	extractMessages(&e, item, "Degraded")
	extractMessages(&e, item, "Degraded")
	if len(e.Messages) < 3 {
		t.Fatalf("%+v", e.Messages)
	}
}

func TestCollectRelatedResourcesAndDeployedMissingPods(t *testing.T) {
	m := relatedMaps{
		byName: map[string][]map[string]any{
			"c1/ns/d1": {{ "_uid": "rs1", "available": 0, "desired": 2 }},
		},
		byUID: map[string][]map[string]any{
			"u1": {{ "_uid": "p1", "status": "Running" }},
		},
	}
	items := collectRelatedResources("c1", m, statusIDs{appName: "ns/app", deployments: []map[string]any{
		{"namespace": "ns", "name": "d1", "_uid": "d1"},
		{"namespace": "ns", "name": "d2", "_uid": "d2"},
	}})
	if len(items) == 0 {
		t.Fatal("multi deployment lookup")
	}
	appKey := "argo/ns/app"
	statuses := map[string]StatusMap{
		appKey: {"c1": ClusterStatuses{
			Health:   StatusEntry{Counts: []int{1, 0, 0, 0, 0}},
			Synced:   StatusEntry{Counts: []int{1, 0, 0, 0, 0}},
			Deployed: emptyStatusEntry(),
		}},
	}
	ids := map[string]*statusIDs{statusIDKey(appKey, "c1"): {appName: "ns/app", uids: []string{"u1"}}}
	related := []mapKind{
		{Kind: "ReplicaSet", Items: []map[string]any{{"cluster": "c1", "namespace": "ns", "label": "app=app", "desired": 2, "_uid": "rs1"}}},
		{Kind: "Pod", Items: []map[string]any{{"cluster": "c1", "_uid": "p1", "_relatedUids": []any{"u1"}, "status": "Running"}}},
	}
	computeDeployedPodStatuses(related, statuses, ids, false)
	dep := statuses[appKey]["c1"].Deployed
	if dep.Counts[scoreHealthy] != 1 || dep.Counts[scoreDanger] < 1 {
		t.Fatalf("%+v", dep)
	}
}
