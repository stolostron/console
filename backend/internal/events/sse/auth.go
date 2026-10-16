// Copyright Contributors to the Open Cluster Management project

package sse

import (
	"context"
	"net/http"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

// Authenticator validates a user token (GET /api, same as Node /events).
type Authenticator interface {
	Authenticate(ctx context.Context, token string) (bool, error)
}

// APIAuth validates the browser token with GET /api using the user Bearer token.
type APIAuth struct {
	Base *rest.Config
}

// NewAPIAuth returns an Authenticator backed by ValidateUserToken.
func NewAPIAuth(base *rest.Config) *APIAuth {
	return &APIAuth{Base: base}
}

// Authenticate implements Authenticator.
func (a *APIAuth) Authenticate(ctx context.Context, token string) (bool, error) {
	if a == nil || a.Base == nil {
		return false, nil
	}
	if err := auth.ValidateUserToken(ctx, a.Base, token); err != nil {
		return false, err
	}
	return true, nil
}

// StaticAuth is for tests.
type StaticAuth struct {
	OK bool
}

// Authenticate implements Authenticator.
func (s StaticAuth) Authenticate(context.Context, string) (bool, error) {
	return s.OK, nil
}

// Begin authenticates the request and returns a Flusher for SSE.
// On failure it writes the HTTP error and returns ok=false.
func Begin(
	w http.ResponseWriter, r *http.Request, authn Authenticator, unauthorizedLog string,
) (token string, flusher http.Flusher, ok bool) {
	token = auth.TokenFromRequest(r)
	if token == "" {
		w.WriteHeader(http.StatusUnauthorized)
		return "", nil, false
	}
	if authn == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return "", nil, false
	}
	authed, err := authn.Authenticate(r.Context(), token)
	if err != nil || !authed {
		applog.Logger().Warn(unauthorizedLog, "error", err)
		w.WriteHeader(http.StatusUnauthorized)
		return "", nil, false
	}
	flusher, ok = w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return "", nil, false
	}
	return token, flusher, true
}
