// Copyright Contributors to the Open Cluster Management project

package clusterinfo

import (
	"context"
	"errors"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	k8stesting "k8s.io/client-go/testing"
)

func TestIsGlobalHubCachedDoesNotCacheErrors(t *testing.T) {
	fail := true
	var gets int
	client := dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		crdGVR: "CustomResourceDefinitionList",
	})
	client.PrependReactor("get", "customresourcedefinitions", func(k8stesting.Action) (bool, runtime.Object, error) {
		gets++
		if fail {
			fail = false
			return true, nil, errors.New("temporary")
		}
		obj := &unstructured.Unstructured{}
		obj.SetGroupVersionKind(schema.GroupVersionKind{
			Group: "apiextensions.k8s.io", Version: "v1", Kind: "CustomResourceDefinition",
		})
		obj.SetName("multiclusterglobalhubs.operator.open-cluster-management.io")
		return true, obj, nil
	})
	h := New(Options{Dynamic: client})
	ctx := context.Background()
	ok, cacheable := h.isGlobalHubCached(ctx)
	if ok || cacheable {
		t.Fatalf("error path ok=%v cacheable=%v", ok, cacheable)
	}
	ok, cacheable = h.isGlobalHubCached(ctx)
	if !ok || !cacheable {
		t.Fatalf("retry ok=%v cacheable=%v", ok, cacheable)
	}
	ok, cacheable = h.isGlobalHubCached(ctx)
	if !ok || !cacheable {
		t.Fatalf("reuse ok=%v cacheable=%v", ok, cacheable)
	}
	if gets != 2 {
		t.Fatalf("gets %d", gets)
	}
}
