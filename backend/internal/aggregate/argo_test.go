// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"testing"

	"github.com/stolostron/console/backend/internal/searchapi"
)

func TestFilterArgoAppsSkipsAppSetChildren(t *testing.T) {
	ocp := map[string]struct{}{}
	appSets := map[string][]map[string]any{}
	parent := map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "Application",
		"metadata":   map[string]any{"name": "app", "namespace": "argocd", "uid": "1"},
		"spec":       map[string]any{"destination": map[string]any{"namespace": "dest", "name": "in-cluster"}},
	}
	child := map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "Application",
		"metadata": map[string]any{
			"name":      "child",
			"namespace": "argocd",
			"uid":       "2",
			"ownerReferences": []any{
				map[string]any{"kind": "ApplicationSet", "name": "set-1"},
			},
		},
		"spec": map[string]any{"destination": map[string]any{"namespace": "dest", "name": "in-cluster"}},
	}
	out := filterArgoApps([]map[string]any{parent, child}, nil, ocp, appSets, "local-cluster")
	if len(out) != 1 || metaName(out[0]) != "app" {
		t.Fatalf("parents %+v", out)
	}
	if len(appSets["argocd/set-1"]) != 1 {
		t.Fatalf("child map %+v", appSets)
	}
}

func TestFilterArgoAppsSameNameDifferentNamespaces(t *testing.T) {
	ocp := map[string]struct{}{}
	appSets := map[string][]map[string]any{}
	child := func(namespace, uid string) map[string]any {
		return map[string]any{
			"apiVersion": "argoproj.io/v1alpha1",
			"kind":       "Application",
			"metadata": map[string]any{
				"name":      "child",
				"namespace": namespace,
				"uid":       uid,
				"ownerReferences": []any{
					map[string]any{"kind": "ApplicationSet", "name": "set-1"},
				},
			},
			"spec": map[string]any{"destination": map[string]any{"namespace": "dest", "name": "in-cluster"}},
		}
	}
	out := filterArgoApps([]map[string]any{child("team-a", "a"), child("team-b", "b")}, nil, ocp, appSets, "local-cluster")
	if len(out) != 0 {
		t.Fatalf("parents %+v", out)
	}
	if len(appSets["team-a/set-1"]) != 1 || metaUID(appSets["team-a/set-1"][0]) != "a" {
		t.Fatalf("team-a %+v", appSets["team-a/set-1"])
	}
	if len(appSets["team-b/set-1"]) != 1 || metaUID(appSets["team-b/set-1"][0]) != "b" {
		t.Fatalf("team-b %+v", appSets["team-b/set-1"])
	}
	if _, shared := appSets["set-1"]; shared {
		t.Fatal("name-only key must not be used")
	}
}

func TestMergePushModelPodStatuses(t *testing.T) {
	argo := map[string]StatusMap{
		"appset/ns/set": {
			"remote": emptyClusterStatuses(),
		},
	}
	st := argo["appset/ns/set"]["remote"]
	st.Health.Counts[scoreHealthy] = 1
	st.Synced.Counts[scoreHealthy] = 1
	argo["appset/ns/set"]["remote"] = st
	pushMap := map[string]pushEntry{
		"remote/ns/deploy": {appSetKey: "appset/ns/set", targetCluster: "remote"},
	}
	search := searchapi.ResultBucket{
		Items: []map[string]any{
			{"cluster": "remote", "namespace": "ns", "name": "deploy", "_uid": "w1"},
		},
		Related: []searchapi.Related{
			{Kind: "Pod", Items: []map[string]any{
				{"status": "Running", "_relatedUids": []any{"w1"}, "_uid": "p1"},
			}},
		},
	}
	mergePushModelPodStatuses(search, pushMap, argo)
	if argo["appset/ns/set"]["remote"].Deployed.Counts[scoreHealthy] != 1 {
		t.Fatalf("%+v", argo["appset/ns/set"]["remote"].Deployed)
	}
}

func TestCreateArgoStatusMap(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	search := searchapi.ResultBucket{
		Items: []map[string]any{
			{
				"name":         "app",
				"namespace":    "argocd",
				"cluster":      "local-cluster",
				"healthStatus": "Healthy",
				"syncStatus":   "Synced",
				"_uid":         "u1",
			},
		},
	}
	out := e.createArgoStatusMap(search, []Cluster{{Name: "local-cluster"}})
	st := out["argo/argocd/app"]["local-cluster"]
	if st.Health.Counts[scoreHealthy] != 1 || st.Synced.Counts[scoreHealthy] != 1 {
		t.Fatalf("%+v", st)
	}
}

func TestSplitSlashAndOnce(t *testing.T) {
	if got := splitSlash("ApplicationSet/ns/set"); len(got) != 3 || got[2] != "set" {
		t.Fatalf("%v", got)
	}
	if got := splitOnce("a\x00b", "\x00"); len(got) != 2 || got[0] != "a" {
		t.Fatalf("%v", got)
	}
}

func TestSimpleDest(t *testing.T) {
	clusters := []Cluster{{Name: "hub", KubeAPIServer: "https://api.hub.example:6443"}}
	if simpleDest(nil, clusters, "hub") != "unknown" {
		t.Fatal("nil dest")
	}
	dest := map[string]any{"server": "https://kubernetes.default.svc"}
	if simpleDest(dest, clusters, "hub") != "hub" {
		t.Fatal("default svc")
	}
	dest = map[string]any{"server": "https://api.hub.example:6443"}
	if simpleDest(dest, clusters, "hub") != "hub" {
		t.Fatal("api match")
	}
	dest = map[string]any{"name": "in-cluster"}
	if simpleDest(dest, clusters, "hub") != "hub" {
		t.Fatal("in-cluster")
	}
	dest = map[string]any{"name": "remote-1"}
	if simpleDest(dest, clusters, "hub") != "remote-1" {
		t.Fatal("name")
	}
}

func TestRemoteArgoAppsHostingAndPlain(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	remote := []map[string]any{
		{
			"name": "child", "namespace": "argocd", "cluster": "c1",
			"_hostingResource": "ApplicationSet/argocd/set-1", "_uid": "u1",
		},
		{
			"name": "plain", "namespace": "argocd", "cluster": "c1",
			"destinationNamespace": "ns", "destinationName": "in-cluster",
			"healthStatus": "Healthy", "syncStatus": "Synced", "_uid": "u2",
		},
	}
	apps := e.remoteArgoApps(remote)
	if len(apps) != 1 || metaName(apps[0]) != "plain" {
		t.Fatalf("apps %+v pulled %+v", apps, e.tempPulled)
	}
	if len(e.tempPulled["argocd/set-1"]) != 1 {
		t.Fatalf("pulled %+v", e.tempPulled)
	}
}

func TestCreateArgoStatusMapAppSetBranches(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	clusters := []Cluster{{Name: "remote"}, {Name: "local-cluster"}}
	search := searchapi.ResultBucket{
		Items: []map[string]any{
			{
				"_hostingResource": "ApplicationSet/argocd/set-1",
				"cluster": "remote", "healthStatus": "Healthy", "syncStatus": "Synced", "_uid": "h1",
			},
			{
				"applicationSet": "set-2", "namespace": "argocd", "name": "set-2-remote",
				"label": "apps.open-cluster-management.io/pull-to-ocm-managed-cluster=true",
				"cluster": "remote", "healthStatus": "Degraded", "syncStatus": "OutOfSync", "_uid": "skip",
			},
			{
				"applicationSet": "set-2", "namespace": "argocd", "name": "set-2-remote",
				"cluster": "remote", "healthStatus": "Healthy", "syncStatus": "Synced", "_uid": "a1",
			},
		},
	}
	out := e.createArgoStatusMap(search, clusters)
	if out["appset/argocd/set-1"]["remote"].Health.Counts[scoreHealthy] != 1 {
		t.Fatalf("hosting %+v", out["appset/argocd/set-1"])
	}
	if out["appset/argocd/set-2"]["remote"].Health.Counts[scoreHealthy] != 1 {
		t.Fatalf("appset %+v", out["appset/argocd/set-2"])
	}
	if _, ok := out["appset/argocd/set-2"]["remote"]; !ok {
		t.Fatal("missing appset status")
	}
}

func TestAppSetPlacementData(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	appSet := map[string]any{
		"metadata": map[string]any{"name": "a", "namespace": "ns"},
		"spec": map[string]any{
			"generators": []any{
				map[string]any{
					"clusterDecisionResource": map[string]any{
						"labelSelector": map[string]any{
							"matchLabels": map[string]any{
								"cluster.open-cluster-management.io/placement": "place",
							},
						},
					},
				},
			},
		},
	}
	other := map[string]any{
		"metadata": map[string]any{"name": "b", "namespace": "ns"},
		"spec":     appSet["spec"],
	}
	data := e.appSetPlacementData(appSet, []App{{Object: other}})
	placement, _ := data[0].(string)
	sharing, _ := data[1].([]string)
	if placement != "place" || len(sharing) != 1 || sharing[0] != "b" {
		t.Fatalf("%v %v", placement, sharing)
	}
}

func TestPlacementFromAppSetSpecFallback(t *testing.T) {
	obj := map[string]any{
		"spec": map[string]any{
			"generators": []any{
				map[string]any{
					"clusterDecisionResource": map[string]any{
						"labelSelector": map[string]any{
							"matchLabels": map[string]any{
								"cluster.open-cluster-management.io/placement": "from-gen",
							},
						},
					},
				},
			},
		},
	}
	if placementFromAppSet(obj) != "from-gen" {
		t.Fatal("generator placement")
	}
	empty := map[string]any{"spec": map[string]any{}}
	if placementFromAppSet(empty) != "" {
		t.Fatal("empty")
	}
}

func TestContainsLabel(t *testing.T) {
	if !containsLabel("a=b;c=d", "b") {
		t.Fatal("contains")
	}
}
