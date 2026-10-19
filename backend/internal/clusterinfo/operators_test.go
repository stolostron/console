// Copyright Contributors to the Open Cluster Management project

package clusterinfo_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/discovery"
	discoveryfake "k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	k8stesting "k8s.io/client-go/testing"

	"github.com/stolostron/console/backend/internal/clusterinfo"
	"github.com/stolostron/console/backend/internal/httpx"
)

func subscriptionOperator(name, csv string) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "operators.coreos.com/v1alpha1",
		"kind":       "Subscription",
		"metadata":   map[string]interface{}{"name": "sub-" + name, "namespace": "openshift-operators"},
		"spec":       map[string]interface{}{"name": name},
		"status": map[string]interface{}{
			"installedCSV": csv,
			"conditions": []interface{}{
				map[string]interface{}{"type": "CatalogSourcesUnhealthy", "status": "False"},
			},
		},
	}}
}

func clusterExtensionOperator(pkg, version string) *unstructured.Unstructured {
	return &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "olm.operatorframework.io/v1",
		"kind":       "ClusterExtension",
		"metadata":   map[string]interface{}{"name": "ext-" + pkg},
		"spec": map[string]interface{}{
			"source": map[string]interface{}{
				"catalog": map[string]interface{}{"packageName": pkg},
			},
		},
		"status": map[string]interface{}{
			"conditions": []interface{}{
				map[string]interface{}{"type": "Installed", "status": "True"},
			},
			"install": map[string]interface{}{
				"bundle": map[string]interface{}{"version": version},
			},
		},
	}}
}

func operatorListKinds() map[schema.GroupVersionResource]string {
	return map[schema.GroupVersionResource]string{
		{Group: "operators.coreos.com", Version: "v1alpha1", Resource: "subscriptions"}:   "SubscriptionList",
		{Group: "olm.operatorframework.io", Version: "v1", Resource: "clusterextensions"}: "ClusterExtensionList",
	}
}

func TestOperatorCheck_SubscriptionInstalled(t *testing.T) {
	_, base := apiProbeServer(t)
	op := "openshift-gitops-operator"
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), operatorListKinds(),
		subscriptionOperator(op, "gitops.v1.0.0"),
	)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	body := fmt.Sprintf(`{"operator":"%s"}`, op)
	req := httptest.NewRequest(http.MethodPost, "/operatorCheck", bytes.NewReader([]byte(body)))
	req.Header.Set("Authorization", "Bearer good")
	req.Header.Set(httpx.HeaderContentType, httpx.MIMEJSON)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["installed"] != true || got["version"] != "gitops.v1.0.0" {
		t.Fatalf("got %#v", got)
	}
}

func TestOperatorCheck_ClusterExtensionInstalled(t *testing.T) {
	_, base := apiProbeServer(t)
	op := "kubevirt-hyperconverged"
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), operatorListKinds(),
		clusterExtensionOperator(op, "4.16.0"),
	)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	body := fmt.Sprintf(`{"operator":"%s"}`, op)
	req := httptest.NewRequest(http.MethodPost, "/operatorCheck", bytes.NewReader([]byte(body)))
	req.Header.Set("Authorization", "Bearer good")
	req.Header.Set(httpx.HeaderContentType, httpx.MIMEJSON)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["installed"] != true || got["version"] != "4.16.0" {
		t.Fatalf("got %#v", got)
	}
}

func TestOperatorCheck_NotInstalled(t *testing.T) {
	_, base := apiProbeServer(t)
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), operatorListKinds())
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	body := bytes.NewReader([]byte(`{"operator":"advanced-cluster-management"}`))
	req := httptest.NewRequest(http.MethodPost, "/operatorCheck", body)
	req.Header.Set("Authorization", "Bearer good")
	req.Header.Set(httpx.HeaderContentType, httpx.MIMEJSON)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["installed"] != false {
		t.Fatalf("got %#v", got)
	}
}

func TestOperatorCheck_InvalidJSON(t *testing.T) {
	_, base := apiProbeServer(t)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base})
	req := httptest.NewRequest(http.MethodPost, "/operatorCheck", bytes.NewReader([]byte(`not-json`)))
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestAPIPaths_DiscoveryHardError(t *testing.T) {
	_, base := apiProbeServer(t)
	disc := &discoveryfake.FakeDiscovery{Fake: &k8stesting.Fake{}}
	disc.PrependReactor("get", "resource", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, errors.New("discovery unavailable")
	})
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Discovery: disc})
	req := httptest.NewRequest(http.MethodGet, "/apiPaths", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
}

func TestAPIPaths_PartialDiscovery(t *testing.T) {
	_, base := apiProbeServer(t)
	disc := &discoveryfake.FakeDiscovery{
		Fake: &k8stesting.Fake{
			Resources: []*metav1.APIResourceList{{
				GroupVersion: "apps/v1",
				APIResources: []metav1.APIResource{{Name: "deployments", Kind: "Deployment"}},
			}},
		},
	}
	disc.PrependReactor("get", "resource", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, &discovery.ErrGroupDiscoveryFailed{Groups: map[schema.GroupVersion]error{
			{Group: "broken", Version: "v1"}: fmt.Errorf("fail"),
		}}
	})
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
	if got["apps/v1"]["Deployment"]["pluralName"] != "deployments" {
		t.Fatalf("got %#v", got)
	}
}

func TestAPIPaths_SkipsSubresources(t *testing.T) {
	_, base := apiProbeServer(t)
	disc := &discoveryfake.FakeDiscovery{
		Fake: &k8stesting.Fake{
			Resources: []*metav1.APIResourceList{{
				GroupVersion: "v1",
				APIResources: []metav1.APIResource{
					{Name: "pods", Kind: "Pod"},
					{Name: "pods/status", Kind: "Pod"},
				},
			}},
		},
	}
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Discovery: disc})
	req := httptest.NewRequest(http.MethodGet, "/apiPaths", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	var got map[string]map[string]map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if len(got["v1"]) != 1 {
		t.Fatalf("got %#v", got)
	}
}

func TestServeHTTP_NotFoundAndMethods(t *testing.T) {
	_, base := apiProbeServer(t)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/missing", nil))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d", rec.Code)
	}
	rec = httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/hub", nil)
	req.Header.Set("Authorization", "Bearer good")
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestClusterVersionLive(t *testing.T) {
	_, base := apiProbeServer(t)
	cv := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "config.openshift.io/v1",
		"kind":       "ClusterVersion",
		"metadata":   map[string]interface{}{"name": "version"},
		"status":     map[string]interface{}{"desired": map[string]interface{}{"version": "4.18.1"}},
	}}
	gvr := schema.GroupVersionResource{
		Group: "config.openshift.io", Version: "v1", Resource: "clusterversions",
	}
	kinds := map[schema.GroupVersionResource]string{gvr: "ClusterVersionList"}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), kinds, cv)
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
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
	if got["version"] != "4.18.1" {
		t.Fatalf("got %#v", got)
	}
}

func TestMCHComponentsLiveMissingAPI(t *testing.T) {
	_, base := apiProbeServer(t)
	mchGVR := schema.GroupVersionResource{
		Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs",
	}
	kinds := map[schema.GroupVersionResource]string{mchGVR: "MultiClusterHubList"}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), kinds)
	dyn.PrependReactor("list", "multiclusterhubs", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, apierrors.NewNotFound(schema.GroupResource{Group: mchGVR.Group, Resource: mchGVR.Resource}, "")
	})
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	req := httptest.NewRequest(http.MethodGet, "/multiclusterhub/components", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "null" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestMCEComponentsLiveMissingAPI(t *testing.T) {
	_, base := apiProbeServer(t)
	mceGVR := schema.GroupVersionResource{
		Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines",
	}
	kinds := map[schema.GroupVersionResource]string{mceGVR: "MultiClusterEngineList"}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), kinds)
	dyn.PrependReactor("list", "multiclusterengines", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, nil, apierrors.NewNotFound(schema.GroupResource{Group: mceGVR.Group, Resource: mceGVR.Resource}, "")
	})
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	req := httptest.NewRequest(http.MethodGet, "/multiclusterengine/components", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "null" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestHypershiftStatus_ForbiddenAddon(t *testing.T) {
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
	mceGVR := schema.GroupVersionResource{
		Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines",
	}
	addonGVR := schema.GroupVersionResource{
		Group: "addon.open-cluster-management.io", Version: "v1alpha1", Resource: "managedclusteraddons",
	}
	kinds := map[schema.GroupVersionResource]string{
		mceGVR: "MultiClusterEngineList", addonGVR: "ManagedClusterAddOnList",
	}
	dyn := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), kinds, mce)
	dyn.PrependReactor("list", "managedclusteraddons", func(action k8stesting.Action) (bool, runtime.Object, error) {
		gr := schema.GroupResource{Group: addonGVR.Group, Resource: addonGVR.Resource}
		return true, nil, apierrors.NewForbidden(gr, "", errors.New("denied"))
	})
	h := clusterinfo.New(clusterinfo.Options{RESTConfig: base, Dynamic: dyn})
	req := httptest.NewRequest(http.MethodGet, "/hypershift-status", nil)
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
