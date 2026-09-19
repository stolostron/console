// Copyright Contributors to the Open Cluster Management project

package clusterinfo_test

import (
	"bytes"
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
	discoveryfake "k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/rest"
	k8stesting "k8s.io/client-go/testing"

	"github.com/stolostron/console/backend/internal/clusterinfo"
	"github.com/stolostron/console/backend/internal/informers"
)

func apiProbeServer(t *testing.T) (*httptest.Server, *rest.Config) {
	t.Helper()
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("Authorization") != "Bearer good" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(ts.Close)
	return ts, &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
}

func TestOperatorCheck_BadBody(t *testing.T) {
	_, base := apiProbeServer(t)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base})
	req := httptest.NewRequest(http.MethodPost, "/operatorCheck", bytes.NewReader([]byte(`{"operator":"not-real"}`)))
	req.Header.Set("Authorization", "Bearer good")
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestHypershiftStatus_Disabled(t *testing.T) {
	_, base := apiProbeServer(t)
	mce := &unstructured.Unstructured{}
	mce.SetGroupVersionKind(schema.GroupVersionKind{
		Group: "multicluster.openshift.io", Version: "v1", Kind: "MultiClusterEngine",
	})
	mce.SetName("engine")
	components := []interface{}{
		map[string]interface{}{"name": "hypershift", "enabled": false},
		map[string]interface{}{"name": "hypershift-local-hosting", "enabled": true},
	}
	mce.Object = map[string]interface{}{
		"apiVersion": "multicluster.openshift.io/v1",
		"kind":       "MultiClusterEngine",
		"metadata":   map[string]interface{}{"name": "engine"},
		"spec": map[string]interface{}{
			"overrides": map[string]interface{}{"components": components},
		},
	}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}:               "MultiClusterEngineList",
		{Group: "addon.open-cluster-management.io", Version: "v1alpha1", Resource: "managedclusteraddons"}: "ManagedClusterAddOnList",
	}, mce)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	req := httptest.NewRequest(http.MethodGet, "/hypershift-status?hubName=local-cluster", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	body := payload["body"].(map[string]interface{})
	if body["isHypershiftEnabled"] != false {
		t.Fatalf("payload %#v", payload)
	}
}

func TestAPIPaths(t *testing.T) {
	_, base := apiProbeServer(t)
	disc := &discoveryfake.FakeDiscovery{
		Fake: &k8stesting.Fake{
			Resources: []*metav1.APIResourceList{{
				GroupVersion: "action.open-cluster-management.io/v1beta1",
				APIResources: []metav1.APIResource{{
					Name: "managedclusteractions",
					Kind: "ManagedClusterAction",
				}},
			}},
		},
	}
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Discovery: disc})
	req := httptest.NewRequest(http.MethodGet, "/apiPaths", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]map[string]map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["action.open-cluster-management.io/v1beta1"]["ManagedClusterAction"]["pluralName"] != "managedclusteractions" {
		t.Fatalf("got %#v", got)
	}
}

type staticMapper struct {
	lists map[string]*metav1.APIResourceList
}

func (m staticMapper) ServerResourcesForGroupVersion(gv string) (*metav1.APIResourceList, error) {
	if l, ok := m.lists[gv]; ok {
		return l, nil
	}
	return nil, runtime.NewMissingKindErr(gv)
}

func waitCacheSynced(t *testing.T, c *informers.InformerCache) {
	t.Helper()
	deadline := time.Now().Add(8 * time.Second)
	for time.Now().Before(deadline) {
		if c.HasSynced() {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("cache did not sync; statuses=%+v", c.SpecStatuses())
}

func TestClusterVersionFromCache(t *testing.T) {
	_, base := apiProbeServer(t)
	cv := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "config.openshift.io/v1",
		"kind":       "ClusterVersion",
		"metadata":   map[string]interface{}{"name": "version"},
		"status":     map[string]interface{}{"desired": map[string]interface{}{"version": "4.19.0"}},
	}}
	gvr := schema.GroupVersionResource{Group: "config.openshift.io", Version: "v1", Resource: "clusterversions"}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		gvr: "ClusterVersionList",
	}, cv)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"config.openshift.io/v1": {GroupVersion: "config.openshift.io/v1", APIResources: []metav1.APIResource{
			{Name: "clusterversions", Kind: "ClusterVersion", Verbs: []string{"list", "watch"}},
		}},
	}}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	cache := informers.StartSpecs(ctx, dyn, mapper, []informers.WatchSpec{
		{Kind: "ClusterVersion", APIVersion: "config.openshift.io/v1", ForwardEventsToClients: true},
	})
	waitCacheSynced(t, cache)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Cache: cache})
	req := httptest.NewRequest(http.MethodGet, "/cluster-version", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["version"] != "4.19.0" {
		t.Fatalf("got %#v", got)
	}
}

func TestMCHComponentsFromCache(t *testing.T) {
	_, base := apiProbeServer(t)
	mch := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "operator.open-cluster-management.io/v1",
		"kind":       "MultiClusterHub",
		"metadata":   map[string]interface{}{"name": "mch", "namespace": "open-cluster-management"},
		"spec": map[string]interface{}{
			"overrides": map[string]interface{}{
				"components": []interface{}{
					map[string]interface{}{"name": "console", "enabled": true},
				},
			},
		},
	}}
	gvr := schema.GroupVersionResource{Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs"}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		gvr: "MultiClusterHubList",
	}, mch)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"operator.open-cluster-management.io/v1": {GroupVersion: "operator.open-cluster-management.io/v1", APIResources: []metav1.APIResource{
			{Name: "multiclusterhubs", Kind: "MultiClusterHub", Verbs: []string{"list", "watch"}},
		}},
	}}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	cache := informers.StartSpecs(ctx, dyn, mapper, []informers.WatchSpec{
		{Kind: "MultiClusterHub", APIVersion: "operator.open-cluster-management.io/v1"},
	})
	waitCacheSynced(t, cache)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Cache: cache})
	req := httptest.NewRequest(http.MethodGet, "/multiclusterhub/components", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got []map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0]["name"] != "console" || got[0]["enabled"] != true {
		t.Fatalf("got %#v", got)
	}
}

func TestMCEComponentsFromCache(t *testing.T) {
	_, base := apiProbeServer(t)
	mce := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "multicluster.openshift.io/v1",
		"kind":       "MultiClusterEngine",
		"metadata":   map[string]interface{}{"name": "engine"},
		"spec": map[string]interface{}{
			"overrides": map[string]interface{}{
				"components": []interface{}{
					map[string]interface{}{"name": "hypershift", "enabled": true},
				},
			},
		},
	}}
	gvr := schema.GroupVersionResource{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		gvr: "MultiClusterEngineList",
	}, mce)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"multicluster.openshift.io/v1": {GroupVersion: "multicluster.openshift.io/v1", APIResources: []metav1.APIResource{
			{Name: "multiclusterengines", Kind: "MultiClusterEngine", Verbs: []string{"list", "watch"}},
		}},
	}}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	cache := informers.StartSpecs(ctx, dyn, mapper, []informers.WatchSpec{
		{Kind: "MultiClusterEngine", APIVersion: "multicluster.openshift.io/v1"},
	})
	waitCacheSynced(t, cache)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Cache: cache})
	req := httptest.NewRequest(http.MethodGet, "/multiclusterengine/components", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got []map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0]["name"] != "hypershift" || got[0]["enabled"] != true {
		t.Fatalf("got %#v", got)
	}
}

func TestHypershiftStatusFromCache(t *testing.T) {
	_, base := apiProbeServer(t)
	mce := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "multicluster.openshift.io/v1",
		"kind":       "MultiClusterEngine",
		"metadata":   map[string]interface{}{"name": "engine"},
		"spec": map[string]interface{}{
			"overrides": map[string]interface{}{
				"components": []interface{}{
					map[string]interface{}{"name": "hypershift", "enabled": true},
					map[string]interface{}{"name": "hypershift-local-hosting", "enabled": true},
				},
			},
		},
	}}
	addon := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "addon.open-cluster-management.io/v1alpha1",
		"kind":       "ManagedClusterAddOn",
		"metadata":   map[string]interface{}{"name": "hypershift-addon", "namespace": "local-cluster"},
		"status": map[string]interface{}{
			"conditions": []interface{}{
				map[string]interface{}{"reason": "ManagedClusterAddOnLeaseUpdated", "status": "True"},
			},
		},
	}}
	mceGVR := schema.GroupVersionResource{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}
	addonGVR := schema.GroupVersionResource{Group: "addon.open-cluster-management.io", Version: "v1alpha1", Resource: "managedclusteraddons"}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		mceGVR:   "MultiClusterEngineList",
		addonGVR: "ManagedClusterAddOnList",
	}, mce, addon)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"multicluster.openshift.io/v1": {GroupVersion: "multicluster.openshift.io/v1", APIResources: []metav1.APIResource{
			{Name: "multiclusterengines", Kind: "MultiClusterEngine", Verbs: []string{"list", "watch"}},
		}},
		"addon.open-cluster-management.io/v1alpha1": {GroupVersion: "addon.open-cluster-management.io/v1alpha1", APIResources: []metav1.APIResource{
			{Name: "managedclusteraddons", Kind: "ManagedClusterAddOn", Namespaced: true, Verbs: []string{"list", "watch"}},
		}},
	}}
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	cache := informers.StartSpecs(ctx, dyn, mapper, []informers.WatchSpec{
		{Kind: "MultiClusterEngine", APIVersion: "multicluster.openshift.io/v1", ForwardEventsToClients: true},
		{Kind: "ManagedClusterAddOn", APIVersion: "addon.open-cluster-management.io/v1alpha1", ForwardEventsToClients: true},
	})
	waitCacheSynced(t, cache)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Cache: cache})
	req := httptest.NewRequest(http.MethodGet, "/hypershift-status?hubName=local-cluster", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	body := payload["body"].(map[string]interface{})
	if body["isHypershiftEnabled"] != true {
		t.Fatalf("payload %#v", payload)
	}
}
