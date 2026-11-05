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

// ListByKind returns cached objects for apiVersion|kind (test double).
func (m MapLister) ListByKind(apiVersion, kind string) []unstructured.Unstructured {
	if m == nil {
		return nil
	}
	return m[apiVersion+"|"+kind]
}

// listKind returns unstructured objects from the informer cache for the given
// apiVersion and kind. Results are cached per-rebuild via e.listCache.
func (e *Engine) listKind(apiVersion, kind string) []map[string]any {
	if e == nil || e.Lister == nil {
		return nil
	}
	key := apiVersion + "|" + kind
	if e.listCache != nil {
		if items, ok := e.listCache[key]; ok {
			return items
		}
	}
	items := e.Lister.ListByKind(apiVersion, kind)
	out := make([]map[string]any, 0, len(items))
	for i := range items {
		out = append(out, items[i].Object)
	}
	if e.listCache != nil {
		e.listCache[key] = out
	}
	return out
}

// hubClusterName returns the hub cluster's name by finding the ManagedCluster
// with the "local-cluster=true" label. Falls back to "local-cluster".
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

// uObj builds an unstructured.Unstructured with the given metadata and extra fields (test helper).
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
