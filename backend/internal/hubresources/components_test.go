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

func TestMCHComponents_NilClient(t *testing.T) {
	_, err := hubresources.MCHComponents(context.Background(), nil)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestMCEComponents_NilClient(t *testing.T) {
	_, err := hubresources.MCEComponents(context.Background(), nil)
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestMCHComponents_EmptyList(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs"}: "MultiClusterHubList",
	})
	components, err := hubresources.MCHComponents(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if components != nil {
		t.Fatalf("expected nil, got %#v", components)
	}
}

func TestMCEComponents_EmptyList(t *testing.T) {
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "multicluster.openshift.io", Version: "v1", Resource: "multiclusterengines"}: "MultiClusterEngineList",
	})
	components, err := hubresources.MCEComponents(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if components != nil {
		t.Fatalf("expected nil, got %#v", components)
	}
}

func TestParseComponents(t *testing.T) {
	got, err := hubresources.ParseComponents(map[string]interface{}{})
	if err != nil || got != nil {
		t.Fatalf("empty obj: %#v %v", got, err)
	}

	got, err = hubresources.ParseComponents(map[string]interface{}{
		"spec": map[string]interface{}{
			"overrides": map[string]interface{}{
				"components": []interface{}{
					"skip-me",
					map[string]interface{}{"name": "search", "enabled": true},
					map[string]interface{}{"name": "console", "enabled": false},
				},
			},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || got[0].Name != "search" || !got[0].Enabled || got[1].Name != "console" || got[1].Enabled {
		t.Fatalf("got %#v", got)
	}
}
