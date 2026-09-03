// Copyright Contributors to the Open Cluster Management project

package clusterinfo_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	discoveryfake "k8s.io/client-go/discovery/fake"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/rest"
	k8stesting "k8s.io/client-go/testing"

	"github.com/stolostron/console/backend/internal/clusterinfo"
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
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
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
