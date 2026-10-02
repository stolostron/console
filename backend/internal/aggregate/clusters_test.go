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
