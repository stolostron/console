// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/tools/cache"
)

func TestAsUnstructuredVariants(t *testing.T) {
	ptr := uObj("v1", "Pod", "ns", "p", "uid-1", nil)
	if got, ok := asUnstructured(ptr); !ok || got.GetName() != "p" {
		t.Fatalf("ptr %+v", got)
	}
	val := *ptr
	if got, ok := asUnstructured(val); !ok || got.GetName() != "p" {
		t.Fatalf("val %+v", got)
	}
	tomb := cache.DeletedFinalStateUnknown{Obj: ptr}
	if got, ok := asUnstructured(tomb); !ok || got.GetName() != "p" {
		t.Fatalf("tombstone %+v", got)
	}
	if _, ok := asUnstructured(struct{}{}); ok {
		t.Fatal("expected false for unknown type")
	}
}

func TestTransformForSetsKindAndStripsManagedFields(t *testing.T) {
	mf := []any{map[string]any{"manager": "kubectl"}}
	in := uObj("v1", "Namespace", "", "default", "uid", map[string]any{"managedFields": mf})
	spec := watch("Namespace", "v1")
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)
	if u.GetKind() != "Namespace" || u.GetAPIVersion() != "v1" {
		t.Fatalf("metadata %+v", u.Object)
	}
	if len(managedFieldsOf(u)) != 0 {
		t.Fatal("managedFields should be stripped")
	}
}

func TestTransformForKeepsPolicyManagedFields(t *testing.T) {
	mf := []any{map[string]any{"manager": "kubectl"}}
	in := uObj("policy.open-cluster-management.io/v1", "Policy", "ns", "p", "uid", map[string]any{"managedFields": mf})
	spec := watch("Policy", "policy.open-cluster-management.io/v1")
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)
	if len(managedFieldsOf(u)) == 0 {
		t.Fatal("Policy should keep managedFields")
	}
}

func TestTransformForPassthroughNonUnstructured(t *testing.T) {
	raw := "not-a-resource"
	out, err := transformFor(watch("Pod", "v1"))(raw)
	if err != nil || out != raw {
		t.Fatalf("got %v err %v", out, err)
	}
}
