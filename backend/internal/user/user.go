// Copyright Contributors to the Open Cluster Management project

package user

import (
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

var userPreferenceGVR = schema.GroupVersionResource{
	Group:    "console.open-cluster-management.io",
	Version:  "v1",
	Resource: "userpreferences",
}

var sanitizeUsername = regexp.MustCompile(`[^a-z0-9\-.]`)

// Options configure user route handlers.
type Options struct {
	RESTConfig *rest.Config
	Reviewer   auth.TokenReviewer
	Dynamic    dynamic.Interface
}

// Handler serves /authenticated, /username, and /userpreference.
type Handler struct {
	base     *rest.Config
	reviewer auth.TokenReviewer
	dynamic  dynamic.Interface
}

// New builds a user routes handler.
func New(opts Options) *Handler {
	return &Handler{
		base:     opts.RESTConfig,
		reviewer: opts.Reviewer,
		dynamic:  opts.Dynamic,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/authenticated":
		if r.Method != http.MethodGet {
			http.NotFound(w, r)
			return
		}
		h.authenticated(w, r)
	case "/username":
		if r.Method != http.MethodGet {
			http.NotFound(w, r)
			return
		}
		h.username(w, r)
	case "/userpreference":
		switch r.Method {
		case http.MethodGet, http.MethodPost, http.MethodPatch:
			h.userpreference(w, r)
		default:
			http.NotFound(w, r)
		}
	default:
		http.NotFound(w, r)
	}
}

func (h *Handler) authenticated(w http.ResponseWriter, r *http.Request) {
	token := auth.TokenFromRequest(r)
	if token == "" {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	status, err := auth.ValidateUserTokenStatus(r.Context(), h.base, token)
	if err != nil {
		applog.Logger().Error("authenticated probe failed", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(status)
}

func (h *Handler) username(w http.ResponseWriter, r *http.Request) {
	token, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r)
	if !ok {
		return
	}
	result, err := h.reviewer.Review(r.Context(), token)
	if err != nil {
		applog.Logger().Error("token review failed", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	username := ""
	if result.Authenticated && result.Username != "" {
		username = result.Username
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"statusCode": http.StatusOK,
		"body": map[string]string{
			"username": username,
		},
	})
}

func (h *Handler) userpreference(w http.ResponseWriter, r *http.Request) {
	token, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r)
	if !ok {
		return
	}
	result, err := h.reviewer.Review(r.Context(), token)
	if err != nil {
		applog.Logger().Error("token review failed", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	name := preferenceName(result.Username)
	if name == "" {
		applog.Logger().Error("userpreference missing username", "method", r.Method)
		return
	}

	ctx := r.Context()
	client := h.dynamic.Resource(userPreferenceGVR)

	switch r.Method {
	case http.MethodGet:
		obj, getErr := client.Get(ctx, name, metav1.GetOptions{})
		w.Header().Set("Content-Type", "application/json")
		if getErr != nil {
			if apierrors.IsNotFound(getErr) {
				_, _ = w.Write([]byte("null"))
				return
			}
			applog.Logger().Error("get userpreference failed", "error", getErr)
			_, _ = w.Write([]byte("null"))
			return
		}
		_ = json.NewEncoder(w).Encode(obj.Object)
	case http.MethodPost:
		body, readErr := io.ReadAll(r.Body)
		if readErr != nil {
			applog.Logger().Error("read userpreference body failed", "error", readErr)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		var savedSearches interface{}
		if len(body) > 0 {
			if err := json.Unmarshal(body, &savedSearches); err != nil {
				applog.Logger().Error("parse userpreference body failed", "error", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}
		obj := &unstructured.Unstructured{Object: map[string]interface{}{
			"apiVersion": "console.open-cluster-management.io/v1",
			"kind":       "UserPreference",
			"metadata": map[string]interface{}{
				"name": name,
			},
			"spec": map[string]interface{}{
				"savedSearches": savedSearches,
			},
		}}
		created, createErr := client.Create(ctx, obj, metav1.CreateOptions{})
		w.Header().Set("Content-Type", "application/json")
		if createErr != nil {
			applog.Logger().Error("create userpreference failed", "error", createErr)
			_, _ = w.Write([]byte("null"))
			return
		}
		_ = json.NewEncoder(w).Encode(created.Object)
	case http.MethodPatch:
		body, readErr := io.ReadAll(r.Body)
		if readErr != nil {
			applog.Logger().Error("read userpreference patch failed", "error", readErr)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		patched, patchErr := client.Patch(ctx, name, "application/json-patch+json", body, metav1.PatchOptions{})
		w.Header().Set("Content-Type", "application/json")
		if patchErr != nil {
			applog.Logger().Error("patch userpreference failed", "error", patchErr)
			_, _ = w.Write([]byte("null"))
			return
		}
		_ = json.NewEncoder(w).Encode(patched.Object)
	}
}

func preferenceName(username string) string {
	if username == "" {
		return ""
	}
	return sanitizeUsername.ReplaceAllString(strings.ToLower(username), "-")
}
