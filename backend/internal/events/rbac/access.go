// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"sync"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/ssarcache"
)

const (
	accessCacheTTL     = 60 * time.Second
	accessCleanupEvery = 90 * time.Second
)

var accessCacheMaxSize = 5000

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

// CanSee always returns true so tests can skip RBAC.
func (AllowAllAccess) CanSee(context.Context, string, *rbacv1.ClusterRole) (bool, error) {
	return true, nil
}

// CanSeeDeleted always returns true so tests can skip RBAC on DELETED events.
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
	// deleteAcks is remaining streams that may still use a remembered role allow.
	deleteAcks map[string]map[string]int
	// activeStreams counts open SSE streams per token hash.
	activeStreams map[string]int
}

// NewSSARAccess builds an AccessChecker that impersonates each user token for ClusterRole SSAR.
func NewSSARAccess(base *rest.Config) *SSARAccess {
	return NewSSARAccessWithClient(func(userToken string) (kubernetes.Interface, error) {
		return kubernetes.NewForConfig(auth.UserRESTConfig(base, userToken))
	})
}

// NewSSARAccessWithClient is like NewSSARAccess but injects the Kubernetes client factory (tests).
func NewSSARAccessWithClient(newClient func(userToken string) (kubernetes.Interface, error)) *SSARAccess {
	return &SSARAccess{
		cache:         map[cacheKey]cacheEntry{},
		allowedRoles:  map[string]map[string]struct{}{},
		deleteAcks:    map[string]map[string]int{},
		activeStreams: map[string]int{},
		newClient:     newClient,
	}
}

// CanSee reports whether the user may see the ClusterRole (list, else get).
func (a *SSARAccess) CanSee(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error) {
	return a.decide(ctx, userToken, role, false)
}

// CanSeeDeleted is CanSee for DELETED events, reusing a remembered get-allow when the role is gone.
func (a *SSARAccess) CanSeeDeleted(ctx context.Context, userToken string, role *rbacv1.ClusterRole) (bool, error) {
	return a.decide(ctx, userToken, role, true)
}

// decide runs list SSAR then get SSAR; when deleted, falls back to a remembered allow.
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
		if deleted && apierrors.IsNotFound(err) && a.takeDeletedRole(userToken, role.Name) {
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
	if deleted && a.takeDeletedRole(userToken, role.Name) {
		return true, nil
	}
	a.forgetRole(userToken, role.Name)
	return false, nil
}

// rememberRole records a get-allow so a later DELETED can still pass when the role is gone.
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
	if acks := a.deleteAcks[th]; acks != nil {
		delete(acks, name)
		if len(acks) == 0 {
			delete(a.deleteAcks, th)
		}
	}
}

// forgetRole drops a remembered get-allow and any in-flight DELETED ack for the role.
func (a *SSARAccess) forgetRole(userToken, name string) {
	th := hashToken(userToken)
	a.mu.Lock()
	defer a.mu.Unlock()
	names := a.allowedRoles[th]
	if names != nil {
		delete(names, name)
		if len(names) == 0 {
			delete(a.allowedRoles, th)
		}
	}
	if acks := a.deleteAcks[th]; acks != nil {
		delete(acks, name)
		if len(acks) == 0 {
			delete(a.deleteAcks, th)
		}
	}
}

// roleWasAllowed reports whether a get-allow was remembered for this token and role name.
func (a *SSARAccess) roleWasAllowed(userToken, name string) bool {
	a.mu.Lock()
	defer a.mu.Unlock()
	_, ok := a.allowedRoles[hashToken(userToken)][name]
	return ok
}

// takeDeletedRole lets each active stream use a remembered allow once for a DELETED
// fallback. The role stays until every stream has taken it (or EndStream clears state).
func (a *SSARAccess) takeDeletedRole(userToken, name string) bool {
	th := hashToken(userToken)
	a.mu.Lock()
	defer a.mu.Unlock()
	names := a.allowedRoles[th]
	if names == nil {
		return false
	}
	if _, ok := names[name]; !ok {
		return false
	}
	if a.deleteAcks == nil {
		a.deleteAcks = map[string]map[string]int{}
	}
	acks := a.deleteAcks[th]
	if acks == nil {
		acks = map[string]int{}
		a.deleteAcks[th] = acks
	}
	remaining, tracking := acks[name]
	if !tracking {
		remaining = a.activeStreams[th]
		if remaining < 1 {
			remaining = 1
		}
	}
	remaining--
	if remaining <= 0 {
		delete(names, name)
		delete(acks, name)
		if len(names) == 0 {
			delete(a.allowedRoles, th)
		}
		if len(acks) == 0 {
			delete(a.deleteAcks, th)
		}
		return true
	}
	acks[name] = remaining
	return true
}

// BeginStream records an open SSE stream so DELETED allow acks know how many clients remain.
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

// EndStream decrements the stream count and clears remembered allows when the last stream closes.
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
		delete(a.deleteAcks, th)
		return
	}
	a.activeStreams[th] = n - 1
}

// hashToken maps a bearer token to a stable cache key so raw tokens are not stored as map keys.
func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// ssar runs a cached SelfSubjectAccessReview for clusterroles with the given verb and optional name.
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
// The returned channel is closed when the cleanup goroutine exits.
func (a *SSARAccess) StartCleanup(ctx context.Context) <-chan struct{} {
	return ssarcache.StartIf(ctx, accessCleanupEvery, a.cleanup, a != nil)
}

// cleanup expires SSAR cache entries and evicts oldest keys when the cache exceeds accessCacheMaxSize.
func (a *SSARAccess) cleanup(now time.Time) {
	a.mu.Lock()
	defer a.mu.Unlock()
	ssarcache.ExpireIf(a.cache, func(e cacheEntry) bool { return !e.expiry.After(now) })
	if len(a.cache) <= accessCacheMaxSize {
		return
	}
	items := make([]ssarcache.Timed[cacheKey], 0, len(a.cache))
	for k, e := range a.cache {
		items = append(items, ssarcache.Timed[cacheKey]{Key: k, Time: e.expiry})
	}
	ssarcache.EvictOldest(len(a.cache), accessCacheMaxSize, items, func(k cacheKey) {
		delete(a.cache, k)
	}, nil)
}
