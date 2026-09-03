// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"net/http"
	"time"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

const keepAlive = 10 * time.Second

const instanceIDLen = 8

// Authenticator validates a user token (GET /api, same as Node /events).
type Authenticator interface {
	Authenticate(ctx context.Context, token string) (bool, error)
}

// APIAuth validates the browser token with GET /api using the user Bearer token.
type APIAuth struct {
	base *rest.Config
}

func NewAPIAuth(base *rest.Config) *APIAuth {
	return &APIAuth{base: base}
}

func (a *APIAuth) Authenticate(ctx context.Context, token string) (bool, error) {
	if a == nil || a.base == nil {
		return false, nil
	}
	if err := auth.ValidateUserToken(ctx, a.base, token); err != nil {
		return false, err
	}
	return true, nil
}

// StaticAuth is for tests.
type StaticAuth struct {
	OK bool
}

func (s StaticAuth) Authenticate(context.Context, string) (bool, error) {
	return s.OK, nil
}

// Handler serves GET /events as gzip/deflate/identity SSE.
type Handler struct {
	hub    *Hub
	authn  Authenticator
	access AccessChecker
	id     string
}

func NewHandler(h *Hub, authn Authenticator, access AccessChecker) *Handler {
	if access == nil {
		access = AllowAllAccess{}
	}
	return &Handler{hub: h, authn: authn, access: access, id: randomID(instanceIDLen)}
}

func randomID(n int) string {
	const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		for i := range b {
			b[i] = alphabet[i%len(alphabet)]
		}
		return string(b)
	}
	for i := range b {
		b[i] = alphabet[int(b[i])%len(alphabet)]
	}
	return string(b)
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token := auth.TokenFromRequest(r)
	if token == "" {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	ok, err := h.authn.Authenticate(r.Context(), token)
	if err != nil || !ok {
		applog.Logger().Warn("events unauthorized", "error", err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	encoding := negotiateEncoding(r.Header.Get("Accept-Encoding"), streamCompressionDisabled())
	http.SetCookie(w, &http.Cookie{
		Name:     "watch",
		Value:    h.id,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-store, no-transform")
	w.Header().Set("Content-Encoding", encoding)
	w.Header().Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	enc := newStreamEncoder(w, flusher, encoding)
	defer enc.Close()

	c := h.hub.subscribe()
	defer h.hub.unsubscribe(c)

	for _, ev := range h.hub.snapshotEvents() {
		if err := h.writeFiltered(r.Context(), token, enc, ev); err != nil {
			return
		}
	}

	ping := time.NewTicker(keepAlive)
	defer ping.Stop()
	for {
		select {
		case <-r.Context().Done():
			return
		case <-ping.C:
			if _, err := enc.Write(pingFrame()); err != nil {
				return
			}
			if err := enc.Flush(); err != nil {
				return
			}
		case ev, ok := <-c.ch:
			if !ok {
				return
			}
			if err := h.writeFiltered(r.Context(), token, enc, ev); err != nil {
				return
			}
		}
	}
}

func (h *Handler) writeFiltered(ctx context.Context, token string, enc *streamEncoder, ev Event) error {
	allowed, err := h.access.Allow(ctx, token, ev)
	if err != nil {
		applog.Logger().Warn("events ssar failed", "error", err)
		return nil
	}
	if !allowed {
		return nil
	}
	return writeEvent(enc, h.hub.assignID(ev))
}

func marshalEvent(ev Event) ([]byte, error) {
	switch ev.Type {
	case TypeSettings:
		settings := ev.Settings
		if settings == nil {
			settings = map[string]string{}
		}
		return json.Marshal(struct {
			Type     string            `json:"type"`
			Settings map[string]string `json:"settings"`
		}{Type: ev.Type, Settings: settings})
	default:
		return json.Marshal(struct {
			Type   string         `json:"type"`
			Object map[string]any `json:"object,omitempty"`
		}{Type: ev.Type, Object: ev.Object})
	}
}

func writeEvent(enc *streamEncoder, ev Event) error {
	body, err := marshalEvent(ev)
	if err != nil {
		return err
	}
	if _, err := enc.Write(FormatSSE(ev.ID, body)); err != nil {
		return err
	}
	return enc.Flush()
}
