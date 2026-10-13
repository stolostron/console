// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"strings"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"

	"github.com/stolostron/console/backend/internal/informers"
)

func fwd(kind, apiVersion, ns, name string) informers.ForwardedObject {
	meta := map[string]any{"name": name}
	if ns != "" {
		meta["namespace"] = ns
	}
	return informers.ForwardedObject{
		GVR: schema.GroupVersionResource{Version: "v1", Resource: strings.ToLower(kind) + "s"},
		Object: unstructured.Unstructured{Object: map[string]any{
			"apiVersion": apiVersion,
			"kind":       kind,
			"metadata":   meta,
		}},
	}
}

func typesOf(evs []Event) []string {
	out := make([]string, len(evs))
	for i, e := range evs {
		out[i] = e.Type
		if e.Type == TypeModified {
			if kind, _ := e.Object["kind"].(string); kind != "" {
				out[i] = kind
			}
		}
	}
	return out
}

func TestPacketizeEmptyEmitsEOP(t *testing.T) {
	got := packetize(nil)
	if len(got) != 1 || got[0].Type != TypeEOP {
		t.Fatalf("%+v", got)
	}
}

func TestPacketizePriorityAndModified(t *testing.T) {
	objs := []informers.ForwardedObject{
		fwd("Namespace", "v1", "", "z"),
		fwd("ManagedCluster", "cluster.open-cluster-management.io/v1", "", "b"),
		fwd("ManagedCluster", "cluster.open-cluster-management.io/v1", "", "a"),
		fwd("Secret", "v1", "ns", "s"),
	}
	got := packetize(objs)
	var kinds []string
	var eop int
	for _, e := range got {
		switch e.Type {
		case TypeEOP:
			eop++
		case TypeModified:
			kinds = append(kinds, e.Object["kind"].(string))
			if e.Type != TypeModified {
				t.Fatal("resources must be MODIFIED not ADDED")
			}
		default:
			t.Fatalf("unexpected %s", e.Type)
		}
	}
	if eop != 1 {
		t.Fatalf("EOP count %d", eop)
	}
	if kinds[0] != "ManagedCluster" || kinds[1] != "ManagedCluster" || kinds[2] != "Secret" || kinds[3] != "Namespace" {
		t.Fatalf("order %v", kinds)
	}
	name0, _ := got[0].Object["metadata"].(map[string]any)["name"].(string)
	name1, _ := got[1].Object["metadata"].(map[string]any)["name"].(string)
	if name0 != "a" || name1 != "b" {
		t.Fatalf("cluster sort %s %s", name0, name1)
	}
}

func TestSnapshotEventsShape(t *testing.T) {
	h := New(nil, func() map[string]string { return map[string]string{"LOG_LEVEL": "info"} })
	got := h.snapshotEvents()
	if got[0].Type != TypeStart || got[1].Type != TypeSettings || got[len(got)-1].Type != TypeLoaded {
		t.Fatalf("%v", typesOf(got))
	}
	if got[1].Settings["LOG_LEVEL"] != "info" {
		t.Fatalf("settings %+v", got[1].Settings)
	}
	if got[2].Type != TypeEOP {
		t.Fatalf("empty snapshot should EOP before LOADED, got %v", typesOf(got))
	}
}

func TestApplyFlapOverlayNilSafe(t *testing.T) {
	var nilHub *Hub
	nilHub.applyFlapOverlay(nil)
	h := New(nil, nil)
	h.flap = nil
	h.applyFlapOverlay([]informers.ForwardedObject{fwd("Policy", "policy.open-cluster-management.io/v1", "ns", "p")})
}

func TestApplyFlapOverlaySkipsNonPolicyAndNonThrottled(t *testing.T) {
	h := New(nil, nil)
	h.flap = newFlapState(testFlapConfig())
	ns := fwd("Namespace", "v1", "", "default")
	policy := fwd("Policy", "policy.open-cluster-management.io/v1", "ns", "quiet")
	objs := []informers.ForwardedObject{ns, policy}
	h.applyFlapOverlay(objs)
	if objs[0].Object.Object["throttled"] != nil {
		t.Fatal("namespace must not be overlaid")
	}
	if objs[1].Object.Object["throttled"] != nil {
		t.Fatal("non-throttled policy must not be overlaid")
	}
}

func TestApplyFlapOverlayReplacesThrottledPolicy(t *testing.T) {
	h := New(nil, nil)
	h.flap = newFlapState(testFlapConfig())
	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(h.flap, "sticky", "default", at)
	objs := []informers.ForwardedObject{{
		Object: unstructured.Unstructured{Object: policyWithCompliant("sticky", "default", 0)},
	}}
	h.applyFlapOverlay(objs)
	if objs[0].Object.Object["throttled"] != true {
		t.Fatalf("overlay %+v", objs[0].Object.Object)
	}
}

func TestSnapshotEventsAppliesFlapOverlay(t *testing.T) {
	policyGVR := schema.GroupVersionResource{
		Group: "policy.open-cluster-management.io", Version: "v1", Resource: "policies",
	}
	policy := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "policy.open-cluster-management.io/v1",
		"kind":       "Policy",
		"metadata":   map[string]any{"name": "sticky", "namespace": "default", "uid": "uid-policy"},
		"status":     map[string]any{"compliant": "Compliant"},
	}}
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		policyGVR: "PolicyList",
	}, policy)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"policy.open-cluster-management.io/v1": {
			GroupVersion: "policy.open-cluster-management.io/v1",
			APIResources: []metav1.APIResource{
				{Name: "policies", Kind: "Policy", Namespaced: true, Verbs: []string{"list", "watch"}},
			},
		},
	}}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cache := informers.New([]informers.WatchSpec{{
		Kind: "Policy", APIVersion: "policy.open-cluster-management.io/v1", ForwardEventsToClients: true,
	}})
	informers.StartCache(ctx, cache, client, mapper)
	deadline := time.Now().Add(8 * time.Second)
	for time.Now().Before(deadline) {
		if cache.HasSynced() {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if !cache.HasSynced() {
		t.Fatal("cache sync")
	}

	h := New(cache, nil)
	h.flap = newFlapState(testFlapConfig())
	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(h.flap, "sticky", "default", at)

	got := h.snapshotEvents()
	var found bool
	for _, ev := range got {
		if ev.Type != TypeModified {
			continue
		}
		if kind, _ := ev.Object["kind"].(string); kind != "Policy" {
			continue
		}
		found = true
		if ev.Object["throttled"] != true {
			t.Fatalf("snapshot must overlay throttled policy %+v", ev.Object)
		}
	}
	if !found {
		t.Fatalf("missing Policy in snapshot %v", typesOf(got))
	}
}

func TestAuthorizedSnapshotAppliesFlapOverlay(t *testing.T) {
	policyGVR := schema.GroupVersionResource{
		Group: "policy.open-cluster-management.io", Version: "v1", Resource: "policies",
	}
	policy := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "policy.open-cluster-management.io/v1",
		"kind":       "Policy",
		"metadata":   map[string]any{"name": "sticky", "namespace": "default", "uid": "uid-policy"},
		"status":     map[string]any{"compliant": "Compliant"},
	}}
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		policyGVR: "PolicyList",
	}, policy)
	mapper := staticMapper{lists: map[string]*metav1.APIResourceList{
		"policy.open-cluster-management.io/v1": {
			GroupVersion: "policy.open-cluster-management.io/v1",
			APIResources: []metav1.APIResource{
				{Name: "policies", Kind: "Policy", Namespaced: true, Verbs: []string{"list", "watch"}},
			},
		},
	}}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cache := informers.New([]informers.WatchSpec{{
		Kind: "Policy", APIVersion: "policy.open-cluster-management.io/v1", ForwardEventsToClients: true,
	}})
	informers.StartCache(ctx, cache, client, mapper)
	deadline := time.Now().Add(8 * time.Second)
	for time.Now().Before(deadline) {
		if cache.HasSynced() {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if !cache.HasSynced() {
		t.Fatal("cache sync")
	}

	hub := New(cache, nil)
	hub.flap = newFlapState(testFlapConfig())
	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(hub.flap, "sticky", "default", at)
	handler := NewHandler(hub, StaticAuth{OK: true}, AllowAllAccess{})

	got := handler.authorizedSnapshot(context.Background(), "tok")
	var found bool
	for _, ev := range got {
		if ev.Type != TypeModified {
			continue
		}
		if kind, _ := ev.Object["kind"].(string); kind != "Policy" {
			continue
		}
		found = true
		if ev.Object["throttled"] != true {
			t.Fatalf("authorized snapshot must overlay throttled policy %+v", ev.Object)
		}
	}
	if !found {
		t.Fatalf("missing Policy in authorized snapshot %v", typesOf(got))
	}
}

type kindAccess struct {
	allow string
}

func (k kindAccess) Allow(_ context.Context, _ string, ev Event) (bool, error) {
	if ev.Type != TypeModified {
		return true, nil
	}
	kind, _ := ev.Object["kind"].(string)
	return kind == k.allow, nil
}

func (kindAccess) Prefetch(context.Context, string, []Event) {}

func TestAuthorizeRefsCopiesOnlyAllowed(t *testing.T) {
	allowedObj := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "v1", "kind": "ConfigMap",
		"metadata": map[string]any{"name": "ok", "namespace": "ns"},
		"data":     map[string]any{"k": "v"},
	}}
	deniedObj := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "v1", "kind": "Secret",
		"metadata": map[string]any{"name": "no", "namespace": "ns"},
	}}
	refs := []informers.ForwardedRef{
		{GVR: schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}, APIVersion: "v1", Kind: "ConfigMap", Name: "ok", Namespace: "ns", Object: allowedObj},
		{GVR: schema.GroupVersionResource{Version: "v1", Resource: "secrets"}, APIVersion: "v1", Kind: "Secret", Name: "no", Namespace: "ns", Object: deniedObj},
	}

	var copies int
	prev := copyRef
	copyRef = func(ref informers.ForwardedRef) informers.ForwardedObject {
		copies++
		return ref.Copy()
	}
	t.Cleanup(func() { copyRef = prev })

	got := authorizeRefs(context.Background(), "tok", kindAccess{allow: "ConfigMap"}, refs)
	if copies != 1 {
		t.Fatalf("copies %d want 1", copies)
	}
	if len(got) != 1 || got[0].Object.GetName() != "ok" {
		t.Fatalf("%+v", got)
	}
	allowedObj.Object["data"] = map[string]any{"k": "mutated"}
	data, _ := got[0].Object.Object["data"].(map[string]any)
	if data["k"] != "v" {
		t.Fatalf("allowed object was not deep-copied: %+v", data)
	}
}

func TestAuthorizeRefsSkipsSSARError(t *testing.T) {
	refs := []informers.ForwardedRef{{
		GVR:        schema.GroupVersionResource{Version: "v1", Resource: "secrets"},
		APIVersion: "v1", Kind: "Secret", Name: "s", Namespace: "ns",
		Object: &unstructured.Unstructured{Object: map[string]any{"kind": "Secret"}},
	}}
	got := authorizeRefs(context.Background(), "tok", errAccess{}, refs)
	if len(got) != 0 {
		t.Fatalf("ssar error must skip copy, got %+v", got)
	}
}
