// Copyright Contributors to the Open Cluster Management project

package vmproxy

import (
	"context"
	"errors"

	authzv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/hubresources"
	applog "github.com/stolostron/console/backend/internal/log"
)

// fineGrainedRBAC reports whether MultiClusterHub has fine-grained RBAC enabled.
func (h *Handler) fineGrainedRBAC(ctx context.Context) bool {
	if h.opts.FineGrained != nil {
		ok, err := h.opts.FineGrained(ctx)
		return err == nil && ok
	}
	dc, err := h.hubDynamic()
	if err != nil {
		applog.Logger().Error("mch dynamic client", "error", err)
		return false
	}
	ok, err := hubresources.MCHFineGrainedRBAC(ctx, dc)
	if err != nil {
		applog.Logger().Error("Error getting MultiClusterHub", "error", err)
		return false
	}
	return ok
}

// hubDynamic returns the hub dynamic client (injected or built from RESTConfig).
func (h *Handler) hubDynamic() (dynamic.Interface, error) {
	if h.opts.HubDynamic != nil {
		return h.opts.HubDynamic, nil
	}
	if h.opts.RESTConfig == nil {
		return nil, rest.ErrNotInCluster
	}
	return dynamic.NewForConfig(h.opts.RESTConfig)
}

// canCreateMCA reports whether the user may create ManagedClusterActions in the cluster namespace.
func (h *Handler) canCreateMCA(ctx context.Context, userToken, namespace string) bool {
	client, err := h.userKube(userToken)
	if err != nil {
		applog.Logger().Error("vm ssar client", "error", err)
		return false
	}
	review, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, &authzv1.SelfSubjectAccessReview{
		Spec: authzv1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authzv1.ResourceAttributes{
				Group:     "action.open-cluster-management.io",
				Namespace: namespace,
				Resource:  "managedclusteractions",
				Verb:      "create",
			},
		},
	}, metav1.CreateOptions{})
	if err != nil {
		applog.Logger().Error("vm ssar", "error", err)
		return false
	}
	return review.Status.Allowed
}

// vmActorToken reads the managed-cluster vm-actor Secret token used when MCA create is allowed.
func (h *Handler) vmActorToken(ctx context.Context, namespace string) (string, bool) {
	if h.saKube == nil {
		return "", false
	}
	secret, err := h.saKube.CoreV1().Secrets(namespace).Get(ctx, "vm-actor", metav1.GetOptions{})
	if err != nil {
		applog.Logger().Error("error getting vm-actor secret", "namespace", namespace, "error", err)
		return "", false
	}
	token := string(secret.Data["token"])
	if token == "" {
		return "", false
	}
	return token, true
}

// userKube builds a Kubernetes client impersonating the browser token (or uses the inject).
func (h *Handler) userKube(token string) (kubernetes.Interface, error) {
	if h.opts.UserKube != nil {
		return h.opts.UserKube(token)
	}
	if h.opts.RESTConfig == nil {
		return nil, errors.New("vmproxy rest config is required")
	}
	return kubernetes.NewForConfig(auth.UserRESTConfig(h.opts.RESTConfig, token))
}
