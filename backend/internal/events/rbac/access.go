// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"sort"
	"sync"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
)

const (
	accessCacheTTL     = 60 * time.Second
	accessCleanupEvery = 90 * time.Second
	accessCacheMaxSize = 5000
)

// AccessChecker decides whether a user token may see a ClusterRole.
type AccessChecker interface {
	CanSee(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error)
	// CanSeeDeleted applies CanSee, then the last namespaced allow for this role when the
	// object is already gone (completed deny or NotFound).
	CanSeeDeleted(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error)
}

// StreamTracker is optional: SSARAccess implements it so remembered DELETED allows
// are cleared when the last SSE stream for a token closes.
type StreamTracker interface {
	BeginStream(userToken string)
	EndStream(userToken string)
}

// AllowAllAccess is for tests.
type AllowAllAccess struct{}

func (AllowAllAccess) CanSee(context.Context, string, *rbacv1.ClusterRole) (bool, error) {
	return true, nil
}

func (AllowAllAccess) CanSeeDeleted(context.Context, string, *rbacv1.ClusterRole) (bool, error) {
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
	// allowedRoles remembers get-allows per token hash. List allows are not stored.
	allowedRoles map[string]map[string]struct{}
	// activeStreams counts open SSE streams per token hash.
	activeStreams map[string]int
}

func NewSSARAccess(base *rest.Config) *SSARAccess {
	return NewSSARAccessWithClient(func(userToken string) (kubernetes.Interface, error) {
		return kubernetes.NewForConfig(auth.UserRESTConfig(base, userToken))
	})
}

func NewSSARAccessWithClient(newClient func(userToken string) (kubernetes.Interface, error)) *SSARAccess {
	return &SSARAccess{
		cache:         map[cacheKey]cacheEntry{},
		allowedRoles:  map[string]map[string]struct{}{},
		activeStreams: map[string]int{},
		newClient:     newClient,
	}
}

func (a *SSARAccess) CanSee(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error) {
	return a.decide(ctx, userToken, role, false)
}

func (a *SSARAccess) CanSeeDeleted(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error) {
	return a.decide(ctx, userToken, role, true)
}

func (a *SSARAccess) decide(
	ctx context.Context, userToken string, role *rbacv1.ClusterRole, deleted bool,
) (bool, error) {
	if role == nil || role.Name == "" {
		return false, nil
	}
	allowed, err := a.ssar(ctx, userToken, "list", "")
	if err != nil {
		return false, err
	}
	if allowed {
		return true, nil
	}
	allowed, err = a.ssar(ctx, userToken, "get", role.Name)
	if err != nil {
		if deleted && apierrors.IsNotFound(err) && a.roleWasAllowed(userToken, role.Name) {
			a.forgetRole(userToken, role.Name)
			return true, nil
		}
		return false, err
	}
	if allowed {
		if deleted {
			a.forgetRole(userToken, role.Name)
		} else {
			a.rememberRole(userToken, role.Name)
		}
		return true, nil
	}
	if deleted && a.roleWasAllowed(userToken, role.Name) {
		a.forgetRole(userToken, role.Name)
		return true, nil
	}
	a.forgetRole(userToken, role.Name)
	return false, nil
}

func (a *SSARAccess) rememberRole(userToken, name string) {
	th := hashToken(userToken)
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.allowedRoles == nil {
		a.allowedRoles = map[string]map[string]struct{}{}
	}
	names := a.allowedRoles[th]
	if names == nil {
		names = map[string]struct{}{}
		a.allowedRoles[th] = names
	}
	names[name] = struct{}{}
}

func (a *SSARAccess) forgetRole(userToken, name string) {
	th := hashToken(userToken)
	a.mu.Lock()
	defer a.mu.Unlock()
	names := a.allowedRoles[th]
	if names == nil {
		return
	}
	delete(names, name)
	if len(names) == 0 {
		delete(a.allowedRoles, th)
	}
}

func (a *SSARAccess) roleWasAllowed(userToken, name string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	_, ok := a.allowedRoles[hashToken(userToken)][name]
	return ok
}

func (a *SSARAccess) BeginStream(userToken string) {
	if a == nil || userToken == "" {
		return
	}
	th := hashToken(userToken)
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.activeStreams == nil {
		a.activeStreams = map[string]int{}
	}
	a.activeStreams[th]++
}

func (a *SSARAccess) EndStream(userToken string) {
	if a == nil || userToken == "" {
		return
	}
	th := hashToken(userToken)
	a.mu.Lock()
	defer a.mu.Unlock()
	n := a.activeStreams[th]
	if n <= 1 {
		delete(a.activeStreams, th)
		delete(a.allowedRoles, th)
		return
	}
	a.activeStreams[th] = n - 1
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (a *SSARAccess) ssar(ctx context.Context, userToken, verb, name string) (bool, error) {
	key := cacheKey{token: hashToken(userToken), verb: verb, name: name}
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

// StartCleanup expires SSAR cache entries periodically.
func (a *SSARAccess) StartCleanup(ctx context.Context) {
	if a == nil {
		return
	}
	go func() {
		tick := time.NewTicker(accessCleanupEvery)
		defer tick.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-tick.C:
				a.cleanup(time.Now())
			}
		}
	}()
}

func (a *SSARAccess) cleanup(now time.Time) {
	a.mu.Lock()
	defer a.mu.Unlock()
	for k, e := range a.cache {
		if !e.expiry.After(now) {
			delete(a.cache, k)
		}
	}
	if len(a.cache) <= accessCacheMaxSize {
		return
	}
	// Evict oldest entries when the cache exceeds the size limit.
	type pair struct {
		key    cacheKey
		expiry time.Time
	}
	all := make([]pair, 0, len(a.cache))
	for k, e := range a.cache {
		all = append(all, pair{k, e.expiry})
	}
	sort.Slice(all, func(i, j int) bool { return all[i].expiry.Before(all[j].expiry) })
	extra := len(all) - accessCacheMaxSize
	for i := 0; i < extra; i++ {
		delete(a.cache, all[i].key)
	}
}
