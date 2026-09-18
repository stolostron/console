// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"k8s.io/apimachinery/pkg/runtime/schema"
)

const (
	TypeStart    = "START"
	TypeSettings = "SETTINGS"
	TypeModified = "MODIFIED"
	TypeDeleted  = "DELETED"
	TypeEOP      = "EOP"
	TypeLoaded   = "LOADED"
)

// Event is one SSE data payload for GET /events.
type Event struct {
	Type     string                      `json:"type"`
	Object   map[string]any              `json:"object,omitempty"`
	Settings map[string]string           `json:"settings,omitempty"`
	GVR      schema.GroupVersionResource `json:"-"`
	ID       string                      `json:"-"`
}
