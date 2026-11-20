// Copyright Contributors to the Open Cluster Management project

package rbacany

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	authzv1 "k8s.io/api/authorization/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/httpx"
)

const (
	// Route is the endpoint used for any-namespace authorization checks.
	Route = "/rbac/any-namespace"

	maxRequestBytes = 1 << 20
	maxNamespaces   = 10000
	reviewBatchSize = 40
)

// Request contains the resource attributes and visible namespaces to check.
type Request struct {
	ResourceAttributes authzv1.ResourceAttributes `json:"resourceAttributes"`
	Namespaces         []string                   `json:"namespaces"`
}

// Response reports whether the caller can perform the action in at least one namespace.
type Response struct {
	Allowed bool `json:"allowed"`
}

// Options configures the any-namespace RBAC endpoint.
type Options struct {
	RESTConfig    *rest.Config
	ClientForUser func(userToken string) (kubernetes.Interface, error)
}

// Handler serves the any-namespace RBAC endpoint.
type Handler struct {
	clientForUser func(userToken string) (kubernetes.Interface, error)
}

// New builds the endpoint handler. The Kubernetes client uses the request user's token.
func New(opts Options) *Handler {
	newClient := opts.ClientForUser
	if newClient == nil {
		newClient = func(userToken string) (kubernetes.Interface, error) {
			if opts.RESTConfig == nil {
				return nil, errors.New("rest config is required")
			}
			cfg := auth.UserRESTConfig(opts.RESTConfig, userToken)
			if cfg.RateLimiter == nil && cfg.QPS == 0 && cfg.Burst == 0 {
				cfg.QPS = 50
				cfg.Burst = 100
			}
			return kubernetes.NewForConfig(cfg)
		}
	}
	return &Handler{clientForUser: newClient}
}

// ServeHTTP evaluates the permission check as the user who made the request.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	userToken, ok := auth.RequireToken(w, r)
	if !ok {
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBytes)
	var request Request
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&request); err != nil {
		http.Error(w, "invalid any-namespace RBAC request", http.StatusBadRequest)
		return
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		http.Error(w, "invalid any-namespace RBAC request", http.StatusBadRequest)
		return
	}
	if request.ResourceAttributes.Verb == "" || request.ResourceAttributes.Resource == "" {
		http.Error(w, "resourceAttributes must include verb and resource", http.StatusBadRequest)
		return
	}
	if len(request.Namespaces) > maxNamespaces {
		http.Error(w, "too many namespaces", http.StatusRequestEntityTooLarge)
		return
	}
	namespaces, err := uniqueNamespaces(request.Namespaces)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	client, err := h.clientForUser(userToken)
	if err != nil {
		http.Error(w, "unable to create user authorization client", http.StatusServiceUnavailable)
		return
	}
	allowed, err := anyNamespaceAuthorized(r.Context(), client, request.ResourceAttributes, namespaces)
	if err != nil {
		if apierrors.IsUnauthorized(err) {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		http.Error(w, "unable to complete authorization review", http.StatusServiceUnavailable)
		return
	}

	w.Header().Set(httpx.HeaderContentType, httpx.MIMEJSON)
	_ = json.NewEncoder(w).Encode(Response{Allowed: allowed})
}

func uniqueNamespaces(namespaces []string) ([]string, error) {
	seen := make(map[string]struct{}, len(namespaces))
	result := make([]string, 0, len(namespaces))
	for _, namespace := range namespaces {
		namespace = strings.TrimSpace(namespace)
		if namespace == "" {
			return nil, errors.New("namespaces must contain non-empty names")
		}
		if _, exists := seen[namespace]; exists {
			continue
		}
		seen[namespace] = struct{}{}
		result = append(result, namespace)
	}
	return result, nil
}

func anyNamespaceAuthorized(
	ctx context.Context,
	client kubernetes.Interface,
	resourceAttributes authzv1.ResourceAttributes,
	namespaces []string,
) (bool, error) {
	if len(namespaces) == 0 {
		return false, nil
	}

	admin, err := checkAdminAccess(ctx, client)
	if err != nil {
		return false, err
	}
	if admin {
		return true, nil
	}

	var reviewFailed bool
	for start := 0; start < len(namespaces); start += reviewBatchSize {
		stop := start + reviewBatchSize
		if stop > len(namespaces) {
			stop = len(namespaces)
		}
		batch := namespaces[start:stop]
		batchContext, cancel := context.WithCancel(ctx)
		results := make(chan reviewResult, len(batch))
		for _, namespace := range batch {
			attributes := resourceAttributes
			attributes.Namespace = namespace
			go func(attributes authzv1.ResourceAttributes) {
				status, reviewErr := review(batchContext, client, attributes)
				results <- reviewResult{status: status, err: reviewErr}
			}(attributes)
		}

		for range batch {
			select {
			case <-ctx.Done():
				cancel()
				return false, ctx.Err()
			case result := <-results:
				if result.err == nil && result.status.Allowed {
					cancel()
					return true, nil
				}
				if result.err != nil || result.status.EvaluationError != "" {
					reviewFailed = true
				}
			}
		}
		cancel()
	}

	if reviewFailed {
		return false, errors.New("one or more namespace reviews failed")
	}
	return false, nil
}

type reviewResult struct {
	status authzv1.SubjectAccessReviewStatus
	err    error
}

func checkAdminAccess(ctx context.Context, client kubernetes.Interface) (bool, error) {
	status, err := review(ctx, client, authzv1.ResourceAttributes{
		Name:      "*",
		Namespace: "*",
		Resource:  "*",
		Verb:      "*",
	})
	if err != nil {
		return false, err
	}
	if status.Allowed {
		return true, nil
	}
	if status.EvaluationError != "" {
		return false, errors.New("admin authorization review failed")
	}
	return false, nil
}

func review(
	ctx context.Context,
	client kubernetes.Interface,
	resourceAttributes authzv1.ResourceAttributes,
) (authzv1.SubjectAccessReviewStatus, error) {
	result, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, &authzv1.SelfSubjectAccessReview{
		Spec: authzv1.SelfSubjectAccessReviewSpec{ResourceAttributes: &resourceAttributes},
	}, metav1.CreateOptions{})
	if err != nil {
		return authzv1.SubjectAccessReviewStatus{}, err
	}
	return result.Status, nil
}
