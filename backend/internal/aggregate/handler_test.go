// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func testAuthOK(_ http.ResponseWriter, _ *http.Request) (string, bool) {
	return "tok", true
}

func testHandler(t *testing.T, lister Lister) *Handler {
	t.Helper()
	eng := NewEngine(lister, nil, nil)
	zero := 0
	eng.PreLimit = &zero
	h := NewHandler(eng, nil, AllowAll{})
	h.Authn = testAuthOK
	return h
}

func postAggregate(t *testing.T, h http.Handler, path string, body any) *http.Response {
	t.Helper()
	var r io.Reader
	if body != nil {
		if s, ok := body.(string); ok {
			r = bytes.NewBufferString(s)
		} else {
			b, err := json.Marshal(body)
			if err != nil {
				t.Fatal(err)
			}
			r = bytes.NewReader(b)
		}
	}
	req := httptest.NewRequest(http.MethodPost, path, r)
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec.Result()
}

func localCluster() unstructured.Unstructured {
	return uObj("cluster.open-cluster-management.io/v1", "ManagedCluster", "local-cluster", "", map[string]any{
		"metadata": map[string]any{
			"name":   "local-cluster",
			"labels": map[string]any{"local-cluster": "true"},
		},
	})
}

func TestUnauthorizedEmptyBody(t *testing.T) {
	h := testHandler(t, nil)
	h.Authn = func(w http.ResponseWriter, _ *http.Request) (string, bool) {
		w.WriteHeader(http.StatusUnauthorized)
		return "", false
	}
	resp := postAggregate(t, h, "/aggregate/applications", RequestListView{Page: 1, PerPage: 10})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status %d", resp.StatusCode)
	}
	b, _ := io.ReadAll(resp.Body)
	if len(b) != 0 {
		t.Fatalf("body %q", b)
	}
}

func TestNotFoundEmptyBody(t *testing.T) {
	h := testHandler(t, nil)
	resp := postAggregate(t, h, "/aggregate/unknown", map[string]any{})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNotFound {
		t.Fatalf("status %d", resp.StatusCode)
	}
	b, _ := io.ReadAll(resp.Body)
	if len(b) != 0 {
		t.Fatalf("body %q", b)
	}
}

func TestApplicationsInvalidJSON500(t *testing.T) {
	h := testHandler(t, nil)
	resp := postAggregate(t, h, "/aggregate/applications", "{")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestAppSetDataInvalidJSON400(t *testing.T) {
	h := testHandler(t, nil)
	resp := postAggregate(t, h, "/aggregate/appSetData", "{")
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if ct := resp.Header.Get("Content-Type"); !strings.Contains(ct, "json") {
		t.Fatalf("content-type %q", ct)
	}
	var out map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if out["error"] != "Invalid request body" {
		t.Fatalf("%v", out)
	}
}

func TestAppSetDataFetchError400(t *testing.T) {
	h := testHandler(t, nil)
	h.GetAppSet = func(context.Context, string, map[string]any) (map[string]any, error) {
		return nil, errors.New("no")
	}
	resp := postAggregate(t, h, "/aggregate/appSetData", map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "ApplicationSet",
		"metadata":   map[string]any{"name": "s", "namespace": "ns"},
	})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestMulticloudAggregatePath(t *testing.T) {
	h := testHandler(t, MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
	})
	resp := postAggregate(t, h, "/multicloud/aggregate/applications", RequestListView{Page: 1, PerPage: 10})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestApplicationsAndStatuses(t *testing.T) {
	lister := MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
		"app.k8s.io/v1beta1|Application": {
			uObj("app.k8s.io/v1beta1", "Application", "test-app", "default", map[string]any{
				"metadata": map[string]any{
					"name":              "test-app",
					"namespace":         "default",
					"creationTimestamp": "2024-01-01T00:00:00Z",
					"annotations": map[string]any{
						"apps.open-cluster-management.io/subscriptions": "default/sub",
					},
				},
			}),
		},
		"apps.open-cluster-management.io/v1|Subscription": {
			uObj("apps.open-cluster-management.io/v1", "Subscription", "sub", "default", nil),
		},
	}
	h := testHandler(t, lister)
	resp := postAggregate(t, h, "/aggregate/applications", RequestListView{Page: 1, PerPage: 10})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	var list ResultListView
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		t.Fatal(err)
	}
	if list.ProcessedItemCount != 1 || len(list.Items) != 1 {
		t.Fatalf("list %+v", list)
	}
	if !list.IsPreProcessed {
		t.Fatal("test breakpoint 0 should preprocess")
	}

	resp2 := postAggregate(t, h, "/aggregate/statuses", requestStatuses{})
	defer resp2.Body.Close()
	if resp2.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp2.StatusCode)
	}
	var st resultStatuses
	if err := json.NewDecoder(resp2.Body).Decode(&st); err != nil {
		t.Fatal(err)
	}
	if st.ItemCount != "1" {
		t.Fatalf("itemCount %q", st.ItemCount)
	}
	if st.FilterCounts["type"]["subscription"] != 1 {
		t.Fatalf("counts %+v", st.FilterCounts)
	}
	if len(st.FilterCounts["healthStatus"]) != 0 || len(st.FilterCounts["podStatuses"]) != 0 {
		t.Fatalf("status counts should stay empty for subscription: %+v", st.FilterCounts)
	}
}

func TestAppSetDataOK(t *testing.T) {
	appset := map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "ApplicationSet",
		"metadata":   map[string]any{"name": "set-1", "namespace": "openshift-gitops"},
		"spec": map[string]any{
			"generators": []any{
				map[string]any{
					"clusterDecisionResource": map[string]any{
						"labelSelector": map[string]any{
							"matchLabels": map[string]any{
								"cluster.open-cluster-management.io/placement": "place-1",
							},
						},
					},
				},
			},
		},
	}
	lister := MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
		"cluster.open-cluster-management.io/v1beta1|Placement": {
			uObj("cluster.open-cluster-management.io/v1beta1", "Placement", "place-1", "openshift-gitops", nil),
		},
		"cluster.open-cluster-management.io/v1beta1|PlacementDecision": {
			uObj("cluster.open-cluster-management.io/v1beta1", "PlacementDecision", "place-1-dec", "openshift-gitops", map[string]any{
				"metadata": map[string]any{
					"name":      "place-1-dec",
					"namespace": "openshift-gitops",
					"labels": map[string]any{
						"cluster.open-cluster-management.io/placement": "place-1",
					},
					"ownerReferences": []any{
						map[string]any{"kind": "Placement", "name": "place-1"},
					},
				},
				"status": map[string]any{
					"decisions": []any{map[string]any{"clusterName": "remote-1"}},
				},
			}),
		},
	}
	h := testHandler(t, lister)
	h.GetAppSet = func(_ context.Context, _ string, _ map[string]any) (map[string]any, error) {
		return appset, nil
	}
	resp := postAggregate(t, h, "/aggregate/appSetData", appset)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	var out resultAppSetData
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		t.Fatal(err)
	}
	if metaName(out.Appset) != "set-1" {
		t.Fatalf("%v", out.Appset)
	}
	if len(out.ClusterList) == 0 || out.ClusterList[0] != "remote-1" {
		t.Fatalf("clusters %v", out.ClusterList)
	}
	if out.Placement == nil || metaName(out.Placement) != "place-1" {
		t.Fatalf("placement %v", out.Placement)
	}
}
