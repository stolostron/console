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
	"github.com/stolostron/console/backend/internal/informers"
)

const (
	accessCacheTTL      = 60 * time.Second
	accessCleanupEvery  = 90 * time.Second
	prefetchConcurrency = 32
)

var (
	accessCacheMaxTokens          = 1000
	accessCacheMaxEntriesPerToken = 2000
)

// AccessChecker decides whether a user may receive an SSE event.
type AccessChecker interface {
	Allow(ctx context.Context, token string, ev Event) (bool, error)
	Prefetch(ctx context.Context, token string, events []Event)
}

// AllowAllAccess is for tests.
type AllowAllAccess struct{}

func (AllowAllAccess) Allow(context.Context, string, Event) (bool, error) {
	return true, nil
}

func (AllowAllAccess) Prefetch(context.Context, string, []Event) {}

type ssarKey struct {
	verb, group, kind, namespace, name string
}

type cacheEntry struct {
	allowed bool
	expiry  time.Time
}

type inflight struct {
	done    chan struct{}
	allowed bool
	err     error
}

type tokenState struct {
	last        time.Time
	entries     map[ssarKey]cacheEntry
	flight      map[ssarKey]*inflight
	rules       map[string]timedRules
	rulesFlight map[string]*rulesInflight
	kindAccess  map[kindAccessKey]timedKindAccess
	client      kubernetes.Interface
	clientErr   error
	clientWait  chan struct{}
}

type prefetchJob struct {
	key       ssarKey
	group     string
	resource  string
	verb      string
	name      string
	namespace string
}

// SSARAccess ports Node eventFilter / canGetResource (list cluster → SelfSubjectRulesReview → SSAR fallback).
type SSARAccess struct {
	newClient       func(userToken string) (kubernetes.Interface, error)
	isClusterScoped func(kind string) bool

	mu      sync.Mutex
	byToken map[string]*tokenState
}

func NewSSARAccess(base *rest.Config) *SSARAccess {
	return NewSSARAccessWithClient(func(userToken string) (kubernetes.Interface, error) {
		cfg := auth.UserRESTConfig(base, userToken)
		cfg.QPS = 50
		cfg.Burst = 100
		return kubernetes.NewForConfig(cfg)
	})
}

func NewSSARAccessWithClient(newClient func(userToken string) (kubernetes.Interface, error)) *SSARAccess {
	return &SSARAccess{
		byToken:         map[string]*tokenState{},
		newClient:       newClient,
		isClusterScoped: informers.IsClusterScopedKind,
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

// Prefetch warms cluster-scoped list SSARs for distinct kinds so snapshot writes hit cache.
func (a *SSARAccess) Prefetch(ctx context.Context, token string, events []Event) {
	if a == nil || token == "" || len(events) == 0 {
		return
	}
	jobs := map[ssarKey]prefetchJob{}
	for _, ev := range events {
		if ev.Type != TypeModified && ev.Type != "ADDED" {
			continue
		}
		kind, apiVersion, _, _ := objectMeta(ev)
		resource := resourceName(ev)
		if kind == "" || resource == "" {
			continue
		}
		group := apiGroup(apiVersion)
		key := ssarKey{verb: "list", group: group, kind: kind}
		if _, ok := jobs[key]; ok {
			continue
		}
		jobs[key] = prefetchJob{
			key:      key,
			group:    group,
			resource: resource,
			verb:     "list",
		}
	}
	if len(jobs) == 0 {
		return
	}
	sem := make(chan struct{}, prefetchConcurrency)
	var wg sync.WaitGroup
	for _, job := range jobs {
		wg.Add(1)
		go func(j prefetchJob) {
			defer wg.Done()
			select {
			case <-ctx.Done():
				return
			case sem <- struct{}{}:
			}
			defer func() { <-sem }()
			_, _ = a.ssar(ctx, token, j.key, j.group, j.resource, j.verb, j.name, j.namespace)
		}(job)
	}
	wg.Wait()
}

func (a *SSARAccess) canSee(ctx context.Context, token string, ev Event) (bool, error) {
	kind, apiVersion, name, namespace := objectMeta(ev)
	resource := resourceName(ev)
	if resource == "" {
		return false, nil
	}
	group := apiGroup(apiVersion)

	allowed, err := a.ssarListCluster(ctx, token, group, resource, kind)
	if err != nil {
		return false, err
	}
	if allowed {
		return true, nil
	}
	return a.canGetResource(ctx, token, group, resource, kind, name, namespace)
}

func ssarNamespace(kind, name, namespace string) string {
	if kind == "Namespace" {
		return name
	}
	return namespace
}

func (a *SSARAccess) ssarListCluster(ctx context.Context, token, group, resource, kind string) (bool, error) {
	key := ssarKey{verb: "list", group: group, kind: kind}
	return a.ssar(ctx, token, key, group, resource, "list", "", "")
}

func (a *SSARAccess) ssarListNamespaced(ctx context.Context, token, group, resource, kind, namespace string) (bool, error) {
	key := ssarKey{verb: "list", group: group, kind: kind, namespace: namespace}
	return a.ssar(ctx, token, key, group, resource, "list", "", namespace)
}

func (a *SSARAccess) ssarGet(ctx context.Context, token, group, resource, kind, name, namespace string) (bool, error) {
	key := ssarKey{verb: "get", group: group, kind: kind, namespace: namespace, name: name}
	return a.ssar(ctx, token, key, group, resource, "get", name, ssarNamespace(kind, name, namespace))
}

func (a *SSARAccess) incompleteFallback(ctx context.Context, token, group, resource, kind, name, namespace string) (bool, error) {
	if namespace == "" {
		return a.ssarGet(ctx, token, group, resource, kind, name, namespace)
	}
	allowed, err := a.ssarListNamespaced(ctx, token, group, resource, kind, namespace)
	if err != nil {
		return false, err
	}
	if allowed {
		return true, nil
	}
	return a.ssarGet(ctx, token, group, resource, kind, name, namespace)
}

func (a *SSARAccess) ensureTokenLocked(th string) *tokenState {
	st := a.byToken[th]
	if st == nil {
		st = &tokenState{
			entries:     map[ssarKey]cacheEntry{},
			flight:      map[ssarKey]*inflight{},
			rules:       map[string]timedRules{},
			rulesFlight: map[string]*rulesInflight{},
			kindAccess:  map[kindAccessKey]timedKindAccess{},
		}
		a.byToken[th] = st
	}
	if st.entries == nil {
		st.entries = map[ssarKey]cacheEntry{}
	}
	if st.flight == nil {
		st.flight = map[ssarKey]*inflight{}
	}
	if st.rules == nil {
		st.rules = map[string]timedRules{}
	}
	if st.rulesFlight == nil {
		st.rulesFlight = map[string]*rulesInflight{}
	}
	if st.kindAccess == nil {
		st.kindAccess = map[kindAccessKey]timedKindAccess{}
	}
	return st
}

func (a *SSARAccess) clientFor(token, th string) (kubernetes.Interface, error) {
	a.mu.Lock()
	st := a.ensureTokenLocked(th)
	if st.client != nil || st.clientErr != nil {
		c, err := st.client, st.clientErr
		a.mu.Unlock()
		return c, err
	}
	if st.clientWait != nil {
		wait := st.clientWait
		a.mu.Unlock()
		<-wait
		a.mu.Lock()
		st = a.ensureTokenLocked(th)
		c, err := st.client, st.clientErr
		a.mu.Unlock()
		return c, err
	}
	st.clientWait = make(chan struct{})
	wait := st.clientWait
	a.mu.Unlock()

	client, err := a.newClient(token)

	a.mu.Lock()
	st = a.ensureTokenLocked(th)
	st.client = client
	st.clientErr = err
	close(wait)
	st.clientWait = nil
	a.mu.Unlock()
	return client, err
}

func (a *SSARAccess) ssar(ctx context.Context, token string, key ssarKey, group, resource, verb, name, namespace string) (bool, error) {
	now := time.Now()
	th := hashToken(token)
	a.mu.Lock()
	st := a.ensureTokenLocked(th)
	st.last = now
	if e, hit := st.entries[key]; hit && e.expiry.After(now) {
		allowed := e.allowed
		a.mu.Unlock()
		return allowed, nil
	}
	if f, ok := st.flight[key]; ok {
		a.mu.Unlock()
		select {
		case <-f.done:
			return f.allowed, f.err
		case <-ctx.Done():
			return false, ctx.Err()
		}
	}
	f := &inflight{done: make(chan struct{})}
	st.flight[key] = f
	a.mu.Unlock()

	client, err := a.clientFor(token, th)
	if err != nil {
		a.finishFlight(th, key, f, false, err, false)
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
		a.finishFlight(th, key, f, false, err, false)
		return false, err
	}
	allowed := review.Status.Allowed
	a.finishFlight(th, key, f, allowed, nil, true)
	return allowed, nil
}

func (a *SSARAccess) finishFlight(th string, key ssarKey, f *inflight, allowed bool, err error, cache bool) {
	f.allowed = allowed
	f.err = err
	a.mu.Lock()
	if st := a.byToken[th]; st != nil {
		delete(st.flight, key)
		st.last = time.Now()
		if cache && err == nil {
			st.entries[key] = cacheEntry{allowed: allowed, expiry: time.Now().Add(accessCacheTTL)}
			st.enforceEntryCap()
		}
	}
	a.mu.Unlock()
	close(f.done)
}

func (st *tokenState) enforceEntryCap() {
	if len(st.entries) <= accessCacheMaxEntriesPerToken {
		return
	}
	type pair struct {
		key ssarKey
		exp time.Time
	}
	all := make([]pair, 0, len(st.entries))
	for k, e := range st.entries {
		all = append(all, pair{k, e.expiry})
	}
	sort.Slice(all, func(i, j int) bool { return all[i].exp.Before(all[j].exp) })
	extra := len(all) - accessCacheMaxEntriesPerToken
	for i := 0; i < extra; i++ {
		delete(st.entries, all[i].key)
	}
}

func (st *tokenState) empty() bool {
	return len(st.entries) == 0 && len(st.flight) == 0 &&
		len(st.rules) == 0 && len(st.rulesFlight) == 0 && len(st.kindAccess) == 0
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
		st.enforceEntryCap()
		for ns, e := range st.rules {
			if !e.expiry.After(now) {
				delete(st.rules, ns)
			}
		}
		for k, e := range st.kindAccess {
			if !e.expiry.After(now) {
				delete(st.kindAccess, k)
			}
		}
		if st.empty() {
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
