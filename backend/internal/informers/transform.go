// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/cache"
)

func asUnstructured(obj any) (*unstructured.Unstructured, bool) {
	switch t := obj.(type) {
	case *unstructured.Unstructured:
		return t, true
	case unstructured.Unstructured:
		return &t, true
	case cache.DeletedFinalStateUnknown:
		return asUnstructured(t.Obj)
	default:
		u, err := runtime.DefaultUnstructuredConverter.ToUnstructured(obj)
		if err != nil {
			return nil, false
		}
		return &unstructured.Unstructured{Object: u}, true
	}
}

func transformFor(spec WatchSpec) cache.TransformFunc {
	return func(obj any) (any, error) {
		u, ok := asUnstructured(obj)
		if !ok {
			return obj, nil
		}
		out := u.DeepCopy()
		out.SetAPIVersion(spec.APIVersion)
		out.SetKind(spec.Kind)
		if spec.Kind != "Policy" {
			unstructured.RemoveNestedField(out.Object, "metadata", "managedFields")
			out.SetManagedFields(nil)
		}
		return out, nil
	}
}

func managedFieldsOf(u *unstructured.Unstructured) []any {
	mf, found, _ := unstructured.NestedSlice(u.Object, "metadata", "managedFields")
	if !found {
		return nil
	}
	return mf
}
