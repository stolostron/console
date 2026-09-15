// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"sync"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
)

const accessCacheTTL = 60 * time.Second

// AccessChecker decides whether a user token may see a ClusterRole.
type AccessChecker interface {
	CanSee(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error)
}

// AllowAllAccess is for tests.
type AllowAllAccess struct{}

func (AllowAllAccess) CanSee(context.Context, string, *rbacv1.ClusterRole) (bool, error) {
	return true, nil
}

type cacheKey struct {
	token string
	verb  string
	name  string
}

type cacheEntry struct {
	allowed bool
	expiry  time.Time
}

// SSARAccess runs SelfSubjectAccessReview with the user token (parity with Node eventFilter).
type SSARAccess struct {
	newClient func(userToken string) (kubernetes.Interface, error)

	mu    sync.Mutex
	cache map[cacheKey]cacheEntry
}

func NewSSARAccess(base *rest.Config) *SSARAccess {
	return NewSSARAccessWithClient(func(userToken string) (kubernetes.Interface, error) {
		return kubernetes.NewForConfig(auth.UserRESTConfig(base, userToken))
	})
}

func NewSSARAccessWithClient(newClient func(userToken string) (kubernetes.Interface, error)) *SSARAccess {
	return &SSARAccess{
		cache:     map[cacheKey]cacheEntry{},
		newClient: newClient,
	}
}

func (a *SSARAccess) CanSee(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error) {
	if role == nil {
		return false, nil
	}
	allowed, err := a.ssar(ctx, userToken, "list", "")
	if err != nil {
		return false, err
	}
	if allowed {
		return true, nil
	}
	return a.ssar(ctx, userToken, "get", role.Name)
}

func (a *SSARAccess) ssar(ctx context.Context, userToken, verb, name string) (bool, error) {
	key := cacheKey{token: userToken, verb: verb, name: name}
	now := time.Now()
	a.mu.Lock()
	if e, ok := a.cache[key]; ok && e.expiry.After(now) {
		a.mu.Unlock()
		return e.allowed, nil
	}
	a.mu.Unlock()

	client, err := a.newClient(userToken)
	if err != nil {
		return false, err
	}
	review, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, &authzv1.SelfSubjectAccessReview{
		Spec: authzv1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authzv1.ResourceAttributes{
				Group:    "rbac.authorization.k8s.io",
				Resource: "clusterroles",
				Verb:     verb,
				Name:     name,
			},
		},
	}, metav1.CreateOptions{})
	if err != nil {
		return false, err
	}
	allowed := review.Status.Allowed
	a.mu.Lock()
	a.cache[key] = cacheEntry{allowed: allowed, expiry: now.Add(accessCacheTTL)}
	a.mu.Unlock()
	return allowed, nil
}
