// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"sync"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/fake"

	"github.com/stolostron/console/backend/internal/searchapi"
)

func TestDiscoverPrefixesDefaultsWithoutDynamic(t *testing.T) {
	e := NewEngine(nil, nil, nil)
	e.discoverPrefixes(context.Background())
	want := []string{"openshift", "hive", "open-cluster-management", "multicluster-engine"}
	if !reflect.DeepEqual(e.systemPrefixes, want) {
		t.Fatalf("prefixes=%v want %v", e.systemPrefixes, want)
	}
}

func TestDiscoverPrefixesFromHub(t *testing.T) {
	mch := &unstructured.Unstructured{}
	mch.SetGroupVersionKind(schema.GroupVersionKind{
		Group: "operator.open-cluster-management.io", Version: "v1", Kind: "MultiClusterHub",
	})
	mch.SetName("hub")
	mch.SetNamespace("acm-install")

	mce := &unstructured.Unstructured{}
	mce.SetGroupVersionKind(schema.GroupVersionKind{
		Group: "multicluster.openshift.io", Version: "v1", Kind: "MultiClusterEngine",
	})
	mce.SetName("engine")
	if err := unstructured.SetNestedField(mce.Object, "custom-mce", "spec", "targetNamespace"); err != nil {
		t.Fatal(err)
	}

	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs"}: "MultiClusterHubList",
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}:        "MultiClusterEngineList",
	}, mch, mce)
	e := NewEngine(nil, nil, client)
	e.discoverPrefixes(context.Background())
	want := []string{"openshift", "hive", "open-cluster-management", "acm-install", "custom-mce"}
	if !reflect.DeepEqual(e.systemPrefixes, want) {
		t.Fatalf("prefixes=%v want %v", e.systemPrefixes, want)
	}
}

func TestDiscoverPrefixesRespectsContextDeadline(t *testing.T) {
	e := NewEngine(nil, nil, hangDynamic{})
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	start := time.Now()
	e.discoverPrefixes(ctx)
	if elapsed := time.Since(start); elapsed > time.Second {
		t.Fatalf("discoverPrefixes hung for %v past parent deadline", elapsed)
	}
	want := []string{"openshift", "hive", "open-cluster-management", "multicluster-engine"}
	if !reflect.DeepEqual(e.systemPrefixes, want) {
		t.Fatalf("prefixes=%v want %v", e.systemPrefixes, want)
	}
}

// hangDynamic List calls block until the request context is done.
type hangDynamic struct{}

func (hangDynamic) Resource(schema.GroupVersionResource) dynamic.NamespaceableResourceInterface {
	return hangResource{}
}

type hangResource struct{}

func (hangResource) Namespace(string) dynamic.ResourceInterface { return hangResource{} }

func (hangResource) List(ctx context.Context, _ metav1.ListOptions) (*unstructured.UnstructuredList, error) {
	<-ctx.Done()
	return nil, ctx.Err()
}

func (hangResource) Create(context.Context, *unstructured.Unstructured, metav1.CreateOptions, ...string) (*unstructured.Unstructured, error) {
	panic("unexpected")
}
func (hangResource) Update(context.Context, *unstructured.Unstructured, metav1.UpdateOptions, ...string) (*unstructured.Unstructured, error) {
	panic("unexpected")
}
func (hangResource) UpdateStatus(context.Context, *unstructured.Unstructured, metav1.UpdateOptions) (*unstructured.Unstructured, error) {
	panic("unexpected")
}
func (hangResource) Delete(context.Context, string, metav1.DeleteOptions, ...string) error {
	panic("unexpected")
}
func (hangResource) DeleteCollection(context.Context, metav1.DeleteOptions, metav1.ListOptions) error {
	panic("unexpected")
}
func (hangResource) Get(context.Context, string, metav1.GetOptions, ...string) (*unstructured.Unstructured, error) {
	panic("unexpected")
}
func (hangResource) Watch(context.Context, metav1.ListOptions) (watch.Interface, error) {
	panic("unexpected")
}
func (hangResource) Patch(context.Context, string, types.PatchType, []byte, metav1.PatchOptions, ...string) (*unstructured.Unstructured, error) {
	panic("unexpected")
}
func (hangResource) Apply(context.Context, string, *unstructured.Unstructured, metav1.ApplyOptions, ...string) (*unstructured.Unstructured, error) {
	panic("unexpected")
}
func (hangResource) ApplyStatus(context.Context, string, *unstructured.Unstructured, metav1.ApplyOptions) (*unstructured.Unstructured, error) {
	panic("unexpected")
}

func TestAddQueryInputs(t *testing.T) {
	e := NewEngine(MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
	}, nil, nil)
	q := searchapi.NewQuery()
	e.addArgoQueryInputs(&q)
	e.addOCPQueryInputs(&q)
	e.addSystemQueryInputs(&q)
	if len(q.Variables.Input) != 3 {
		t.Fatalf("inputs %d", len(q.Variables.Input))
	}
	if q.Variables.Input[0].Filters[0].Values[0] != "Application" {
		t.Fatalf("%+v", q.Variables.Input[0])
	}
	if q.Variables.Input[1].Filters[0].Values[0] != "Deployment" {
		t.Fatalf("%+v", q.Variables.Input[1])
	}
}

func TestAggregateRemoteCachesArgo(t *testing.T) {
	var gotQuery searchapi.Query
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(body, &gotQuery)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"data":{"searchResult":[
			{"items":[{"name":"remote-app","namespace":"argocd","cluster":"remote","healthStatus":"Healthy","syncStatus":"Synced","_uid":"1","destinationNamespace":"ns","destinationName":"in-cluster"}],"related":[]},
			{"items":[],"related":[]}
		]}}`))
	}))
	defer ts.Close()
	client := &searchapi.Client{HTTP: ts.Client(), SearchAPIURL: ts.URL, Token: "sa"}
	e := NewEngine(MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
	}, client, nil)
	if err := e.aggregateRemote(context.Background(), 1); err != nil {
		t.Fatal(err)
	}
	apps := e.applications()
	found := false
	for _, a := range apps {
		if metaName(a.Object) == "remote-app" {
			found = true
		}
	}
	if !found {
		t.Fatalf("missing remote app in %+v", apps)
	}
}

func TestPushModelQueryFromAppSet(t *testing.T) {
	e := NewEngine(MapLister{
		"cluster.open-cluster-management.io/v1|ManagedCluster": {
			localCluster(),
			uObj("cluster.open-cluster-management.io/v1", "ManagedCluster", "remote", "", nil),
		},
	}, nil, nil)
	e.appSetAppsMap = map[string][]map[string]any{
		"set-1": {{
			"metadata": map[string]any{"name": "child", "namespace": "argocd"},
			"spec":     map[string]any{"destination": map[string]any{"name": "remote", "namespace": "ns"}},
			"status": map[string]any{
				"resources": []any{
					map[string]any{"kind": "Deployment", "name": "web", "namespace": "ns"},
				},
			},
		}},
	}
	q := searchapi.NewQuery()
	push, err := e.addPushModelPodQueryInputs(&q)
	if err != nil {
		t.Fatal(err)
	}
	if len(push) != 1 {
		t.Fatalf("push %v", push)
	}
	if len(q.Variables.Input) != 1 {
		t.Fatalf("query %+v", q)
	}
}

type countingLister struct {
	inner MapLister
	mu    sync.Mutex
	n     map[string]int
}

func (c *countingLister) ListByKind(apiVersion, kind string) []unstructured.Unstructured {
	c.mu.Lock()
	if c.n == nil {
		c.n = map[string]int{}
	}
	c.n[apiVersion+"|"+kind]++
	c.mu.Unlock()
	return c.inner.ListByKind(apiVersion, kind)
}

func (c *countingLister) count(key string) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n[key]
}

func TestApplicationsReadOnly(t *testing.T) {
	cl := &countingLister{inner: MapLister{
		"app.k8s.io/v1beta1|Application": {
			uObj("app.k8s.io/v1beta1", "Application", "sub-app", "ns", nil),
		},
		"argoproj.io/v1alpha1|Application": {
			uObj("argoproj.io/v1alpha1", "Application", "argo-app", "argocd", nil),
		},
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
	}}
	e := NewEngine(cl, nil, nil)
	e.mu.Lock()
	e.rebuildLocalLocked()
	e.mu.Unlock()
	cl.mu.Lock()
	cl.n = map[string]int{}
	cl.mu.Unlock()
	e.cache[cacheLocalArgo].Resources = []App{
		{Object: map[string]any{"metadata": map[string]any{"name": "cached-argo"}}},
	}
	apps := e.applications()
	if cl.count("argoproj.io/v1alpha1|Application") != 0 {
		t.Fatalf("applications() should not list anything, got argo %d", cl.count("argoproj.io/v1alpha1|Application"))
	}
	if cl.count("app.k8s.io/v1beta1|Application") != 0 {
		t.Fatalf("applications() should not list anything, got subscription %d", cl.count("app.k8s.io/v1beta1|Application"))
	}
	found := false
	for _, a := range apps {
		if metaName(a.Object) == "cached-argo" {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected cached argo in %+v", apps)
	}
}

func TestRebuildLocalMemoizesListKind(t *testing.T) {
	cl := &countingLister{inner: MapLister{
		"app.k8s.io/v1beta1|Application":                       {},
		"argoproj.io/v1alpha1|Application":                     {},
		"argoproj.io/v1alpha1|ApplicationSet":                  {},
		"cluster.open-cluster-management.io/v1|ManagedCluster": {localCluster()},
	}}
	e := NewEngine(cl, nil, nil)
	e.mu.Lock()
	e.rebuildLocalLocked()
	e.mu.Unlock()
	if got := cl.count("cluster.open-cluster-management.io/v1|ManagedCluster"); got != 1 {
		t.Fatalf("ManagedCluster lists %d want 1", got)
	}
}
