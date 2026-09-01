// Copyright Contributors to the Open Cluster Management project

package clusterproxy_test

import (
	"context"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"

	"github.com/stolostron/console/backend/internal/clusterproxy"
)

func mceObject(targetNamespace string) *unstructured.Unstructured {
	obj := &unstructured.Unstructured{}
	obj.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "multicluster.openshift.io",
		Version: "v1",
		Kind:    "MultiClusterEngine",
	})
	obj.SetName("engine")
	if err := unstructured.SetNestedField(obj.Object, targetNamespace, "spec", "targetNamespace"); err != nil {
		panic(err)
	}
	return obj
}

func TestServiceHost(t *testing.T) {
	if got := clusterproxy.ServiceHost(""); got != "cluster-proxy-addon-user.multicluster-engine.svc.cluster.local" {
		t.Fatalf("empty ns: %s", got)
	}
	if got := clusterproxy.ServiceHost("mce"); got != "cluster-proxy-addon-user.mce.svc.cluster.local" {
		t.Fatalf("mce ns: %s", got)
	}
}

func TestHostPortOverride(t *testing.T) {
	r := &clusterproxy.Resolver{HostOverride: "addon.example.com"}
	host, port := r.HostPort(context.Background())
	if host != "addon.example.com" || port != "443" {
		t.Fatalf("got %s:%s", host, port)
	}
}

func TestURLRouteOverride(t *testing.T) {
	r := &clusterproxy.Resolver{RouteOverride: "https://addon.example.com"}
	u, err := r.URL(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if u.String() != "https://addon.example.com" {
		t.Fatalf("url %s", u)
	}
}

func TestNamespaceFromMCE(t *testing.T) {
	dc := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	}, mceObject("custom-mce"))

	r := &clusterproxy.Resolver{Dynamic: dc}
	host, port := r.HostPort(context.Background())
	if host != "cluster-proxy-addon-user.custom-mce.svc.cluster.local" || port != "9092" {
		t.Fatalf("got %s:%s", host, port)
	}
	// cached
	host2, _ := r.HostPort(context.Background())
	if host2 != host {
		t.Fatal("expected cache")
	}
}

func TestNamespaceFallbackOnError(t *testing.T) {
	r := &clusterproxy.Resolver{}
	host, port := r.HostPort(context.Background())
	if host != clusterproxy.ServiceHost(clusterproxy.DefaultNamespace) || port != "9092" {
		t.Fatalf("got %s:%s", host, port)
	}
}

func TestTargetURL(t *testing.T) {
	u, err := clusterproxy.TargetURL("addon.example.com", "443")
	if err != nil {
		t.Fatal(err)
	}
	if u.Scheme != "https" || u.Host != "addon.example.com:443" {
		t.Fatalf("url %s", u)
	}
}
