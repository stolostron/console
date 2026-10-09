// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"sync"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type collectSink struct {
	mu sync.Mutex
	ev []ResourceEvent
}

func (s *collectSink) OnResource(ev ResourceEvent) {
	s.mu.Lock()
	s.ev = append(s.ev, ev)
	s.mu.Unlock()
}

func (s *collectSink) types() []string {
	s.mu.Lock()
	defer s.mu.Unlock()
	out := make([]string, len(s.ev))
	for i, e := range s.ev {
		out[i] = e.Type
	}
	return out
}

func TestResourceHandlerModifiedAndDeleted(t *testing.T) {
	sink := &collectSink{}
	gvr := schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}
	h := resourceHandler{spec: watch("Namespace", "v1"), gvr: gvr, sink: sink}
	obj := uObj("v1", "Namespace", "", "default", "uid-1", map[string]any{"resourceVersion": "1"})
	h.OnAdd(obj, true)
	if got := sink.types(); len(got) != 1 || got[0] != EventModified {
		t.Fatalf("add %v", got)
	}
	if sink.ev[0].Object.GetKind() != "Namespace" || sink.ev[0].GVR != gvr {
		t.Fatalf("payload %+v", sink.ev[0])
	}

	same := uObj("v1", "Namespace", "", "default", "uid-1", map[string]any{"resourceVersion": "1"})
	h.OnUpdate(obj, same)
	if len(sink.types()) != 1 {
		t.Fatalf("same RV should skip: %v", sink.types())
	}

	updated := uObj("v1", "Namespace", "", "default", "uid-1", map[string]any{"resourceVersion": "2"})
	h.OnUpdate(obj, updated)
	if got := sink.types(); len(got) != 2 || got[1] != EventModified {
		t.Fatalf("update %v", got)
	}

	h.OnDelete(updated)
	if got := sink.types(); len(got) != 3 || got[2] != EventDeleted {
		t.Fatalf("delete %v", got)
	}
	del := sink.ev[2].Object
	if del.GetName() != "default" || del.GetUID() != "" {
		t.Fatalf("deleted object should be minimal: %+v", del.Object)
	}
	if _, ok := del.Object["metadata"].(map[string]any)["resourceVersion"]; ok {
		t.Fatal("DELETED must not include resourceVersion")
	}
}

func TestResourceHandlerNilSink(t *testing.T) {
	h := resourceHandler{spec: watch("Namespace", "v1")}
	h.OnAdd(&unstructured.Unstructured{}, false)
	h.OnDelete(&unstructured.Unstructured{})
}
