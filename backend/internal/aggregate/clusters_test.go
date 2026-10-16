// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func proxyService(port any) map[string]any {
	svc := map[string]any{
		"apiVersion": "v1",
		"kind":       "Service",
		"metadata": map[string]any{
			"name":      "cluster-proxy-addon-user",
			"namespace": "multicluster-engine",
		},
		"spec": map[string]any{},
	}
	if port != nil {
		svc["spec"] = map[string]any{
			"ports": []any{
				map[string]any{"port": port},
			},
		}
	}
	return svc
}

func TestClusterProxyURLPortTypes(t *testing.T) {
	const cluster = "remote"
	cases := []struct {
		name string
		port any
		want string
	}{
		{name: "default", port: nil, want: "https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092/remote"},
		{name: "int64", port: int64(9443), want: "https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9443/remote"},
		{name: "float64", port: float64(8443), want: "https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:8443/remote"},
		{name: "int", port: 7443, want: "https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:7443/remote"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := clusterProxyURL(proxyService(tc.port), cluster)
			if got != tc.want {
				t.Fatalf("got %q want %q", got, tc.want)
			}
		})
	}
}

func TestArgoDestinationMatchesInt64ProxyPort(t *testing.T) {
	e := NewEngine(MapLister{
		"v1|Service": {
			unstructured.Unstructured{Object: proxyService(int64(9443))},
		},
	}, nil, nil)
	clusters := []Cluster{{Name: "remote"}}
	server := "https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9443/remote"
	got := e.argoDestinationCluster(map[string]any{"server": server}, clusters, "", "local-cluster")
	if got != "remote" {
		t.Fatalf("got %q want remote (int64 Service port must match dest.server)", got)
	}
}

func TestIsLocalClusterURLEmptyAndInvalid(t *testing.T) {
	local := &Cluster{Name: "local-cluster", ConsoleURL: "https://console-openshift-console.apps.hub.example.com"}
	cases := []struct {
		name string
		raw  string
		want bool
	}{
		{name: "empty", raw: "", want: false},
		{name: "scheme-less", raw: "not-a-url", want: false},
		{name: "api-only", raw: "https://api.", want: false},
		{name: "default-svc", raw: "https://kubernetes.default.svc", want: true},
		{name: "matching-api", raw: "https://api.hub.example.com:6443", want: true},
		{name: "unrelated", raw: "https://api.remote.example.com:6443", want: false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := isLocalClusterURL(tc.raw, local); got != tc.want {
				t.Fatalf("isLocalClusterURL(%q)=%v want %v", tc.raw, got, tc.want)
			}
		})
	}
}

func TestArgoPushModelClustersNameOnlyRemote(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	local := &Cluster{Name: "local-cluster", ConsoleURL: "https://console-openshift-console.apps.hub.example.com"}
	managed := []Cluster{{Name: "local-cluster"}, {Name: "remote"}}
	resources := []map[string]any{{
		"spec": map[string]any{
			"destination": map[string]any{"name": "remote"},
		},
	}}
	got := e.argoPushModelClusters(resources, local, managed)
	if len(got) != 1 || got[0] != "remote" {
		t.Fatalf("got %v want [remote] (empty dest.server must not count as local)", got)
	}
}

func TestClustersMergesSources(t *testing.T) {
	lister := MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {
			uObj("cluster.open-cluster-management.io/v1", "ManagedCluster", "mc-1", "", map[string]any{
				"status": map[string]any{
					"clusterClaims": []any{
						map[string]any{"name": "consoleurl.cluster.open-cluster-management.io", "value": "https://console.apps.mc-1.example"},
					},
				},
			}),
		},
		"hive.openshift.io/v1|ClusterDeployment": {
			uObj("hive.openshift.io/v1", "ClusterDeployment", "mc-1", "", map[string]any{
				"metadata": map[string]any{
					"name": "mc-1",
					"ownerReferences": []any{map[string]any{"kind": "AgentCluster"}},
				},
			}),
			uObj("hive.openshift.io/v1", "ClusterDeployment", "keep", "", map[string]any{
				"metadata": map[string]any{"name": "keep"},
				"status":   map[string]any{"apiURL": "https://api.keep.example", "webConsoleURL": "https://console.keep.example"},
			}),
		},
		"internal.open-cluster-management.io/v1beta1|ManagedClusterInfo": {
			uObj("internal.open-cluster-management.io/v1beta1", "ManagedClusterInfo", "info-1", "", map[string]any{
				"metadata": map[string]any{"name": "info-1"},
				"spec":     map[string]any{"masterEndpoint": "https://api.info.example"},
			}),
		},
		"hypershift.openshift.io/v1beta1|HostedCluster": {
			uObj("hypershift.openshift.io/v1beta1", "HostedCluster", "hc-1", "", map[string]any{
				"metadata": map[string]any{"name": "hc-1"},
				"spec":     map[string]any{"dns": map[string]any{"baseDomain": "hc.example"}},
			}),
		},
	}
	e := NewEngine(lister, nil, nil)
	got := e.clusters()
	names := map[string]Cluster{}
	for _, c := range got {
		names[c.Name] = c
	}
	if names["mc-1"].ConsoleURL != "https://console.apps.mc-1.example" {
		t.Fatalf("mc-1 %+v", names["mc-1"])
	}
	if names["keep"].KubeAPIServer != "https://api.keep.example" {
		t.Fatalf("keep %+v", names["keep"])
	}
	if names["info-1"].KubeAPIServer != "https://api.info.example" {
		t.Fatalf("info %+v", names["info-1"])
	}
	if names["hc-1"].ConsoleURL != "https://console-openshift-console.apps.hc-1.hc.example" {
		t.Fatalf("hc %+v", names["hc-1"])
	}
}

func TestKubeAPIServerFromSpec(t *testing.T) {
	cd := map[string]any{
		"spec": map[string]any{"clusterName": "c", "baseDomain": "example.com"},
	}
	if kubeAPIServer(cd, nil) != "https://api.c.example.com" {
		t.Fatal("constructed api")
	}
}

func TestApplicationClustersPaths(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	local := &Cluster{Name: "local-cluster"}
	clusters := []Cluster{{Name: "local-cluster"}, {Name: "remote"}}
	flux := map[string]any{"status": map[string]any{"cluster": "remote"}}
	if cs := e.applicationClusters(flux, kindFlux, nil, nil, local, clusters); cs[0] != "remote" {
		t.Fatalf("flux %v", cs)
	}
	pullSet := map[string]any{
		"metadata": map[string]any{"name": "set", "namespace": "argocd"},
		"spec": map[string]any{
			"template": map[string]any{
				"metadata": map[string]any{
					"annotations": map[string]any{
						"apps.open-cluster-management.io/ocm-managed-cluster": "true",
					},
				},
			},
		},
	}
	e.pulledAppSetMap = map[string][]map[string]any{
		"argocd/set": {{"cluster": "remote-a"}, {"cluster": "remote-b"}},
	}
	got := e.applicationClusters(pullSet, kindAppSet, nil, nil, local, clusters)
	if len(got) != 2 {
		t.Fatalf("pull %v", got)
	}
}

func TestSubscriptionClustersAndLocalSkip(t *testing.T) {
	app := map[string]any{
		"metadata": map[string]any{
			"annotations": map[string]any{
				"apps.open-cluster-management.io/subscriptions": "ns/sub,ns/sub-local",
			},
		},
	}
	subs := []map[string]any{{
		"metadata": map[string]any{"name": "sub", "namespace": "ns"},
		"spec": map[string]any{
			"placement": map[string]any{"placementRef": map[string]any{"name": "place"}},
		},
	}}
	pd := []map[string]any{{
		"metadata": map[string]any{
			"labels": map[string]any{"cluster.open-cluster-management.io/placement": "place"},
		},
		"status": map[string]any{
			"decisions": []any{map[string]any{"clusterName": "c1"}},
		},
	}}
	got := subscriptionClusters(app, subs, pd)
	if len(got) != 1 || got[0] != "c1" {
		t.Fatalf("%v", got)
	}
	if !isLocalSubscription("ns/sub-local", []string{"ns/sub", "ns/sub-local"}) {
		t.Fatal("local sub")
	}
}

func TestArgoClusterAndDestinationKubeAPI(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	hub := "local-cluster"
	app := map[string]any{
		"spec": map[string]any{"destination": map[string]any{"server": "https://kubernetes.default.svc"}},
	}
	if e.argoCluster(app, nil) != hub {
		t.Fatal("default svc hub")
	}
	dest := map[string]any{"server": "https://kubernetes.default.svc"}
	if e.argoDestinationCluster(dest, nil, "hint", hub) != "hint" {
		t.Fatal("cluster hint for in-cluster server")
	}
}
