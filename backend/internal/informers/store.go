// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"sort"
	"sync"
	"sync/atomic"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
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

func (k ResourceKey) CompareKey() string {
	return k.APIVersion + "|" + k.Kind + "|" + k.Namespace + "|" + k.Name
}

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
}

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

// List returns objects for a GVR across all matching specs (union).
func (c *InformerCache) List(gvr schema.GroupVersionResource) []unstructured.Unstructured {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	var out []unstructured.Unstructured
	seen := map[string]struct{}{}
	for _, s := range c.states {
		if s.informer == nil || s.gvr != gvr {
			continue
		}
		for _, obj := range s.informer.GetStore().List() {
			u, ok := asUnstructured(obj)
			if !ok {
				continue
			}
			key := string(u.GetUID())
			if key == "" {
				key = u.GetNamespace() + "/" + u.GetName()
			}
			if _, dup := seen[key]; dup {
				continue
			}
			seen[key] = struct{}{}
			out = append(out, *u.DeepCopy())
		}
	}
	return out
}

// ListByKind returns cached objects for apiVersion+kind across matching specs.
func (c *InformerCache) ListByKind(apiVersion, kind string) []unstructured.Unstructured {
	if c == nil {
		return nil
	}
	c.mu.RLock()
	defer c.mu.RUnlock()
	var out []unstructured.Unstructured
	seen := map[string]struct{}{}
	for _, s := range c.states {
		if s.informer == nil || s.spec.APIVersion != apiVersion || s.spec.Kind != kind {
			continue
		}
		for _, obj := range s.informer.GetStore().List() {
			u, ok := asUnstructured(obj)
			if !ok {
				continue
			}
			key := string(u.GetUID())
			if key == "" {
				key = u.GetNamespace() + "/" + u.GetName()
			}
			if _, dup := seen[key]; dup {
				continue
			}
			seen[key] = struct{}{}
			out = append(out, *u.DeepCopy())
		}
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
