// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	rbacv1 "k8s.io/api/rbac/v1"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/events/sse"
	applog "github.com/stolostron/console/backend/internal/log"
)

const keepAlive = 10 * time.Second

// Authenticator validates a user token (GET /api, same as Node /events).
type Authenticator = sse.Authenticator

// APIAuth validates the browser token with GET /api using the user Bearer token.
type APIAuth = sse.APIAuth

// NewAPIAuth returns an Authenticator backed by ValidateUserToken.
func NewAPIAuth(base *rest.Config) *APIAuth {
	return sse.NewAPIAuth(base)
}

// StaticAuth is for tests.
type StaticAuth = sse.StaticAuth

type watchPayload struct {
	Type   string              `json:"type"`
	Object *rbacv1.ClusterRole `json:"object,omitempty"`
}

// Handler serves GET /events/rbac as uncompressed SSE.
type Handler struct {
	store  *Store
	authn  Authenticator
	access AccessChecker
	base   *rest.Config
}

// NewHandler returns an SSE handler for GET /events/rbac.
func NewHandler(store *Store, authn Authenticator, access AccessChecker) *Handler {
	h := &Handler{store: store, authn: authn, access: access}
	if a, ok := authn.(*APIAuth); ok {
		h.base = a.Base
	}
	return h
}

// ServeHTTP streams ClusterRole watch events as uncompressed SSE after a filtered snapshot.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token, flusher, ok := sse.Begin(w, r, h.authn, "rbac events unauthorized")
	if !ok {
		return
	}

	// Match Node /events so proxies do not gzip or buffer the stream.
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store, no-transform")
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	if tracker, ok := h.access.(StreamTracker); ok {
		tracker.BeginStream(token)
		defer tracker.EndStream(token)
	}

	ch := h.store.Subscribe()
	defer h.store.Unsubscribe(ch)

	if err := writeSSE(w, flusher, watchPayload{Type: "START"}); err != nil {
		return
	}
	for _, role := range h.snapshot(r.Context(), token) {
		allowed, err := h.access.CanSee(r.Context(), token, role)
		if err != nil {
			applog.Logger().Warn("rbac ssar failed", "error", err, "name", role.Name)
			continue
		}
		if !allowed {
			continue
		}
		if err := writeSSE(w, flusher, watchPayload{Type: "ADDED", Object: role}); err != nil {
			return
		}
	}
	if err := writeSSE(w, flusher, watchPayload{Type: "EOP"}); err != nil {
		return
	}
	if err := writeSSE(w, flusher, watchPayload{Type: "LOADED"}); err != nil {
		return
	}

	ping := time.NewTicker(keepAlive)
	defer ping.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case <-ping.C:
			if _, err := w.Write([]byte(": ping\n\n")); err != nil {
				return
			}
			flusher.Flush()
		case ev, ok := <-ch:
			if !ok {
				return
			}
			allowed, err := h.see(r.Context(), token, ev)
			if err != nil || !allowed {
				continue
			}
			if err := writeSSE(w, flusher, watchPayload{Type: ev.Type, Object: ev.Role}); err != nil {
				return
			}
			if err := writeSSE(w, flusher, watchPayload{Type: "EOP"}); err != nil {
				return
			}
		}
	}
}

// see applies CanSeeDeleted for DELETED events and CanSee otherwise.
func (h *Handler) see(ctx context.Context, token string, ev Event) (bool, error) {
	if ev.Type == "DELETED" {
		return h.access.CanSeeDeleted(ctx, token, ev.Role)
	}
	return h.access.CanSee(ctx, token, ev.Role)
}

// writeSSE marshals payload as a single SSE data frame and flushes.
func writeSSE(w http.ResponseWriter, flusher http.Flusher, payload watchPayload) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	if _, err := w.Write([]byte("data: ")); err != nil {
		return err
	}
	if _, err := w.Write(body); err != nil {
		return err
	}
	if _, err := w.Write([]byte("\n\n")); err != nil {
		return err
	}
	flusher.Flush()
	return nil
}

// snapshot returns store roles, or a per-user ClusterRole list when the informer cache is empty.
func (h *Handler) snapshot(ctx context.Context, token string) []*rbacv1.ClusterRole {
	roles := h.store.List()
	if len(roles) > 0 || h.base == nil {
		return roles
	}
	listed, err := listVMClusterRolesForToken(ctx, h.base, token)
	if err != nil {
		applog.Logger().Warn("rbac user list fallback failed", "error", err)
		return roles
	}
	return listed
}
