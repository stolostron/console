// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"sort"
	"sync"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
)

const (
	accessCacheTTL     = 60 * time.Second
	accessCleanupEvery = 90 * time.Second
)

var accessCacheMaxTokens = 1000

// AccessChecker decides whether a user may receive an SSE event.
type AccessChecker interface {
	Allow(ctx context.Context, token string, ev Event) (bool, error)
}

// AllowAllAccess is for tests.
type AllowAllAccess struct{}

func (AllowAllAccess) Allow(context.Context, string, Event) (bool, error) {
	return true, nil
}

type ssarKey struct {
	kind, namespace, name string
}

type cacheEntry struct {
	allowed bool
	expiry  time.Time
}

type tokenState struct {
	last    time.Time
	entries map[ssarKey]cacheEntry
}

// SSARAccess ports Node eventFilter / canAccess (list cluster → list namespaced → get).
type SSARAccess struct {
	newClient func(userToken string) (kubernetes.Interface, error)

	mu      sync.Mutex
	byToken map[string]*tokenState
}

func NewSSARAccess(base *rest.Config) *SSARAccess {
	return NewSSARAccessWithClient(func(userToken string) (kubernetes.Interface, error) {
		return kubernetes.NewForConfig(auth.UserRESTConfig(base, userToken))
	})
}

func NewSSARAccessWithClient(newClient func(userToken string) (kubernetes.Interface, error)) *SSARAccess {
	return &SSARAccess{
		byToken:   map[string]*tokenState{},
		newClient: newClient,
	}
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func apiGroup(apiVersion string) string {
	gv, err := schema.ParseGroupVersion(apiVersion)
	if err != nil {
		return ""
	}
	return gv.Group
}

func objectMeta(ev Event) (kind, apiVersion, name, namespace string) {
	if ev.Object == nil {
		return "", "", "", ""
	}
	kind, _ = ev.Object["kind"].(string)
	apiVersion, _ = ev.Object["apiVersion"].(string)
	meta, _ := ev.Object["metadata"].(map[string]any)
	if meta == nil {
		return kind, apiVersion, "", ""
	}
	name, _ = meta["name"].(string)
	namespace, _ = meta["namespace"].(string)
	return kind, apiVersion, name, namespace
}

func resourceName(ev Event) string {
	if ev.GVR.Resource != "" {
		return ev.GVR.Resource
	}
	return ""
}

func (a *SSARAccess) Allow(ctx context.Context, token string, ev Event) (bool, error) {
	switch ev.Type {
	case TypeStart, TypeEOP, TypeLoaded, TypeSettings:
		return true, nil
	case TypeDeleted:
		// Bug-compatible with Node: DELETED is sent to every client without SSAR.
		// Namespace deletes make a follow-up access check fail. Track for a later fix.
		return true, nil
	case TypeModified, "ADDED":
		return a.canSee(ctx, token, ev)
	default:
		return false, nil
	}
}

func (a *SSARAccess) canSee(ctx context.Context, token string, ev Event) (bool, error) {
	kind, apiVersion, name, namespace := objectMeta(ev)
	resource := resourceName(ev)
	if resource == "" {
		return false, nil
	}
	group := apiGroup(apiVersion)

	allowed, err := a.ssar(ctx, token, ssarKey{kind: kind}, group, resource, "list", "", "")
	if err != nil {
		return false, err
	}
	if allowed {
		return true, nil
	}
	if namespace == "" {
		return a.ssar(ctx, token, ssarKey{kind: kind, name: name}, group, resource, "get", name, ssarNamespace(kind, name, namespace))
	}
	allowed, err = a.ssar(ctx, token, ssarKey{kind: kind, namespace: namespace}, group, resource, "list", "", namespace)
	if err != nil {
		return false, err
	}
	if allowed {
		return true, nil
	}
	return a.ssar(ctx, token, ssarKey{kind: kind, namespace: namespace, name: name}, group, resource, "get", name, ssarNamespace(kind, name, namespace))
}

func ssarNamespace(kind, name, namespace string) string {
	if kind == "Namespace" {
		return name
	}
	return namespace
}

func (a *SSARAccess) ssar(ctx context.Context, token string, key ssarKey, group, resource, verb, name, namespace string) (bool, error) {
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
				Group:     group,
				Resource:  resource,
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

func (a *SSARAccess) tokenCount() int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return len(a.byToken)
}
