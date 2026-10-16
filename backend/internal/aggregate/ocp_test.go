// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"testing"

	"github.com/stolostron/console/backend/internal/searchapi"
)

func TestParseSearchLabelsAndOCPValues(t *testing.T) {
	pairs := parseSearchLabels(" app=nginx ; app.kubernetes.io/instance=inst ; app.kubernetes.io/managed-by=Helm ")
	if len(pairs) != 3 {
		t.Fatalf("%v", pairs)
	}
	label, helm, inst := ocpLabelValues(pairs)
	if label != "nginx" || !helm || inst != "inst" {
		t.Fatalf("label=%q helm=%v inst=%q", label, helm, inst)
	}
	partLabel, _, _ := ocpLabelValues([][2]string{{"app.kubernetes.io/part-of", "suite"}})
	if partLabel != "suite" {
		t.Fatal("part-of fallback")
	}
}

func TestCreateOCPStatusMapDeployments(t *testing.T) {
	apps := []map[string]any{{
		"namespace": "apps",
		"name":      "deploy",
		"label":     "app=myapp",
		"cluster":   "c1",
		"type":      kindOpenShift,
		"_uid":      "u1",
		"deployments": []any{
			map[string]any{"namespace": "apps", "name": "deploy", "_uid": "d1"},
		},
	}}
	related := []mapKind{{
		Kind: "Pod",
		Items: []map[string]any{{
			"cluster": "c1", "namespace": "apps", "label": "app=myapp",
			"status": "Running", "_uid": "p1", "_relatedUids": []any{"u1"},
		}},
	}}
	out := createOCPStatusMap(apps, related)
	key := kindOpenShift + "/apps/myapp"
	if out[key]["c1"].Deployed.Counts[scoreHealthy] != 1 {
		t.Fatalf("%+v", out[key]["c1"])
	}
}

func TestCacheOCPApplicationsSkipsAndSplits(t *testing.T) {
	e := NewEngine(MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
		"apps.open-cluster-management.io/v1|HelmRelease": {
			uObj("apps.open-cluster-management.io/v1", "HelmRelease", "hr", "apps", map[string]any{
				"metadata": map[string]any{
					"name": "hr", "namespace": "apps",
					"annotations": map[string]any{
						"apps.open-cluster-management.io/hosting-subscription": "sub/hosted",
					},
				},
			}),
		},
	}, nil, nil)
	filter := map[string]struct{}{"-apps-c1": {}}
	search := searchapi.ResultBucket{
		Items: []map[string]any{
			{
				"label": "app.kubernetes.io/instance=dup;app=skip-hosted",
				"namespace": "apps", "name": "dep1", "cluster": "local-cluster",
				"kind": "Deployment", "apiversion": "apps", "apigroup": "apps",
				"_hostingSubscription": "hosted",
			},
			{
				"label": "app=helm-app;app.kubernetes.io/managed-by=Helm",
				"namespace": "apps", "name": "dep2", "cluster": "local-cluster",
				"kind": "Deployment", "apiversion": "apps", "apigroup": "apps",
			},
			{
				"label": "app=remote-app",
				"namespace": "team", "name": "dep3", "cluster": "remote",
				"kind": "Deployment", "apiversion": "apps", "apigroup": "apps",
			},
			{
				"label": "app=dup",
				"namespace": "apps", "name": "dep4", "cluster": "c1",
				"kind": "Deployment", "apiversion": "apps", "apigroup": "apps",
			},
		},
	}
	e.cacheOCPApplications(search, filter, false)
	if len(e.cache[cacheLocalOCP].Resources) != 1 {
		t.Fatalf("local %+v", e.cache[cacheLocalOCP].Resources)
	}
	if len(e.cache[cacheRemoteOCP].Resources) != 1 {
		t.Fatalf("remote %+v", e.cache[cacheRemoteOCP].Resources)
	}
}

func TestCacheRemoteSystemApps(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	status := map[string]StatusMap{"openshift/ns/app": {"remote": emptyClusterStatuses()}}
	remote := []map[string]any{{
		"apiVersion": "apps/v1",
		"kind":       "Deployment",
		"label":      "app=app",
		"metadata":   map[string]any{"name": "app", "namespace": "ns"},
		"status":     map[string]any{"cluster": "remote"},
	}}
	e.cacheRemoteSystemApps(status, remote, []string{"remote"})
	if len(e.cache[cacheRemoteSys].ResourceMap["remote"]) != 1 {
		t.Fatalf("%+v", e.cache[cacheRemoteSys].ResourceMap)
	}
}
