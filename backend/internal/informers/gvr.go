// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// ResourceMapper resolves apiVersion+kind to a GVR (typically discovery).
type ResourceMapper interface {
	ServerResourcesForGroupVersion(groupVersion string) (*metav1.APIResourceList, error)
}

// CacheInvalidator is optionally implemented by a ResourceMapper whose
// results are cached (e.g. k8s.io/client-go/discovery/cached/memory).
// Calling Invalidate forces the next lookup to fetch fresh data from the API server.
type CacheInvalidator interface {
	Invalidate()
}

// discoveryRefresh coalesces cached-discovery invalidation across the spec
// goroutines. Invalidate drops the whole cached discovery document, so the
// first spec to force a refetch repopulates it for every other spec; without
// the throttle a hub that is legitimately missing CRDs (AnsibleJob with no AAP
// installed, ACM-only kinds on MCE) would refetch discovery once per missing
// spec on every retry round.
type discoveryRefresh struct {
	mu   sync.Mutex
	last time.Time
}

// request invalidates mapper's cached discovery and reports whether it did.
// It returns false when mapper does not cache, or when another spec already
// forced a refetch within discoveryRefreshInterval — the caller should then
// keep the failure it already has and wait for its next retry.
func (r *discoveryRefresh) request(mapper ResourceMapper) bool {
	inv, ok := mapper.(CacheInvalidator)
	if !ok {
		return false
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	if !r.last.IsZero() && time.Since(r.last) < discoveryRefreshInterval {
		return false
	}
	r.last = time.Now()
	inv.Invalidate()
	return true
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

// isUnavailable reports discovery/API errors that mean the CRD or resource is
// missing or forbidden, so the informer should keep retrying without treating
// the failure as a permanent config bug.
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
