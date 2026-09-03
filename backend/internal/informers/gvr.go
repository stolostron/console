// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"errors"
	"fmt"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// ResourceMapper resolves apiVersion+kind to a GVR (typically discovery).
type ResourceMapper interface {
	ServerResourcesForGroupVersion(groupVersion string) (*metav1.APIResourceList, error)
}

var errKindNotFound = errors.New("kind not found for apiVersion")

// ResolveGVR maps apiVersion and kind using server discovery (not naive pluralize).
func ResolveGVR(mapper ResourceMapper, apiVersion, kind string) (schema.GroupVersionResource, error) {
	list, err := mapper.ServerResourcesForGroupVersion(apiVersion)
	if err != nil {
		return schema.GroupVersionResource{}, err
	}
	gv, err := schema.ParseGroupVersion(apiVersion)
	if err != nil {
		return schema.GroupVersionResource{}, err
	}
	for _, r := range list.APIResources {
		if r.Kind == kind && !strings.Contains(r.Name, "/") {
			return gv.WithResource(r.Name), nil
		}
	}
	return schema.GroupVersionResource{}, fmt.Errorf("%w: %s %s", errKindNotFound, apiVersion, kind)
}

func isUnavailable(err error) bool {
	if err == nil {
		return false
	}
	if apierrors.IsNotFound(err) || apierrors.IsForbidden(err) || errors.Is(err, errKindNotFound) {
		return true
	}
	// Cached discovery returns a plain "not found" for missing API groups (not apierrors.StatusError).
	return strings.Contains(strings.ToLower(err.Error()), "not found")
}
