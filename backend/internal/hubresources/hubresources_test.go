// Copyright Contributors to the Open Cluster Management project

package hubresources_test

import (
	"context"
	"errors"
	"fmt"
	"testing"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"
	ktesting "k8s.io/client-go/testing"

	"github.com/stolostron/console/backend/internal/hubresources"
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

func mchObject(fineGrainedEnabled bool) *unstructured.Unstructured {
	obj := &unstructured.Unstructured{}
	obj.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "operator.open-cluster-management.io",
		Version: "v1",
		Kind:    "MultiClusterHub",
	})
	obj.SetName("hub")
	components := []interface{}{
		map[string]interface{}{
			"name":    "fine-grained-rbac",
			"enabled": fineGrainedEnabled,
		},
	}
	if err := unstructured.SetNestedSlice(obj.Object, components, "spec", "overrides", "components"); err != nil {
		panic(err)
	}
	return obj
}

func TestMCETargetNamespace(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	}, mceObject("custom-mce"))
	ns, err := hubresources.MCETargetNamespace(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if ns != "custom-mce" {
		t.Fatalf("namespace %q", ns)
	}
}

func TestMCETargetNamespace_EmptyList(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	})
	ns, err := hubresources.MCETargetNamespace(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if ns != "" {
		t.Fatalf("namespace %q", ns)
	}
}

func TestMCHFineGrainedRBAC_Enabled(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs"}: "MultiClusterHubList",
	}, mchObject(true))
	ok, err := hubresources.MCHFineGrainedRBAC(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if !ok {
		t.Fatal("expected enabled")
	}
}

var mchGVR = schema.GroupVersionResource{
	Group:    "operator.open-cluster-management.io",
	Version:  "v1",
	Resource: "multiclusterhubs",
}

func mchListKinds() map[schema.GroupVersionResource]string {
	return map[schema.GroupVersionResource]string{
		mchGVR: "MultiClusterHubList",
	}
}

func TestMCHPresent(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds(), mchObject(false))
	ok, err := hubresources.MCHPresent(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if !ok {
		t.Fatal("expected MultiClusterHub present")
	}
}

func TestMCHPresent_EmptyList(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds())
	ok, err := hubresources.MCHPresent(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("expected MultiClusterHub absent")
	}
}

func TestMCHPresent_NilClient(t *testing.T) {
	ok, err := hubresources.MCHPresent(context.Background(), nil)
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("expected MultiClusterHub absent")
	}
}

func TestMCHPresent_MissingCRD(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds())
	client.PrependReactor("list", "multiclusterhubs", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, apierrors.NewNotFound(schema.GroupResource{
			Group: "operator.open-cluster-management.io", Resource: "multiclusterhubs",
		}, "")
	})
	ok, err := hubresources.MCHPresent(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("expected MultiClusterHub absent for missing CRD")
	}
}

func TestMCHPresent_NoMatchError(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds())
	client.PrependReactor("list", "multiclusterhubs", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, &meta.NoResourceMatchError{
			PartialResource: schema.GroupVersionResource{
				Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs",
			},
		}
	})
	ok, err := hubresources.MCHPresent(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("expected MultiClusterHub absent for no-match error")
	}
}

func TestMCHPresent_ListError(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds())
	client.PrependReactor("list", "multiclusterhubs", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, fmt.Errorf("multiclusterhubs.operator.open-cluster-management.io is forbidden")
	})
	ok, err := hubresources.MCHPresent(context.Background(), client)
	if err == nil {
		t.Fatal("expected list error")
	}
	if ok {
		t.Fatal("expected MultiClusterHub not confirmed present on list error")
	}
}

func TestMCHFineGrainedRBAC_Disabled(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs"}: "MultiClusterHubList",
	}, mchObject(false))
	ok, err := hubresources.MCHFineGrainedRBAC(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("expected disabled")
	}
}

func namedMCH(namespace string) *unstructured.Unstructured {
	obj := mchObject(false)
	obj.SetNamespace(namespace)
	return obj
}

func TestCachedMCHNamespaceReusesSuccess(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds(), namedMCH("open-cluster-management"))
	var lists int
	client.PrependReactor("list", "multiclusterhubs", func(ktesting.Action) (bool, runtime.Object, error) {
		lists++
		return false, nil, nil
	})
	lookup := hubresources.CachedMCHNamespace(client)
	ctx := context.Background()
	if got := lookup(ctx); got != "open-cluster-management" {
		t.Fatalf("namespace %q", got)
	}
	if got := lookup(ctx); got != "open-cluster-management" {
		t.Fatalf("reuse %q", got)
	}
	if lists != 1 {
		t.Fatalf("lists %d", lists)
	}
}

func TestCachedMCHNamespaceDoesNotCacheFailure(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds(), namedMCH("open-cluster-management"))
	fail := true
	var lists int
	client.PrependReactor("list", "multiclusterhubs", func(ktesting.Action) (bool, runtime.Object, error) {
		lists++
		if fail {
			fail = false
			return true, nil, errors.New("temporary")
		}
		return false, nil, nil
	})
	lookup := hubresources.CachedMCHNamespace(client)
	ctx := context.Background()
	if got := lookup(ctx); got != "" {
		t.Fatalf("error cached as %q", got)
	}
	if got := lookup(ctx); got != "open-cluster-management" {
		t.Fatalf("retry %q", got)
	}
	if got := lookup(ctx); got != "open-cluster-management" {
		t.Fatalf("reuse %q", got)
	}
	if lists != 2 {
		t.Fatalf("lists %d", lists)
	}

	empty := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), mchListKinds())
	lists = 0
	empty.PrependReactor("list", "multiclusterhubs", func(ktesting.Action) (bool, runtime.Object, error) {
		lists++
		return false, nil, nil
	})
	lookup = hubresources.CachedMCHNamespace(empty)
	if got := lookup(ctx); got != "" {
		t.Fatalf("empty cached as %q", got)
	}
	obj := namedMCH("hub-ns")
	if _, err := empty.Resource(mchGVR).Namespace("hub-ns").Create(ctx, obj, metav1.CreateOptions{}); err != nil {
		t.Fatal(err)
	}
	if got := lookup(ctx); got != "hub-ns" {
		t.Fatalf("after create %q", got)
	}
	if lists != 2 {
		t.Fatalf("empty lists %d", lists)
	}
}
