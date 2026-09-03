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

	mu      sync.Mutex
	clients map[*client]struct{}
	nextID  atomic.Uint64
	buf     int
	purge   time.Duration
}

func New(cache *informers.InformerCache, settings func() map[string]string) *Hub {
	if settings == nil {
		settings = func() map[string]string { return map[string]string{} }
	}
	return &Hub{
		cache:    cache,
		settings: settings,
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

func (h *Hub) subscribe() *client {
	c := &client{ch: make(chan Event, h.bufSize())}
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
	return c
}

func (h *Hub) unsubscribe(c *client) {
	h.mu.Lock()
	h.dropLocked(c)
	h.mu.Unlock()
}

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

func (h *Hub) assignID(ev Event) Event {
	ev.ID = nextIDString(h.nextID.Add(1))
	return ev
}

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
	h.push(Event{Type: ev.Type, Object: obj, GVR: ev.GVR})
}

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
