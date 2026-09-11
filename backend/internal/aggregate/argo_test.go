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
	if len(appSets["set-1"]) != 1 {
		t.Fatalf("child map %+v", appSets)
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
