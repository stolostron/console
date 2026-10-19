// Copyright Contributors to the Open Cluster Management project

package clusterproxy_test

import (
	"context"
	"net/url"
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

func TestNamespaceErrorDoesNotCache(t *testing.T) {
	r := &clusterproxy.Resolver{}
	host, _ := r.HostPort(context.Background())
	if host != clusterproxy.ServiceHost(clusterproxy.DefaultNamespace) {
		t.Fatalf("got %s", host)
	}
	dc := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	}, mceObject("later-ns"))
	r.Dynamic = dc
	host2, _ := r.HostPort(context.Background())
	if host2 != clusterproxy.ServiceHost("later-ns") {
		t.Fatalf("error path cached default: %s", host2)
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

func TestTargetURLEmptyHost(t *testing.T) {
	_, err := clusterproxy.TargetURL("", "9092")
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestTargetURLDefaultPort(t *testing.T) {
	u, err := clusterproxy.TargetURL("addon.example.com", "")
	if err != nil {
		t.Fatal(err)
	}
	if u.Host != "addon.example.com:9092" {
		t.Fatalf("host %s", u.Host)
	}
}

func TestResolverTargetURL(t *testing.T) {
	target, _ := url.Parse("http://[::1]:8080/path")
	r := &clusterproxy.Resolver{Target: target}
	host, port := r.HostPort(context.Background())
	if host != "::1" || port != "8080" {
		t.Fatalf("got %s:%s", host, port)
	}
	u, err := r.ProxyURL(context.Background())
	if err != nil || u != target {
		t.Fatalf("proxy %v err %v", u, err)
	}
	u2, err := r.URL(context.Background())
	if err != nil || u2 != target {
		t.Fatalf("url %v err %v", u2, err)
	}
}

func TestHostPortWithoutHostOverride(t *testing.T) {
	dc := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	}, mceObject("mce-ns"))
	r := &clusterproxy.Resolver{Dynamic: dc, HostOverride: "route.example.com"}
	host, port := r.HostPortWithoutHostOverride(context.Background())
	if host != "cluster-proxy-addon-user.mce-ns.svc.cluster.local" || port != "9092" {
		t.Fatalf("got %s:%s", host, port)
	}
	u, err := r.URL(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if u.Host != "cluster-proxy-addon-user.mce-ns.svc.cluster.local:9092" {
		t.Fatalf("url %s", u.String())
	}
}

func TestResolverNilNamespace(t *testing.T) {
	var r *clusterproxy.Resolver
	host, port := r.HostPort(context.Background())
	want := clusterproxy.ServiceHost(clusterproxy.DefaultNamespace)
	if host != want || port != "9092" {
		t.Fatalf("got %s:%s", host, port)
	}
}

func TestTargetURLIPv6Host(t *testing.T) {
	u, err := clusterproxy.TargetURL("2001:db8::1", "443")
	if err != nil {
		t.Fatal(err)
	}
	if u.Host != "[2001:db8::1]:443" {
		t.Fatalf("host %s", u.Host)
	}
}

func TestNamespaceEmptyTargetNamespace(t *testing.T) {
	dc := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	}, mceObject(""))
	r := &clusterproxy.Resolver{Dynamic: dc}
	host, _ := r.HostPort(context.Background())
	if host != clusterproxy.ServiceHost(clusterproxy.DefaultNamespace) {
		t.Fatalf("host %s", host)
	}
}
