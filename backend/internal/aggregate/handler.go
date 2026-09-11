// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
)

// Handler serves POST /aggregate/{applications,statuses,appSetData}.
type Handler struct {
	Engine *Engine
	REST   *rest.Config
	Access Access
	Authn  func(w http.ResponseWriter, r *http.Request) (string, bool)
	// GetAppSet overrides the user-token ApplicationSet GET (tests).
	GetAppSet func(ctx context.Context, token string, stub map[string]any) (map[string]any, error)
}

// NewHandler wires auth (GET /api) and SSAR.
func NewHandler(engine *Engine, restCfg *rest.Config, access Access) *Handler {
	if access == nil {
		access = AllowAll{}
	}
	return &Handler{
		Engine: engine,
		REST:   restCfg,
		Access: access,
		Authn: func(w http.ResponseWriter, r *http.Request) (string, bool) {
			return auth.AuthenticateRequest(r.Context(), restCfg, w, r)
		},
	}
}

func stripMulticloud(path string) string {
	const prefix = "/multicloud"
	if path == prefix {
		return "/"
	}
	if strings.HasPrefix(path, prefix+"/") || path == prefix {
		return path[len(prefix):]
	}
	if strings.HasPrefix(path, prefix) {
		return path[len(prefix):]
	}
	return path
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	token, ok := h.Authn(w, r)
	if !ok {
		return
	}
	path := strings.Trim(stripMulticloud(r.URL.Path), "/")
	parts := strings.Split(path, "/")
	if len(parts) < 2 || parts[0] != "aggregate" {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	switch parts[1] {
	case "applications":
		h.paginate(w, r, token)
	case "statuses":
		h.statuses(w, r, token)
	case "appSetData":
		h.appSetData(w, r, token)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}

func writeJSON(w http.ResponseWriter, v any) {
	writeJSONStatus(w, http.StatusOK, v)
}

func writeJSONStatus(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}
