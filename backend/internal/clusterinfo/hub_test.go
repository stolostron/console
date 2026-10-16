// Copyright Contributors to the Open Cluster Management project

package clusterinfo_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	dynamicfake "k8s.io/client-go/dynamic/fake"

	"github.com/stolostron/console/backend/internal/clusterinfo"
	"github.com/stolostron/console/backend/internal/informers"
)

func authenticationOIDC() *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "config.openshift.io/v1",
		"kind":       "Authentication",
		"metadata":   map[string]interface{}{"name": "cluster"},
		"spec": map[string]interface{}{
			"type": "OIDC",
			"oidcProviders": []interface{}{
				map[string]interface{}{
					"claimMappings": map[string]interface{}{
						"username": map[string]interface{}{
							"claim":        "email",
							"prefix":       "-",
							"prefixPolicy": "NoPrefix",
						},
						"groups": map[string]interface{}{
							"claim":  "groups",
							"prefix": "ocm:",
						},
					},
				},
			},
		},
	}}
}

func localManagedCluster(name string) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "cluster.open-cluster-management.io/v1",
		"kind":       "ManagedCluster",
		"metadata": map[string]interface{}{
			"name":   name,
			"labels": map[string]interface{}{"local-cluster": "true"},
		},
	}}
}

func observabilityAddon(namespace string) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "addon.open-cluster-management.io/v1alpha1",
		"kind":       "ManagedClusterAddOn",
		"metadata":   map[string]interface{}{"name": "observability-controller", "namespace": namespace},
	}}
}

func globalHubCRD() *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "apiextensions.k8s.io/v1",
		"kind":       "CustomResourceDefinition",
		"metadata":   map[string]interface{}{"name": "multiclusterglobalhubs.operator.open-cluster-management.io"},
	}}
}

func hubListKinds() map[schema.GroupVersionResource]string {
	return map[schema.GroupVersionResource]string{
		{Group: "cluster.open-cluster-management.io", Version: "v1", Resource: "managedclusters"}:          "ManagedClusterList",
		{Group: "addon.open-cluster-management.io", Version: "v1alpha1", Resource: "managedclusteraddons"}: "ManagedClusterAddOnList",
		{Group: "config.openshift.io", Version: "v1", Resource: "authentications"}:                         "AuthenticationList",
		{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}:              "CustomResourceDefinitionList",
	}
}

func TestHubFromCache(t *testing.T) {
	_, base := apiProbeServer(t)
	hubName := "my-local-hub"
	mc := localManagedCluster(hubName)
	addon := observabilityAddon(hubName)
	authn := authenticationOIDC()
	crd := globalHubCRD()
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), hubListKinds(), mc, addon, authn, crd)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"cluster.open-cluster-management.io/v1": {GroupVersion: "cluster.open-cluster-management.io/v1", APIResources: []metav1.APIResource{
			{Name: "managedclusters", Kind: "ManagedCluster", Verbs: []string{"list", "watch"}},
		}},
		"addon.open-cluster-management.io/v1alpha1": {GroupVersion: "addon.open-cluster-management.io/v1alpha1", APIResources: []metav1.APIResource{
			{Name: "managedclusteraddons", Kind: "ManagedClusterAddOn", Namespaced: true, Verbs: []string{"list", "watch"}},
		}},
		"config.openshift.io/v1": {GroupVersion: "config.openshift.io/v1", APIResources: []metav1.APIResource{
			{Name: "authentications", Kind: "Authentication", Verbs: []string{"list", "watch"}},
		}},
	}}
	ctx, _ := contextWithCancel(t)
	cache := informers.StartSpecs(ctx, dyn, mapper, []informers.WatchSpec{
		{Kind: "ManagedCluster", APIVersion: "cluster.open-cluster-management.io/v1", ForwardEventsToClients: true},
		{Kind: "ManagedClusterAddOn", APIVersion: "addon.open-cluster-management.io/v1alpha1", ForwardEventsToClients: true},
		{Kind: "Authentication", APIVersion: "config.openshift.io/v1", ForwardEventsToClients: false, ClusterScoped: true},
	})
	waitCacheSynced(t, cache)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn, Cache: cache})
	req := httptest.NewRequest(http.MethodGet, "/hub", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["isGlobalHub"] != true || got["localHubName"] != hubName || got["isHubSelfManaged"] != true {
		t.Fatalf("hub flags %#v", got)
	}
	if got["isObservabilityInstalled"] != true {
		t.Fatalf("observability %#v", got)
	}
	auth := got["authentication"].(map[string]interface{})
	if auth["isDirectAuthenticationEnabled"] != true {
		t.Fatalf("auth %#v", auth)
	}
	mappings := auth["claimMappings"].(map[string]interface{})
	if mappings["username"] == nil || mappings["groups"] == nil {
		t.Fatalf("claimMappings %#v", mappings)
	}
	// Second request hits hubFlags TTL cache.
	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, req)
	if rec2.Code != http.StatusOK {
		t.Fatalf("cached status %d", rec2.Code)
	}
}

func TestHubLive(t *testing.T) {
	_, base := apiProbeServer(t)
	hubName := "live-hub"
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), hubListKinds(),
		localManagedCluster(hubName),
		observabilityAddon(hubName),
		authenticationOIDC(),
	)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	req := httptest.NewRequest(http.MethodGet, "/hub", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["localHubName"] != hubName || got["isHubSelfManaged"] != true || got["isObservabilityInstalled"] != true {
		t.Fatalf("got %#v", got)
	}
	if got["isGlobalHub"] != false {
		t.Fatalf("global hub %#v", got)
	}
}

func TestHubGlobalHubCRDCache(t *testing.T) {
	_, base := apiProbeServer(t)
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), hubListKinds(), globalHubCRD())
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	req := httptest.NewRequest(http.MethodGet, "/hub", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["isGlobalHub"] != true {
		t.Fatalf("got %#v", got)
	}
	// CRD lookup is cached for globalHubCRDCacheTTL.
	time.Sleep(10 * time.Millisecond)
	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, req)
	var got2 map[string]interface{}
	if err := json.Unmarshal(rec2.Body.Bytes(), &got2); err != nil {
		t.Fatal(err)
	}
	if got2["isGlobalHub"] != true {
		t.Fatalf("cached %#v", got2)
	}
}

func contextWithCancel(t *testing.T) (context.Context, func()) {
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	return ctx, cancel
}
