// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"sort"
	"sync"
	"sync/atomic"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/tools/cache"
)

// ResourceKey is the normalized cache identity for snapshot compare.
type ResourceKey struct {
	APIVersion string `json:"apiVersion"`
	Kind       string `json:"kind"`
	Namespace  string `json:"namespace,omitempty"`
	Name       string `json:"name"`
	UID        string `json:"uid,omitempty"`
}

// CompareKey is a stable sort/dedup identity without UID (apiVersion|kind|ns|name).
func (k ResourceKey) CompareKey() string {
	return k.APIVersion + "|" + k.Kind + "|" + k.Namespace + "|" + k.Name
}

// specRuntime holds the live SharedIndexInformer and sync state for one WatchSpec.
type specRuntime struct {
	spec        WatchSpec
	gvr         schema.GroupVersionResource
	informer    cache.SharedIndexInformer
	synced      atomic.Bool
	unavailable atomic.Bool
	lastError   atomic.Value // string
}

// InformerCache holds one SharedIndexInformer per WatchSpec.
type InformerCache struct {
	mu     sync.RWMutex
	states []*specRuntime
	sink   ResourceSink
}

// SetSink registers the SSE hub (or test collector). Call before StartCache.
func (c *InformerCache) SetSink(s ResourceSink) {
	if c == nil {
		return
	}
	c.mu.Lock()
	c.sink = s
	c.mu.Unlock()
}

// newCache allocates an InformerCache with one specRuntime per WatchSpec (not started).
func newCache(specs []WatchSpec) *InformerCache {
	c := &InformerCache{states: make([]*specRuntime, 0, len(specs))}
	for _, spec := range specs {
		st := &specRuntime{spec: spec}
		st.lastError.Store("")
		c.states = append(c.states, st)
	}
	return c
}

func (s *specRuntime) setError(err error) {
	if err == nil {
		s.lastError.Store("")
		return
	}
	s.lastError.Store(err.Error())
}

// HasSynced is true when every spec is either synced or unavailable (404/403 / missing CRD).
func (c *InformerCache) HasSynced() bool {
	if c == nil {
		return false
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	if len(c.states) == 0 {
		return false
	}
	for _, s := range c.states {
		if s.unavailable.Load() {
			continue
		}
		if !s.synced.Load() {
			return false
		}
	}
	return true
}

// objectDedupKey prefers UID so the same object from overlapping specs is listed once;
// namespace/name is the fallback when UID is empty.
func objectDedupKey(u *unstructured.Unstructured) string {
	key := string(u.GetUID())
	if key == "" {
		return u.GetNamespace() + "/" + u.GetName()
	}
	return key
}

// listMatching returns DeepCopy objects from specs that match, deduped by UID/name.
// Caller must hold c.mu (at least RLock).
func (c *InformerCache) listMatching(match func(*specRuntime) bool) []unstructured.Unstructured {
	var out []unstructured.Unstructured
	seen := map[string]struct{}{}
	for _, s := range c.states {
		if s.informer == nil || !match(s) {
			continue
		}
		for _, obj := range s.informer.GetStore().List() {
			u, ok := asUnstructured(obj)
			if !ok {
				continue
			}
			key := objectDedupKey(u)
			if _, dup := seen[key]; dup {
				continue
			}
			seen[key] = struct{}{}
			out = append(out, *u.DeepCopy())
		}
	}
	return out
}

// List returns objects for a GVR across all matching specs (union).
func (c *InformerCache) List(gvr schema.GroupVersionResource) []unstructured.Unstructured {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.listMatching(func(s *specRuntime) bool { return s.gvr == gvr })
}

// ListByKind returns cached objects for apiVersion+kind across matching specs.
func (c *InformerCache) ListByKind(apiVersion, kind string) []unstructured.Unstructured {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.listMatching(func(s *specRuntime) bool {
		return s.spec.APIVersion == apiVersion && s.spec.Kind == kind
	})
}

// ForwardedObject is a cache entry that GET /events should include in snapshots.
type ForwardedObject struct {
	GVR    schema.GroupVersionResource
	Object unstructured.Unstructured
}

// ForwardedRef is a store pointer plus identity for RBAC before DeepCopyJSON.
type ForwardedRef struct {
	GVR        schema.GroupVersionResource
	APIVersion string
	Kind       string
	Name       string
	Namespace  string
	Object     *unstructured.Unstructured
}

// Copy deep-copies the store object for SSE encoding.
func (r ForwardedRef) Copy() ForwardedObject {
	obj := unstructured.Unstructured{}
	if r.Object != nil && r.Object.Object != nil {
		obj.Object = runtime.DeepCopyJSON(r.Object.Object)
	}
	obj.SetAPIVersion(r.APIVersion)
	obj.SetKind(r.Kind)
	return ForwardedObject{GVR: r.GVR, Object: obj}
}

// ListForwardedRefs lists forwarded objects without DeepCopyJSON.
func (c *InformerCache) ListForwardedRefs() []ForwardedRef {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	var out []ForwardedRef
	seen := map[string]struct{}{}
	for _, s := range c.states {
		if s.informer == nil || !s.spec.ShouldForward() {
			continue
		}
		for _, obj := range s.informer.GetStore().List() {
			u, ok := asUnstructured(obj)
			if !ok {
				continue
			}
			key := objectDedupKey(u)
			if _, dup := seen[key]; dup {
				continue
			}
			seen[key] = struct{}{}
			out = append(out, ForwardedRef{
				GVR:        s.gvr,
				APIVersion: s.spec.APIVersion,
				Kind:       s.spec.Kind,
				Name:       u.GetName(),
				Namespace:  u.GetNamespace(),
				Object:     u,
			})
		}
	}
	return out
}

// ListForwarded returns objects whose WatchSpec fans out to SSE clients.
func (c *InformerCache) ListForwarded() []ForwardedObject {
	refs := c.ListForwardedRefs()
	if refs == nil {
		return nil
	}
	out := make([]ForwardedObject, len(refs))
	for i, ref := range refs {
		out[i] = ref.Copy()
	}
	return out
}

// Snapshot returns normalized keys for every object currently in the store.
func (c *InformerCache) Snapshot() []ResourceKey {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	var keys []ResourceKey
	seen := map[string]struct{}{}
	for _, s := range c.states {
		if s.informer == nil {
			continue
		}
		for _, obj := range s.informer.GetStore().List() {
			u, ok := asUnstructured(obj)
			if !ok {
				continue
			}
			k := ResourceKey{
				APIVersion: s.spec.APIVersion,
				Kind:       s.spec.Kind,
				Namespace:  u.GetNamespace(),
				Name:       u.GetName(),
				UID:        string(u.GetUID()),
			}
			id := k.CompareKey()
			if _, dup := seen[id]; dup {
				continue
			}
			seen[id] = struct{}{}
			keys = append(keys, k)
		}
	}
	sort.Slice(keys, func(i, j int) bool { return keys[i].CompareKey() < keys[j].CompareKey() })
	return keys
}

// itemCount is a lock-scoped store length sum for logs (not deduplicated).
func (c *InformerCache) itemCount() int {
	if c == nil {
		return 0
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	n := 0
	for _, s := range c.states {
		if s.informer == nil {
			continue
		}
		n += len(s.informer.GetStore().List())
	}
	return n
}

// SpecStatuses is included in the debug dump for operators.
type SpecStatus struct {
	Kind        string `json:"kind"`
	APIVersion  string `json:"apiVersion"`
	Synced      bool   `json:"synced"`
	Unavailable bool   `json:"unavailable"`
	Error       string `json:"error,omitempty"`
	Polled      bool   `json:"polled,omitempty"`
}

// SpecStatuses returns per-spec sync/unavailable/error state for the debug dump.
func (c *InformerCache) SpecStatuses() []SpecStatus {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	out := make([]SpecStatus, 0, len(c.states))
	for _, s := range c.states {
		errStr, _ := s.lastError.Load().(string)
		out = append(out, SpecStatus{
			Kind:        s.spec.Kind,
			APIVersion:  s.spec.APIVersion,
			Synced:      s.synced.Load(),
			Unavailable: s.unavailable.Load(),
			Error:       errStr,
			Polled:      s.spec.Polled,
		})
	}
	return out
}
