// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"testing"
	"time"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/stolostron/console/backend/internal/informers"
)

func TestOnResourceFansModifiedThenLoaded(t *testing.T) {
	h := New(nil, nil)
	c := h.subscribe()
	defer h.unsubscribe(c)
	h.OnResource(informers.ResourceEvent{
		Type: TypeModified,
		GVR:  schema.GroupVersionResource{Version: "v1", Resource: "namespaces"},
		Object: &unstructured.Unstructured{Object: map[string]any{
			"kind": "Namespace", "apiVersion": "v1",
			"metadata": map[string]any{"name": "default"},
		}},
	})
	ev1 := recv(t, c.ch)
	ev2 := recv(t, c.ch)
	if ev1.Type != TypeModified || ev2.Type != TypeLoaded {
		t.Fatalf("%s then %s", ev1.Type, ev2.Type)
	}
}

func TestPublishSettingsThenLoaded(t *testing.T) {
	h := New(nil, func() map[string]string { return map[string]string{"x": "1"} })
	c := h.subscribe()
	defer h.unsubscribe(c)
	h.PublishSettings()
	ev1 := recv(t, c.ch)
	ev2 := recv(t, c.ch)
	if ev1.Type != TypeSettings || ev1.Settings["x"] != "1" || ev2.Type != TypeLoaded {
		t.Fatalf("%+v %+v", ev1, ev2)
	}
}

func TestUnsubscribeRemovesClient(t *testing.T) {
	h := New(nil, nil)
	c := h.subscribe()
	if h.clientCount() != 1 {
		t.Fatal("expected 1")
	}
	h.unsubscribe(c)
	if h.clientCount() != 0 {
		t.Fatal("expected 0")
	}
	h.unsubscribe(c)
}

func TestSlowClientPurged(t *testing.T) {
	h := New(nil, nil)
	h.buf = 1
	h.purge = time.Millisecond
	c := h.subscribe()
	c.ch <- Event{Type: TypeStart}
	h.fanout(Event{Type: TypeModified, Object: map[string]any{"kind": "x"}})
	time.Sleep(3 * time.Millisecond)
	h.fanout(Event{Type: TypeLoaded})
	if h.clientCount() != 0 {
		t.Fatalf("slow client still subscribed: %d", h.clientCount())
	}
}

func recv(t *testing.T, ch <-chan Event) Event {
	t.Helper()
	select {
	case ev, ok := <-ch:
		if !ok {
			t.Fatal("channel closed")
		}
		return ev
	case <-time.After(time.Second):
		t.Fatal("timeout")
		return Event{}
	}
}
