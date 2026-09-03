// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"encoding/json"
	"net/http"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

// SnapshotDoc is the JSON body of GET /debug/informer-snapshot.
type SnapshotDoc struct {
	Synced bool          `json:"synced"`
	Items  []ResourceKey `json:"items"`
	Specs  []SpecStatus  `json:"specs,omitempty"`
}

// SnapshotHandler serves GET /debug/informer-snapshot (development only).
type SnapshotHandler struct {
	Cache *InformerCache
	Base  *rest.Config
}

// NewSnapshotHandler requires a user token (cookie or Bearer) validated with GET /api.
func NewSnapshotHandler(c *InformerCache, base *rest.Config) *SnapshotHandler {
	return &SnapshotHandler{Cache: c, Base: base}
}

func (h *SnapshotHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token, ok := auth.RequireToken(w, r)
	if !ok {
		return
	}
	if h.Base != nil {
		if err := auth.ValidateUserToken(r.Context(), h.Base, token); err != nil {
			applog.Logger().Warn("informer snapshot unauthorized", "error", err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
	}
	doc := SnapshotDoc{
		Synced: h.Cache.HasSynced(),
		Items:  h.Cache.Snapshot(),
		Specs:  h.Cache.SpecStatuses(),
	}
	if r.URL.Query().Get("excludePolled") == "true" {
		doc.Items = excludePolled(doc.Items, h.Cache)
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(doc); err != nil {
		applog.Logger().Warn("informer snapshot encode", "error", err)
	}
}

func excludePolled(items []ResourceKey, c *InformerCache) []ResourceKey {
	if c == nil {
		return items
	}
	c.mu.RLock()
	polled := map[string]struct{}{}
	for _, s := range c.states {
		if s.spec.Polled {
			polled[s.spec.APIVersion+"|"+s.spec.Kind] = struct{}{}
		}
	}
	c.mu.RUnlock()
	out := items[:0]
	for _, k := range items {
		if _, skip := polled[k.APIVersion+"|"+k.Kind]; skip {
			continue
		}
		out = append(out, k)
	}
	return out
}
