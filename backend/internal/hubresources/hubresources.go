// Copyright Contributors to the Open Cluster Management project

package hubresources

import (
	"context"
	"fmt"
	"sync"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

var (
	mceGVR = schema.GroupVersionResource{
		Group:    "multicluster.openshift.io",
		Version:  "v1",
		Resource: "multiclusterengines",
	}
	mchGVR = schema.GroupVersionResource{
		Group:    "operator.open-cluster-management.io",
		Version:  "v1",
		Resource: "multiclusterhubs",
	}
)

const fineGrainedRBACComponent = "fine-grained-rbac"

// MCETargetNamespace returns spec.targetNamespace from the first MultiClusterEngine.
func MCETargetNamespace(ctx context.Context, client dynamic.Interface) (string, error) {
	if client == nil {
		return "", fmt.Errorf("kubernetes dynamic client is required")
	}
	list, err := client.Resource(mceGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		return "", err
	}
	if len(list.Items) == 0 {
		return "", nil
	}
	ns, found, err := unstructured.NestedString(list.Items[0].Object, "spec", "targetNamespace")
	if err != nil {
		return "", err
	}
	if !found {
		return "", nil
	}
	return ns, nil
}

// MCHFineGrainedRBAC reports whether the first MulticlusterHub enables fine-grained-rbac.
func MCHFineGrainedRBAC(ctx context.Context, client dynamic.Interface) (bool, error) {
	if client == nil {
		return false, fmt.Errorf("kubernetes dynamic client is required")
	}
	list, err := client.Resource(mchGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		return false, err
	}
	if len(list.Items) == 0 {
		return false, nil
	}
	components, found, err := unstructured.NestedSlice(list.Items[0].Object, "spec", "overrides", "components")
	if err != nil {
		return false, err
	}
	if !found {
		return false, nil
	}
	for _, raw := range components {
		component, ok := raw.(map[string]interface{})
		if !ok {
			continue
		}
		name, _ := component["name"].(string)
		if name != fineGrainedRBACComponent {
			continue
		}
		enabled, _ := component["enabled"].(bool)
		return enabled, nil
	}
	return false, nil
}

// MCHNamespace returns metadata.namespace of the first MulticlusterHub.
func MCHNamespace(ctx context.Context, client dynamic.Interface) (string, error) {
	if client == nil {
		return "", fmt.Errorf("kubernetes dynamic client is required")
	}
	list, err := client.Resource(mchGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		return "", err
	}
	if len(list.Items) == 0 {
		return "", nil
	}
	return list.Items[0].GetNamespace(), nil
}

// CachedMCHNamespace lists MulticlusterHub until a non-empty namespace is found,
// then reuses it. Errors and empty lists are not stored, so a later call can retry.
// The list runs without the cache lock held.
func CachedMCHNamespace(client dynamic.Interface) func(context.Context) string {
	var mu sync.Mutex
	var cached string
	return func(ctx context.Context) string {
		mu.Lock()
		ns := cached
		mu.Unlock()
		if ns != "" {
			return ns
		}
		found, err := MCHNamespace(ctx, client)
		if err != nil || found == "" {
			return ""
		}
		mu.Lock()
		if cached == "" {
			cached = found
		}
		ns = cached
		mu.Unlock()
		return ns
	}
}
