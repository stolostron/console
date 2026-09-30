// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"testing"
	"time"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/stolostron/console/backend/internal/informers"
)

func TestNewInitializesFlap(t *testing.T) {
	h := New(nil, nil)
	if h.flap == nil {
		t.Fatal("New must initialize flap tracker")
	}
}

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

func TestOnResourceSkipsThrottledPolicy(t *testing.T) {
	h := New(nil, nil)
	h.flap = newFlapState(testFlapConfig())
	c := h.subscribe()
	defer h.unsubscribe(c)

	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(h.flap, "flappy", "default", at)
	h.flap.now = func() time.Time { return at.Add(100 * time.Millisecond) }
	h.OnResource(informers.ResourceEvent{
		Type:   informers.EventModified,
		Object: &unstructured.Unstructured{Object: policyWithCompliant("flappy", "default", 100)},
	})
	select {
	case ev := <-c.ch:
		t.Fatalf("unexpected event %+v", ev)
	default:
	}
}

func TestOnResourcePublishesRootViolation(t *testing.T) {
	h := New(nil, nil)
	h.flap = newFlapState(testFlapConfig())
	c := h.subscribe()
	defer h.unsubscribe(c)

	at := time.Unix(1_700_000_000, 0)
	cur := at
	h.flap.now = func() time.Time { return cur }
	gvr := schema.GroupVersionResource{Group: "policy.open-cluster-management.io", Version: "v1", Resource: "policies"}
	h.OnResource(informers.ResourceEvent{
		Type:   informers.EventModified,
		GVR:    gvr,
		Object: &unstructured.Unstructured{Object: rootPolicy("default", "kike-foo", "weekly", "Compliant")},
	})
	cur = at.Add(-h.flap.cfg.settling - time.Second)
	h.OnResource(informers.ResourceEvent{
		Type:   informers.EventModified,
		GVR:    gvr,
		Object: &unstructured.Unstructured{Object: replicatedFlappingPolicy("default", "kike-foo", "weekly")},
	})
	cur = at
	for i := 0; i < h.flap.cfg.threshold+1; i++ {
		h.OnResource(informers.ResourceEvent{
			Type:   informers.EventModified,
			GVR:    gvr,
			Object: &unstructured.Unstructured{Object: replicatedFlappingPolicy("default", "kike-foo", "weekly")},
		})
		cur = cur.Add(time.Millisecond)
	}

	var sawRoot, sawPropagated bool
	for {
		select {
		case ev := <-c.ch:
			if ev.Type != TypeModified || ev.Object == nil {
				continue
			}
			meta, _ := ev.Object["metadata"].(map[string]any)
			name, _ := meta["name"].(string)
			status, _ := ev.Object["status"].(map[string]any)
			switch name {
			case "kike-foo":
				if status["compliant"] == "NonCompliant" {
					sawRoot = true
				}
			case "default.kike-foo":
				if ev.Object["throttled"] == true && status["compliant"] == "NonCompliant" {
					sawPropagated = true
				}
			}
		default:
			if !sawRoot || !sawPropagated {
				t.Fatalf("root=%v propagated=%v", sawRoot, sawPropagated)
			}
			return
		}
	}
}

func TestOnResourceFansPolicyWhenCooldownAllows(t *testing.T) {
	h := New(nil, nil)
	h.flap = newFlapState(testFlapConfig())
	c := h.subscribe()
	defer h.unsubscribe(c)

	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(h.flap, "periodic", "default", at)
	h.flap.now = func() time.Time { return at.Add(h.flap.cfg.cooldown) }
	h.OnResource(informers.ResourceEvent{
		Type:   informers.EventModified,
		Object: &unstructured.Unstructured{Object: policyWithCompliant("periodic", "default", 50)},
	})
	ev1 := recv(t, c.ch)
	ev2 := recv(t, c.ch)
	if ev1.Type != TypeModified {
		t.Fatalf("expected MODIFIED got %s", ev1.Type)
	}
	if ev2.Type != TypeLoaded {
		t.Fatalf("expected LOADED got %s", ev2.Type)
	}
}

func TestOnResourceFansDeletedDespiteThrottle(t *testing.T) {
	h := New(nil, nil)
	h.flap = newFlapState(testFlapConfig())
	c := h.subscribe()
	defer h.unsubscribe(c)

	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(h.flap, "gone", "default", at)
	h.flap.now = func() time.Time { return at.Add(100 * time.Millisecond) }
	h.OnResource(informers.ResourceEvent{
		Type: informers.EventDeleted,
		Object: &unstructured.Unstructured{Object: map[string]any{
			"kind": policyKind, "apiVersion": "policy.open-cluster-management.io/v1",
			"metadata": map[string]any{"name": "gone", "namespace": "default"},
		}},
	})
	ev1 := recv(t, c.ch)
	ev2 := recv(t, c.ch)
	if ev1.Type != TypeDeleted || ev2.Type != TypeLoaded {
		t.Fatalf("%s then %s", ev1.Type, ev2.Type)
	}
}

func TestOnResourceFansWhenFlapNil(t *testing.T) {
	h := New(nil, nil)
	h.flap = nil
	c := h.subscribe()
	defer h.unsubscribe(c)
	h.OnResource(informers.ResourceEvent{
		Type: informers.EventModified,
		Object: &unstructured.Unstructured{Object: map[string]any{
			"kind": policyKind, "apiVersion": "policy.open-cluster-management.io/v1",
			"metadata": map[string]any{"name": "p", "namespace": "ns"},
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
