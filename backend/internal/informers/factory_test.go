// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/rest"
	ktesting "k8s.io/client-go/testing"
)

func uObj(apiVersion, kind, ns, name, uid string, metaExtra map[string]any) *unstructured.Unstructured {
	meta := map[string]any{"name": name, "uid": uid}
	if ns != "" {
		meta["namespace"] = ns
	}
	for k, v := range metaExtra {
		meta[k] = v
	}
	return &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": apiVersion,
		"kind":       kind,
		"metadata":   meta,
	}}
}

type staticMapper struct {
	lists map[string]*metav1.APIResourceList
	errs  map[string]error
}

func (m staticMapper) ServerResourcesForGroupVersion(gv string) (*metav1.APIResourceList, error) {
	if err, ok := m.errs[gv]; ok {
		return nil, err
	}
	if l, ok := m.lists[gv]; ok {
		return l, nil
	}
	return nil, apierrors.NewNotFound(schema.GroupResource{Resource: "resource"}, gv)
}

func mapperFor(apiVersion string, resources ...metav1.APIResource) staticMapper {
	return staticMapper{lists: map[string]*metav1.APIResourceList{
		apiVersion: {GroupVersion: apiVersion, APIResources: resources},
	}}
}

func waitSynced(t *testing.T, c *InformerCache) {
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

func TestSelectorListWatchCapturesFieldSelector(t *testing.T) {
	scheme := runtime.NewScheme()
	listKinds := map[schema.GroupVersionResource]string{
		{Version: "v1", Resource: "configmaps"}: "ConfigMapList",
	}
	assisted := uObj("v1", "ConfigMap", "ns", "assisted-service", "uid-1", nil)
	other := uObj("v1", "ConfigMap", "ns", "other", "uid-2", nil)
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, assisted, other)

	var gotField string
	client.PrependReactor("list", "configmaps", func(action ktesting.Action) (bool, runtime.Object, error) {
		la, ok := action.(ktesting.ListAction)
		if ok {
			gotField = la.GetListRestrictions().Fields.String()
		}
		return false, nil, nil
	})

	mapper := mapperFor("v1", metav1.APIResource{Name: "configmaps", Kind: "ConfigMap", Namespaced: true, Verbs: []string{"list", "watch"}})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	spec := watch("ConfigMap", "v1").fields("metadata.name", "assisted-service")
	c := StartSpecs(ctx, client, mapper, []WatchSpec{spec})
	waitSynced(t, c)
	if gotField == "" {
		t.Fatal("expected field selector on list")
	}
	if gotField != "metadata.name=assisted-service" {
		t.Fatalf("field selector %q", gotField)
	}
}

func TestLabelSelectorInformerStore(t *testing.T) {
	scheme := runtime.NewScheme()
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "secrets"}
	listKinds := map[schema.GroupVersionResource]string{gvr: "SecretList"}
	keep := uObj("v1", "Secret", "ns", "creds", "uid-1", map[string]any{
		"labels": map[string]any{"cluster.open-cluster-management.io/credentials": ""},
	})
	drop := uObj("v1", "Secret", "ns", "other", "uid-2", nil)
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, keep, drop)
	mapper := mapperFor("v1", metav1.APIResource{Name: "secrets", Kind: "Secret", Namespaced: true, Verbs: []string{"list", "watch"}})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	spec := watch("Secret", "v1").labels("cluster.open-cluster-management.io/credentials", "")
	c := StartSpecs(ctx, client, mapper, []WatchSpec{spec})
	waitSynced(t, c)
	got := c.ListByKind("v1", "Secret")
	if len(got) != 1 || got[0].GetName() != "creds" {
		t.Fatalf("store %+v", names(got))
	}
}

func TestMissingGVRDoesNotBlockHasSynced(t *testing.T) {
	scheme := runtime.NewScheme()
	listKinds := map[schema.GroupVersionResource]string{
		{Version: "v1", Resource: "namespaces"}: "NamespaceList",
	}
	ns := uObj("v1", "Namespace", "", "default", "uid-ns", nil)
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, ns)
	mapper := staticMapper{
		lists: map[string]*metav1.APIResourceList{
			"v1": {GroupVersion: "v1", APIResources: []metav1.APIResource{
				{Name: "namespaces", Kind: "Namespace", Verbs: []string{"list", "watch"}},
			}},
		},
		errs: map[string]error{
			"hypershift.openshift.io/v1beta1": apierrors.NewNotFound(schema.GroupResource{Group: "hypershift.openshift.io", Resource: "hostedclusters"}, ""),
		},
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	c := StartSpecs(ctx, client, mapper, []WatchSpec{
		watch("Namespace", "v1"),
		watch("HostedCluster", "hypershift.openshift.io/v1beta1"),
	})
	waitSynced(t, c)
	snap := c.Snapshot()
	if len(snap) != 1 || snap[0].Kind != "Namespace" {
		t.Fatalf("snapshot %+v", snap)
	}
	var sawUnavailable bool
	for _, st := range c.SpecStatuses() {
		if st.Kind == "HostedCluster" && st.Unavailable {
			sawUnavailable = true
		}
	}
	if !sawUnavailable {
		t.Fatalf("expected HostedCluster unavailable: %+v", c.SpecStatuses())
	}
}

func TestAuthenticationInCacheAndSnapshot(t *testing.T) {
	scheme := runtime.NewScheme()
	gvr := schema.GroupVersionResource{Group: "config.openshift.io", Version: "v1", Resource: "authentications"}
	listKinds := map[schema.GroupVersionResource]string{gvr: "AuthenticationList"}
	authn := uObj("config.openshift.io/v1", "Authentication", "", "cluster", "uid-auth", nil)
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, authn)
	mapper := mapperFor("config.openshift.io/v1", metav1.APIResource{
		Name: "authentications", Kind: "Authentication", Verbs: []string{"list", "watch"},
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	c := StartSpecs(ctx, client, mapper, []WatchSpec{watch("Authentication", "config.openshift.io/v1").cacheOnly()})
	waitSynced(t, c)
	got := c.ListByKind("config.openshift.io/v1", "Authentication")
	if len(got) != 1 || got[0].GetName() != "cluster" {
		t.Fatalf("auth %+v", names(got))
	}
	snap := c.Snapshot()
	if len(snap) != 1 || snap[0].Kind != "Authentication" || snap[0].Name != "cluster" {
		t.Fatalf("snapshot %+v", snap)
	}
	if n := len(c.ListForwarded()); n != 0 {
		t.Fatalf("cacheOnly must not appear in ListForwarded, got %d", n)
	}
}

func TestSinkReceivesModifiedAndSkipsCacheOnly(t *testing.T) {
	scheme := runtime.NewScheme()
	nsGVR := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	authGVR := schema.GroupVersionResource{Group: "config.openshift.io", Version: "v1", Resource: "authentications"}
	listKinds := map[schema.GroupVersionResource]string{
		nsGVR:   "NamespaceList",
		authGVR: "AuthenticationList",
	}
	ns := uObj("v1", "Namespace", "", "default", "uid-ns", map[string]any{"resourceVersion": "1"})
	authn := uObj("config.openshift.io/v1", "Authentication", "", "cluster", "uid-auth", nil)
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, ns, authn)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"v1": {GroupVersion: "v1", APIResources: []metav1.APIResource{
			{Name: "namespaces", Kind: "Namespace", Verbs: []string{"list", "watch"}},
		}},
		"config.openshift.io/v1": {GroupVersion: "config.openshift.io/v1", APIResources: []metav1.APIResource{
			{Name: "authentications", Kind: "Authentication", Verbs: []string{"list", "watch"}},
		}},
	}}
	sink := &collectSink{}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	c := New([]WatchSpec{
		watch("Namespace", "v1"),
		watch("Authentication", "config.openshift.io/v1").cacheOnly(),
	})
	c.SetSink(sink)
	StartCache(ctx, c, client, mapper)
	waitSynced(t, c)

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if len(sink.types()) >= 1 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	for _, ev := range sink.ev {
		if ev.Object.GetKind() == "Authentication" {
			t.Fatal("cacheOnly Authentication must not be forwarded")
		}
		if ev.Type != EventModified {
			t.Fatalf("initial list should be MODIFIED, got %s", ev.Type)
		}
	}
	if len(sink.types()) == 0 {
		t.Fatal("expected Namespace MODIFIED from initial list")
	}
}

func TestManagedFieldsStrippedExceptPolicy(t *testing.T) {
	scheme := runtime.NewScheme()
	nsGVR := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	polGVR := schema.GroupVersionResource{Group: "policy.open-cluster-management.io", Version: "v1", Resource: "policies"}
	listKinds := map[schema.GroupVersionResource]string{
		nsGVR:  "NamespaceList",
		polGVR: "PolicyList",
	}
	mf := []any{map[string]any{"manager": "kubectl"}}
	ns := uObj("v1", "Namespace", "", "default", "uid-ns", map[string]any{"managedFields": mf})
	pol := uObj("policy.open-cluster-management.io/v1", "Policy", "ns", "p1", "uid-p", map[string]any{"managedFields": mf})
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, ns, pol)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"v1": {GroupVersion: "v1", APIResources: []metav1.APIResource{
			{Name: "namespaces", Kind: "Namespace", Verbs: []string{"list", "watch"}},
		}},
		"policy.open-cluster-management.io/v1": {GroupVersion: "policy.open-cluster-management.io/v1", APIResources: []metav1.APIResource{
			{Name: "policies", Kind: "Policy", Namespaced: true, Verbs: []string{"list", "watch"}},
		}},
	}}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	c := StartSpecs(ctx, client, mapper, []WatchSpec{
		watch("Namespace", "v1"),
		watch("Policy", "policy.open-cluster-management.io/v1"),
	})
	waitSynced(t, c)
	nss := c.ListByKind("v1", "Namespace")
	if len(nss) != 1 {
		t.Fatalf("ns %d", len(nss))
	}
	if len(managedFieldsOf(&nss[0])) != 0 {
		t.Fatalf("namespace managedFields should be stripped: %+v", nss[0].Object)
	}
	pols := c.ListByKind("policy.open-cluster-management.io/v1", "Policy")
	if len(pols) != 1 {
		t.Fatalf("policy %d", len(pols))
	}
	if len(managedFieldsOf(&pols[0])) == 0 {
		t.Fatal("Policy should keep managedFields")
	}
}

func TestSnapshotHandlerJSON(t *testing.T) {
	scheme := runtime.NewScheme()
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	listKinds := map[schema.GroupVersionResource]string{gvr: "NamespaceList"}
	ns := uObj("v1", "Namespace", "", "default", "uid-ns", nil)
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds, ns)
	mapper := mapperFor("v1", metav1.APIResource{Name: "namespaces", Kind: "Namespace", Verbs: []string{"list", "watch"}})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	c := StartSpecs(ctx, client, mapper, []WatchSpec{watch("Namespace", "v1")})
	waitSynced(t, c)

	h := NewSnapshotHandler(c, nil)
	req := httptest.NewRequest(http.MethodGet, "/debug/informer-snapshot", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatal(rec.Header().Get("Content-Type"))
	}
	if !strings.Contains(rec.Body.String(), `"kind":"Namespace"`) ||
		!strings.Contains(rec.Body.String(), `"name":"default"`) ||
		!strings.Contains(rec.Body.String(), `"synced":true`) {
		t.Fatalf("body %s", rec.Body.String())
	}
}

func names(objs []unstructured.Unstructured) []string {
	out := make([]string, 0, len(objs))
	for _, o := range objs {
		out = append(out, o.GetName())
	}
	return out
}

func TestRESTConfigDoesNotMutateBase(t *testing.T) {
	base := &rest.Config{Host: "https://example.com", QPS: 5, Burst: 10}
	got := RESTConfig(base)
	if got.QPS != InformerQPS || got.Burst != InformerBurst {
		t.Fatalf("QPS/Burst %v/%d", got.QPS, got.Burst)
	}
	if base.QPS != 5 || base.Burst != 10 {
		t.Fatal("base rest.Config must not be mutated")
	}
	if got.Host != base.Host {
		t.Fatal("host should copy")
	}
}

func TestStartCacheNil(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	StartCache(ctx, nil, nil, nil)
}

func TestStartConcurrencyLimitsLists(t *testing.T) {
	orig := startConcurrency
	startConcurrency = 2
	resetStartSem()
	t.Cleanup(func() {
		startConcurrency = orig
		resetStartSem()
	})

	scheme := runtime.NewScheme()
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}
	listKinds := map[schema.GroupVersionResource]string{gvr: "ConfigMapList"}
	client := fake.NewSimpleDynamicClientWithCustomListKinds(scheme, listKinds,
		uObj("v1", "ConfigMap", "ns", "a", "uid-a", nil),
		uObj("v1", "ConfigMap", "ns", "b", "uid-b", nil),
		uObj("v1", "ConfigMap", "ns", "c", "uid-c", nil),
		uObj("v1", "ConfigMap", "ns", "d", "uid-d", nil),
	)

	var inflight, max atomic.Int32
	block := make(chan struct{})
	client.PrependReactor("list", "configmaps", func(action ktesting.Action) (bool, runtime.Object, error) {
		n := inflight.Add(1)
		for {
			old := max.Load()
			if n <= old || max.CompareAndSwap(old, n) {
				break
			}
		}
		<-block
		inflight.Add(-1)
		return false, nil, nil
	})

	mapper := mapperFor("v1", metav1.APIResource{Name: "configmaps", Kind: "ConfigMap", Namespaced: true, Verbs: []string{"list", "watch"}})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	c := StartSpecs(ctx, client, mapper, []WatchSpec{
		watch("ConfigMap", "v1").fields("metadata.name", "a"),
		watch("ConfigMap", "v1").fields("metadata.name", "b"),
		watch("ConfigMap", "v1").fields("metadata.name", "c"),
		watch("ConfigMap", "v1").fields("metadata.name", "d"),
	})

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if max.Load() >= 2 {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	if got := max.Load(); got > 2 {
		t.Fatalf("concurrent lists %d want <= 2", got)
	}
	close(block)
	waitSynced(t, c)
}
