// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// SSE event type strings for GET /events (matches the Node ServerSideEvents framing).
const (
	// TypeStart begins a snapshot or stream session.
	TypeStart = "START"
	// TypeSettings carries stream settings to the client.
	TypeSettings = "SETTINGS"
	// TypeModified is a create or update of a watched object.
	TypeModified = "MODIFIED"
	// TypeDeleted is a delete of a watched object.
	TypeDeleted = "DELETED"
	// TypeEOP marks the end of a priority packet within a snapshot.
	TypeEOP = "EOP"
	// TypeLoaded signals the snapshot (or live batch) is complete.
	TypeLoaded = "LOADED"
)

// Event is one SSE data payload for GET /events.
type Event struct {
	Type     string                      `json:"type"`
	Object   map[string]any              `json:"object,omitempty"`
	Settings map[string]string           `json:"settings,omitempty"`
	GVR      schema.GroupVersionResource `json:"-"`
	ID       string                      `json:"-"`
}
