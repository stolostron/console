// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// Lister is InformerCache.ListByKind (or a test fake).
type Lister interface {
	ListByKind(apiVersion, kind string) []unstructured.Unstructured
}

// MapLister is a test double for Lister.
type MapLister map[string][]unstructured.Unstructured

func (m MapLister) ListByKind(apiVersion, kind string) []unstructured.Unstructured {
	if m == nil {
		return nil
	}
	return m[apiVersion+"|"+kind]
}

func (e *Engine) listKind(apiVersion, kind string) []map[string]any {
	if e == nil || e.Lister == nil {
		return nil
	}
	items := e.Lister.ListByKind(apiVersion, kind)
	out := make([]map[string]any, 0, len(items))
	for i := range items {
		out = append(out, items[i].DeepCopy().Object)
	}
	return out
}

func (e *Engine) hubClusterName() string {
	for _, obj := range e.listKind("cluster.open-cluster-management.io/v1", "ManagedCluster") {
		labels := metaLabels(obj)
		if strVal(labels["local-cluster"]) == "true" {
			if name := metaName(obj); name != "" {
				return name
			}
		}
	}
	return "local-cluster"
}

func uObj(apiVersion, kind, name, namespace string, extra map[string]any) unstructured.Unstructured {
	obj := map[string]any{
		"apiVersion": apiVersion,
		"kind":       kind,
		"metadata": map[string]any{
			"name":      name,
			"namespace": namespace,
		},
	}
	for k, v := range extra {
		obj[k] = v
	}
	return unstructured.Unstructured{Object: obj}
}
