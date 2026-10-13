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
