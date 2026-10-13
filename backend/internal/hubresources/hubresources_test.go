// Copyright Contributors to the Open Cluster Management project

package hubresources_test

import (
	"context"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"

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
