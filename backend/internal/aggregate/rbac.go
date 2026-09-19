// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"sort"
	"sync"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
)

const (
	accessCacheTTL       = 60 * time.Second
	accessCleanupEvery   = 90 * time.Second
	accessCacheMaxTokens = 1000
)

// Access filters aggregated rows with SSAR (and ManagedClusterView create for remote apps).
type Access interface {
	Authorized(ctx context.Context, token string, items []App, start, stop int) []App
}

// AllowAll is for tests.
type AllowAll struct{}

func (AllowAll) Authorized(_ context.Context, _ string, items []App, start, stop int) []App {
	if start < 0 {
		start = 0
	}
	if stop > len(items) {
		stop = len(items)
	}
	if start > stop {
		return nil
	}
	return items[start:stop]
}

type ssarKey struct {
	kind, namespace, name, verb string
}

type cacheEntry struct {
	allowed bool
	expiry  time.Time
}

type tokenState struct {
	last    time.Time
	entries map[ssarKey]cacheEntry
}

// SSARAccess ports Node getAuthorizedResources / canAccess.
type SSARAccess struct {
	newClient func(userToken string) (kubernetes.Interface, error)
	mu        sync.Mutex
	byToken   map[string]*tokenState
}

// NewSSARAccess builds a user-token SSAR client.
func NewSSARAccess(base *rest.Config) *SSARAccess {
	return NewSSARAccessWithClient(func(userToken string) (kubernetes.Interface, error) {
		return kubernetes.NewForConfig(auth.UserRESTConfig(base, userToken))
	})
}

// NewSSARAccessWithClient is for tests.
func NewSSARAccessWithClient(newClient func(userToken string) (kubernetes.Interface, error)) *SSARAccess {
	return &SSARAccess{byToken: map[string]*tokenState{}, newClient: newClient}
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (a *SSARAccess) Authorized(ctx context.Context, token string, items []App, start, stop int) []App {
	authorized := make([]App, 0, stop-start)
	inx := 0
	chunkSize := 50
	if stop > 100 {
		chunkSize = 100
	}
	for inx < len(items) && len(authorized) < stop {
		end := inx + chunkSize
		if end > len(items) {
			end = len(items)
		}
		for _, item := range items[inx:end] {
			ok := false
			var err error
			if len(item.RemoteClusters) > 0 {
				ok, err = a.canAccessRemote(ctx, token, item.RemoteClusters)
			} else {
				ok, err = a.canList(ctx, token, item.Object)
			}
			if err == nil && ok {
				authorized = append(authorized, item)
			}
		}
		inx += chunkSize
	}
	if start < 0 {
		start = 0
	}
	if stop > len(authorized) {
		stop = len(authorized)
	}
	if start > stop {
		return nil
	}
	return authorized[start:stop]
}

func (a *SSARAccess) canList(ctx context.Context, token string, obj map[string]any) (bool, error) {
	ok, err := a.ssar(ctx, token, obj, "list", "", "")
	if err != nil || ok {
		return ok, err
	}
	ns := metaNamespace(obj)
	if ns == "" {
		return false, nil
	}
	return a.ssar(ctx, token, obj, "list", "", ns)
}

func (a *SSARAccess) canAccessRemote(ctx context.Context, token string, clusters []string) (bool, error) {
	for _, ns := range clusters {
		view := map[string]any{
			"kind":       "ManagedClusterView",
			"apiVersion": "view.open-cluster-management.io/v1beta1",
			"metadata":   map[string]any{"namespace": ns},
		}
		ok, err := a.ssar(ctx, token, view, "create", "", ns)
		if err == nil && ok {
			return true, nil
		}
	}
	return false, nil
}

func (a *SSARAccess) ssar(ctx context.Context, token string, obj map[string]any, verb, name, namespace string) (bool, error) {
	kind := kindOf(obj)
	key := ssarKey{kind: kind, namespace: namespace, name: name, verb: verb}
	now := time.Now()
	th := hashToken(token)
	a.mu.Lock()
	if st, ok := a.byToken[th]; ok {
		if e, hit := st.entries[key]; hit && e.expiry.After(now) {
			st.last = now
			allowed := e.allowed
			a.mu.Unlock()
			return allowed, nil
		}
	}
	a.mu.Unlock()

	client, err := a.newClient(token)
	if err != nil {
		return false, err
	}
	review, err := client.AuthorizationV1().SelfSubjectAccessReviews().Create(ctx, &authzv1.SelfSubjectAccessReview{
		Spec: authzv1.SelfSubjectAccessReviewSpec{
			ResourceAttributes: &authzv1.ResourceAttributes{
				Group:     apiGroup(apiVersionOf(obj)),
				Resource:  resourcePlural(kind),
				Verb:      verb,
				Name:      name,
				Namespace: namespace,
			},
		},
	}, metav1.CreateOptions{})
	if err != nil {
		return false, err
	}
	allowed := review.Status.Allowed
	a.mu.Lock()
	st := a.byToken[th]
	if st == nil {
		st = &tokenState{entries: map[ssarKey]cacheEntry{}}
		a.byToken[th] = st
	}
	st.last = now
	st.entries[key] = cacheEntry{allowed: allowed, expiry: now.Add(accessCacheTTL)}
	a.mu.Unlock()
	return allowed, nil
}

// StartCleanup expires SSAR cache entries.
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
	for th, st := range a.byToken {
		for k, e := range st.entries {
			if !e.expiry.After(now) {
				delete(st.entries, k)
			}
		}
		if len(st.entries) == 0 {
			delete(a.byToken, th)
		}
	}
	if len(a.byToken) <= accessCacheMaxTokens {
		return
	}
	type pair struct {
		hash string
		last time.Time
	}
	all := make([]pair, 0, len(a.byToken))
	for h, st := range a.byToken {
		all = append(all, pair{h, st.last})
	}
	sort.Slice(all, func(i, j int) bool { return all[i].last.Before(all[j].last) })
	extra := len(all) - accessCacheMaxTokens
	for i := 0; i < extra; i++ {
		delete(a.byToken, all[i].hash)
	}
}
