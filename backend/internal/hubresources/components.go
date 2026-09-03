// Copyright Contributors to the Open Cluster Management project

package hubresources

import (
	"context"
	"fmt"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/dynamic"
)

// Component is an MCH/MCE override component entry.
type Component struct {
	Name    string `json:"name"`
	Enabled bool   `json:"enabled"`
}

// MCHComponents returns spec.overrides.components from the first MulticlusterHub.
func MCHComponents(ctx context.Context, client dynamic.Interface) ([]Component, error) {
	if client == nil {
		return nil, fmt.Errorf("kubernetes dynamic client is required")
	}
	list, err := client.Resource(mchGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	if len(list.Items) == 0 {
		return nil, nil
	}
	return parseComponents(list.Items[0].Object)
}

// MCEComponents returns spec.overrides.components from the first MultiClusterEngine.
func MCEComponents(ctx context.Context, client dynamic.Interface) ([]Component, error) {
	if client == nil {
		return nil, fmt.Errorf("kubernetes dynamic client is required")
	}
	list, err := client.Resource(mceGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	if len(list.Items) == 0 {
		return nil, nil
	}
	return parseComponents(list.Items[0].Object)
}

func parseComponents(obj map[string]interface{}) ([]Component, error) {
	raw, found, err := unstructured.NestedSlice(obj, "spec", "overrides", "components")
	if err != nil {
		return nil, err
	}
	if !found {
		return nil, nil
	}
	out := make([]Component, 0, len(raw))
	for _, item := range raw {
		m, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		name, _ := m["name"].(string)
		enabled, _ := m["enabled"].(bool)
		out = append(out, Component{Name: name, Enabled: enabled})
	}
	return out, nil
}
