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

func componentObject(kind, name string, enabled bool) *unstructured.Unstructured {
	obj := &unstructured.Unstructured{}
	obj.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "operator.open-cluster-management.io",
		Version: "v1",
		Kind:    kind,
	})
	obj.SetName("instance")
	components := []interface{}{
		map[string]interface{}{"name": name, "enabled": enabled},
	}
	if err := unstructured.SetNestedSlice(obj.Object, components, "spec", "overrides", "components"); err != nil {
		panic(err)
	}
	return obj
}

func TestMCHComponents(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs"}: "MultiClusterHubList",
	}, componentObject("MultiClusterHub", "search", true))
	components, err := hubresources.MCHComponents(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if len(components) != 1 || components[0].Name != "search" || !components[0].Enabled {
		t.Fatalf("components %#v", components)
	}
}

func TestMCEComponents(t *testing.T) {
	obj := componentObject("MultiClusterEngine", "hypershift", true)
	obj.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "multicluster.openshift.io",
		Version: "v1",
		Kind:    "MultiClusterEngine",
	})
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	}, obj)
	components, err := hubresources.MCEComponents(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if len(components) != 1 || components[0].Name != "hypershift" || !components[0].Enabled {
		t.Fatalf("components %#v", components)
	}
}
