// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"context"
	"testing"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	watchpkg "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/tools/cache"
)

func TestResourceKeyCompareKey(t *testing.T) {
	k := ResourceKey{APIVersion: "v1", Kind: "Namespace", Namespace: "", Name: "default"}
	if k.CompareKey() != "v1|Namespace||default" {
		t.Fatal(k.CompareKey())
	}
}

func TestHasSyncedNilAndEmpty(t *testing.T) {
	var c *InformerCache
	if c.HasSynced() {
		t.Fatal("nil cache")
	}
	if newCache(nil).HasSynced() {
		t.Fatal("empty specs")
	}
	if c.itemCount() != 0 {
		t.Fatal("nil itemCount")
	}
}

func TestHasSyncedUnavailableAndSynced(t *testing.T) {
	c := newCache([]WatchSpec{
		watch("Namespace", "v1"),
		watch("HostedCluster", "hypershift.openshift.io/v1beta1"),
	})
	if c.HasSynced() {
		t.Fatal("nothing synced yet")
	}
	c.states[0].synced.Store(true)
	if c.HasSynced() {
		t.Fatal("second spec not ready")
	}
	c.states[1].unavailable.Store(true)
	if !c.HasSynced() {
		t.Fatal("unavailable spec should not block")
	}
}

func TestSpecStatusesAndSetError(t *testing.T) {
	c := newCache([]WatchSpec{watch("Application", "argoproj.io/v1alpha1").polled()})
	c.states[0].synced.Store(true)
	c.states[0].setError(errorsNew("boom"))
	st := c.SpecStatuses()
	if len(st) != 1 || !st[0].Synced || !st[0].Polled || st[0].Error != "boom" {
		t.Fatalf("%+v", st)
	}
	c.states[0].setError(nil)
	if c.SpecStatuses()[0].Error != "" {
		t.Fatal("error should clear")
	}
}

func TestListSnapshotDedupAndSort(t *testing.T) {
	c := newCache([]WatchSpec{
		watch("ConfigMap", "v1").fields("metadata.name", "a"),
		watch("ConfigMap", "v1").fields("metadata.name", "b"),
	})
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "configmaps"}
	inf := newTestInformer(t, uObj("v1", "ConfigMap", "ns", "a", "uid-a", nil))
	c.states[0].gvr = gvr
	c.states[0].informer = inf
	c.states[0].synced.Store(true)
	inf2 := newTestInformer(t,
		uObj("v1", "ConfigMap", "ns", "b", "uid-b", nil),
		uObj("v1", "ConfigMap", "ns", "a", "uid-a", nil), // duplicate uid across specs
	)
	c.states[1].gvr = gvr
	c.states[1].informer = inf2
	c.states[1].synced.Store(true)

	list := c.List(gvr)
	if len(list) != 2 {
		t.Fatalf("List len %d", len(list))
	}
	snap := c.Snapshot()
	if len(snap) != 2 {
		t.Fatalf("Snapshot len %d", len(snap))
	}
	if snap[0].Name != "a" || snap[1].Name != "b" {
		t.Fatalf("sort order %+v", snap)
	}
	if snap[0].UID != "uid-a" {
		t.Fatalf("uid %+v", snap[0])
	}
}

func TestListByKindFiltersSpec(t *testing.T) {
	c := newCache([]WatchSpec{
		watch("Namespace", "v1"),
		watch("Secret", "v1"),
	})
	nsInf := newTestInformer(t, uObj("v1", "Namespace", "", "default", "uid-ns", nil))
	c.states[0].informer = nsInf
	secInf := newTestInformer(t, uObj("v1", "Secret", "ns", "s", "uid-s", nil))
	c.states[1].informer = secInf

	got := c.ListByKind("v1", "Secret")
	if len(got) != 1 || got[0].GetName() != "s" {
		t.Fatalf("%+v", names(got))
	}
}

func newTestInformer(t *testing.T, objs ...*unstructured.Unstructured) cache.SharedIndexInformer {
	t.Helper()
	lw := &cache.ListWatch{
		ListFunc: func(metav1.ListOptions) (runtime.Object, error) {
			items := make([]unstructured.Unstructured, len(objs))
			for i, o := range objs {
				items[i] = *o
			}
			return &unstructured.UnstructuredList{Items: items}, nil
		},
		WatchFunc: func(metav1.ListOptions) (watchpkg.Interface, error) {
			return watchpkg.NewFake(), nil
		},
	}
	inf := cache.NewSharedIndexInformer(lw, &unstructured.Unstructured{}, time.Hour, cache.Indexers{
		cache.NamespaceIndex: cache.MetaNamespaceIndexFunc,
	})
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	go inf.Run(ctx.Done())
	if !cache.WaitForCacheSync(ctx.Done(), inf.HasSynced) {
		t.Fatal("informer sync")
	}
	for _, o := range objs {
		if err := inf.GetStore().Add(o); err != nil {
			t.Fatal(err)
		}
	}
	return inf
}

type errorsNew string

func (e errorsNew) Error() string { return string(e) }
