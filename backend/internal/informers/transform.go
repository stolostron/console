// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/tools/cache"
)

// asUnstructured coerces informer store objects (including DeletedFinalStateUnknown)
// into *unstructured.Unstructured for event handling and listing.
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

// transformFor stamps apiVersion/kind from the WatchSpec and drops managedFields
// for every kind except Policy (Policy flap detection needs them), then strips
// unused fields for a few high-volume kinds.
//
// The function mutates obj in place and returns it. It must stay idempotent:
// applying the transform twice must not change the object again.
//
// Fields that later code still reads must be kept:
//   - ApplicationSet: spec.generators; template pull-model annotation
//     apps.open-cluster-management.io/ocm-managed-cluster; and
//     spec.template.spec.source / sources (placementFromAppSet, isArgoPullModel,
//     getApplicationSources). Detail/edit paths fetch the live resource.
//   - Argo Application (argoproj.io/v1alpha1 only): spec (including destination
//     and syncPolicy); status.health, status.sync, status.resources, and
//     status.reconciledAt. status.operationState and status.history are dropped.
//   - ManagedCluster / ManagedClusterInfo / ManagedClusterAddOn (forwarded to
//     GET /events clients): clusterClaims, distributionInfo, consoleURL,
//     ManagedClusterInfo status.version, node capacity and condition
//     type/status, addon condition type/status/message, addOnMeta, and
//     addOnConfiguration. Condition lastTransitionTime values are removed.
func transformFor(spec WatchSpec) cache.TransformFunc {
	return func(obj any) (any, error) {
		u, ok := asUnstructured(obj)
		if !ok {
			return obj, nil
		}
		u.SetAPIVersion(spec.APIVersion)
		u.SetKind(spec.Kind)
		if spec.Kind != "Policy" {
			unstructured.RemoveNestedField(u.Object, "metadata", "managedFields")
			u.SetManagedFields(nil)
		}
		switch spec.Kind {
		case "ManagedClusterAddOn":
			stripAddonFields(u)
		case "ManagedCluster":
			stripManagedClusterFields(u)
		case "ManagedClusterInfo":
			stripManagedClusterInfoFields(u)
		case "ApplicationSet":
			stripApplicationSetFields(u)
		case "Application":
			if spec.APIVersion == "argoproj.io/v1alpha1" {
				stripArgoApplicationFields(u)
			}
		}
		return u, nil
	}
}

func stripAddonFields(u *unstructured.Unstructured) {
	unstructured.RemoveNestedField(u.Object, "status", "registrations")
	unstructured.RemoveNestedField(u.Object, "status", "supportedConfigs")
	unstructured.RemoveNestedField(u.Object, "status", "configReferences")
	unstructured.RemoveNestedField(u.Object, "status", "healthCheck")
	unstructured.RemoveNestedField(u.Object, "status", "namespace")
	stripConditionTimestamps(u.Object, "status", "conditions")
}

func stripManagedClusterFields(u *unstructured.Unstructured) {
	unstructured.RemoveNestedField(u.Object, "spec", "managedClusterClientConfigs")
	unstructured.RemoveNestedField(u.Object, "spec", "leaseDurationSeconds")
	unstructured.RemoveNestedField(u.Object, "spec", "taints")
	unstructured.RemoveNestedField(u.Object, "status", "allocatable")
	unstructured.RemoveNestedField(u.Object, "status", "capacity")
	unstructured.RemoveNestedField(u.Object, "status", "version")
	stripConditionTimestamps(u.Object, "status", "conditions")
}

func stripManagedClusterInfoFields(u *unstructured.Unstructured) {
	unstructured.RemoveNestedField(u.Object, "spec", "loggingCA")
	unstructured.RemoveNestedField(u.Object, "status", "loggingEndpoint")
	unstructured.RemoveNestedField(u.Object, "status", "loggingPort")
	unstructured.RemoveNestedField(u.Object, "status", "kubeVendor")
	unstructured.RemoveNestedField(u.Object, "status", "cloudVendor")
	unstructured.RemoveNestedField(u.Object, "status", "clusterID")
	stripConditionTimestamps(u.Object, "status", "conditions")

	raw, found, _ := unstructured.NestedFieldNoCopy(u.Object, "status", "nodeList")
	if found {
		if nodes, ok := raw.([]any); ok {
			for _, n := range nodes {
				node, ok := n.(map[string]any)
				if !ok {
					continue
				}
				stripConditionTimestamps(node, "conditions")
			}
		}
	}
}

func stripConditionTimestamps(obj map[string]any, path ...string) {
	raw, found, _ := unstructured.NestedFieldNoCopy(obj, path...)
	if !found {
		return
	}
	conditions, ok := raw.([]any)
	if !ok {
		return
	}
	for _, c := range conditions {
		m, ok := c.(map[string]any)
		if !ok {
			continue
		}
		delete(m, "lastTransitionTime")
	}
}

func stripApplicationSetFields(u *unstructured.Unstructured) {
	unstructured.RemoveNestedField(u.Object, "status", "conditions")
	unstructured.RemoveNestedField(u.Object, "status", "health")
	unstructured.RemoveNestedField(u.Object, "spec", "template", "metadata", "name")
	unstructured.RemoveNestedField(u.Object, "spec", "template", "metadata", "labels")
	raw, _, _ := unstructured.NestedFieldNoCopy(u.Object, "spec", "template", "spec")
	if spec, ok := raw.(map[string]any); ok {
		for field := range spec {
			if field != "source" && field != "sources" {
				delete(spec, field)
			}
		}
	}
}

func stripArgoApplicationFields(u *unstructured.Unstructured) {
	unstructured.RemoveNestedField(u.Object, "status", "operationState")
	unstructured.RemoveNestedField(u.Object, "status", "history")
}

// managedFieldsOf reads metadata.managedFields without requiring typed conversion.
func managedFieldsOf(u *unstructured.Unstructured) []any {
	mf, found, _ := unstructured.NestedSlice(u.Object, "metadata", "managedFields")
	if !found {
		return nil
	}
	return mf
}
