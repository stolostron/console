// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const (
	// EventModified is the SSE type for creates and updates (Node pushEvent).
	EventModified = "MODIFIED"
	// EventDeleted is the SSE type for deletes.
	EventDeleted = "DELETED"
)

// ResourceEvent is a cache change for GET /events (Node cacheResource / deleteResource).
type ResourceEvent struct {
	Type   string
	Object *unstructured.Unstructured
	GVR    schema.GroupVersionResource
}

// ResourceSink receives forwarded watch events. The SSE hub implements this.
type ResourceSink interface {
	OnResource(ev ResourceEvent)
}

// resourceHandler adapts cache.ResourceEventHandler to ResourceSink, emitting
// MODIFIED for add/update and DELETED for delete (creates are not ADDED).
type resourceHandler struct {
	spec WatchSpec
	gvr  schema.GroupVersionResource
	sink ResourceSink
}

// OnAdd forwards a create as EventModified.
func (h resourceHandler) OnAdd(obj any, _ bool) {
	h.emitModified(obj)
}

// OnUpdate forwards an update as EventModified unless resourceVersion is unchanged.
func (h resourceHandler) OnUpdate(oldObj, newObj any) {
	oldU, oldOK := asUnstructured(oldObj)
	newU, newOK := asUnstructured(newObj)
	if oldOK && newOK && oldU.GetResourceVersion() == newU.GetResourceVersion() {
		return
	}
	h.emitModified(newObj)
}

// OnDelete forwards a delete as EventDeleted with identity-only metadata.
func (h resourceHandler) OnDelete(obj any) {
	if h.sink == nil {
		return
	}
	u, ok := asUnstructured(obj)
	if !ok {
		return
	}
	h.sink.OnResource(ResourceEvent{
		Type: EventDeleted,
		GVR:  h.gvr,
		Object: &unstructured.Unstructured{Object: map[string]any{
			"apiVersion": h.spec.APIVersion,
			"kind":       h.spec.Kind,
			"metadata": map[string]any{
				"name":      u.GetName(),
				"namespace": u.GetNamespace(),
			},
		}},
	})
}

// emitModified deep-copies the object, stamps apiVersion/kind from the WatchSpec,
// and notifies the sink as EventModified.
func (h resourceHandler) emitModified(obj any) {
	if h.sink == nil {
		return
	}
	u, ok := asUnstructured(obj)
	if !ok {
		return
	}
	cp := u.DeepCopy()
	cp.SetAPIVersion(h.spec.APIVersion)
	cp.SetKind(h.spec.Kind)
	h.sink.OnResource(ResourceEvent{Type: EventModified, Object: cp, GVR: h.gvr})
}
