// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"sync"
	"sync/atomic"
	"time"

	"github.com/stolostron/console/backend/internal/informers"
)

const (
	defaultBuffer = 256
	defaultPurge  = 30 * time.Minute
)

type client struct {
	ch      chan Event
	blocked time.Time
}

// Hub fans informer events out to GET /events clients (Node ServerSideEvents).
type Hub struct {
	cache    *informers.InformerCache
	settings func() map[string]string
	flap     *flapState

	mu      sync.Mutex
	clients map[*client]struct{}
	nextID  atomic.Uint64
	buf     int
	purge   time.Duration
}

// New creates a Hub that fans informer events to subscribed GET /events clients.
func New(cache *informers.InformerCache, settings func() map[string]string) *Hub {
	if settings == nil {
		settings = func() map[string]string { return map[string]string{} }
	}
	return &Hub{
		cache:    cache,
		settings: settings,
		flap:     newFlapState(defaultFlapConfig()),
		clients:  map[*client]struct{}{},
		buf:      defaultBuffer,
		purge:    defaultPurge,
	}
}

func (h *Hub) bufSize() int {
	if h.buf <= 0 {
		return defaultBuffer
	}
	return h.buf
}

func (h *Hub) purgeAfter() time.Duration {
	if h.purge <= 0 {
		return defaultPurge
	}
	return h.purge
}

// subscribe registers a buffered client channel for live fan-out.
func (h *Hub) subscribe() *client {
	c := &client{ch: make(chan Event, h.bufSize())}
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
	return c
}

// unsubscribe removes the client and closes its channel.
func (h *Hub) unsubscribe(c *client) {
	h.mu.Lock()
	h.dropLocked(c)
	h.mu.Unlock()
}

// dropLocked removes c and closes its channel. Caller holds mu.
func (h *Hub) dropLocked(c *client) {
	if _, ok := h.clients[c]; !ok {
		return
	}
	delete(h.clients, c)
	close(c.ch)
}

func (h *Hub) clientCount() int {
	h.mu.Lock()
	defer h.mu.Unlock()
	return len(h.clients)
}

// assignID stamps a monotonically increasing SSE id onto the event.
func (h *Hub) assignID(ev Event) Event {
	ev.ID = nextIDString(h.nextID.Add(1))
	return ev
}

// fanout delivers ev to every subscriber; slow clients that stay blocked past purge are dropped.
func (h *Hub) fanout(ev Event) {
	now := time.Now()
	purge := h.purgeAfter()
	h.mu.Lock()
	defer h.mu.Unlock()
	for c := range h.clients {
		select {
		case c.ch <- ev:
			c.blocked = time.Time{}
		default:
			if c.blocked.IsZero() {
				c.blocked = now
			}
			if now.Sub(c.blocked) >= purge {
				h.dropLocked(c)
			}
		}
	}
}

// OnResource implements informers.ResourceSink. Matches Node pushEvent (payload then LOADED).
func (h *Hub) OnResource(ev informers.ResourceEvent) {
	if h == nil {
		return
	}
	obj := map[string]any{}
	if ev.Object != nil && ev.Object.Object != nil {
		obj = ev.Object.Object
	}
	suppress := false
	if ev.Type == informers.EventDeleted && h.flap != nil {
		h.flap.forget(obj)
	}
	if ev.Type == informers.EventModified && h.flap != nil {
		h.flap.rememberRoot(obj, ev.GVR)
		suppress = h.flap.shouldThrottle(obj, h.flap.clock(), ev.GVR)
	}
	if !suppress {
		if h.flap != nil {
			h.flap.decorateRoot(obj)
		}
		h.push(Event{Type: ev.Type, Object: obj, GVR: ev.GVR})
	}
	if h.flap != nil {
		for _, extra := range h.flap.takeDirtyRoots() {
			h.push(Event{Type: TypeModified, Object: extra.object, GVR: extra.gvr})
		}
	}
}

// push fans out ev followed by LOADED so clients know a batch boundary (Node pushEvent).
func (h *Hub) push(ev Event) {
	h.fanout(ev)
	h.fanout(Event{Type: TypeLoaded})
}

// PublishSettings broadcasts SETTINGS from the config directory (plus LOADED).
func (h *Hub) PublishSettings() {
	if h == nil {
		return
	}
	h.push(Event{Type: TypeSettings, Settings: h.settings()})
}
