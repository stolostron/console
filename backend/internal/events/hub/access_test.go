// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
	ktesting "k8s.io/client-go/testing"
)

func modifiedNS(name string) Event {
	return Event{
		Type: TypeModified,
		GVR:  schema.GroupVersionResource{Version: "v1", Resource: "namespaces"},
		Object: map[string]any{
			"kind":       "Namespace",
			"apiVersion": "v1",
			"metadata":   map[string]any{"name": name},
		},
	}
}

func TestAllowControlAndDeleted(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		t.Fatal("SSAR should not run")
		return nil, nil
	})
	for _, typ := range []string{TypeStart, TypeEOP, TypeLoaded, TypeSettings, TypeDeleted} {
		ok, err := a.Allow(context.Background(), "tok", Event{Type: typ})
		if err != nil || !ok {
			t.Fatalf("%s allowed=%v err=%v", typ, ok, err)
		}
	}
}

func incompletePodRules() authzv1.SubjectRulesReviewStatus {
	return authzv1.SubjectRulesReviewStatus{
		Incomplete: true,
		ResourceRules: []authzv1.ResourceRule{{
			Verbs:     []string{"get"},
			APIGroups: []string{""},
			Resources: []string{"pods"},
		}},
	}
}

func attachIncompleteRules(client *fake.Clientset) {
	client.PrependReactor("create", "selfsubjectrulesreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: incompletePodRules()}, nil
	})
}

func TestSSARCascadeListThenGetNamespace(t *testing.T) {
	var verbs []string
	var namespaces []string
	client := fake.NewSimpleClientset()
	attachIncompleteRules(client)
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		create := action.(ktesting.CreateAction)
		review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
		attr := review.Spec.ResourceAttributes
		verbs = append(verbs, attr.Verb)
		namespaces = append(namespaces, attr.Namespace)
		allowed := attr.Verb == "get"
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.Allow(context.Background(), "tok", modifiedNS("default"))
	if err != nil || !ok {
		t.Fatalf("allowed=%v err=%v", ok, err)
	}
	if len(verbs) < 2 || verbs[0] != "list" || verbs[1] != "get" {
		t.Fatalf("verbs %v", verbs)
	}
	if namespaces[1] != "default" {
		t.Fatalf("Namespace SSAR namespace must be the object name, got %q", namespaces[1])
	}
}

func TestSSARNamespacedListThenGet(t *testing.T) {
	var verbs []string
	var namespaces []string
	var names []string
	client := fake.NewSimpleClientset()
	attachIncompleteRules(client)
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		create := action.(ktesting.CreateAction)
		review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
		attr := review.Spec.ResourceAttributes
		verbs = append(verbs, attr.Verb)
		namespaces = append(namespaces, attr.Namespace)
		names = append(names, attr.Name)
		allowed := attr.Verb == "get"
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ev := Event{
		Type: TypeModified,
		GVR:  schema.GroupVersionResource{Version: "v1", Resource: "secrets"},
		Object: map[string]any{
			"kind": "Secret", "apiVersion": "v1",
			"metadata": map[string]any{"name": "creds", "namespace": "ns"},
		},
	}
	ok, err := a.Allow(context.Background(), "tok", ev)
	if err != nil || !ok {
		t.Fatalf("allowed=%v err=%v", ok, err)
	}
	if len(verbs) != 3 || verbs[0] != "list" || verbs[1] != "list" || verbs[2] != "get" {
		t.Fatalf("verbs %v", verbs)
	}
	if namespaces[0] != "" || namespaces[1] != "ns" || names[2] != "creds" {
		t.Fatalf("ns=%v names=%v", namespaces, names)
	}
}

func TestSSARCacheTTL(t *testing.T) {
	var n int
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		n++
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ev := modifiedNS("default")
	if _, err := a.Allow(context.Background(), "tok", ev); err != nil {
		t.Fatal(err)
	}
	if _, err := a.Allow(context.Background(), "tok", ev); err != nil {
		t.Fatal(err)
	}
	if n != 1 {
		t.Fatalf("SSAR calls %d want 1 (cached)", n)
	}
}

func TestSSARCleanupExpiresAndMaxTokens(t *testing.T) {
	orig := accessCacheMaxTokens
	accessCacheMaxTokens = 2
	t.Cleanup(func() { accessCacheMaxTokens = orig })

	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ev := modifiedNS("default")
	for _, tok := range []string{"a", "b", "c"} {
		if _, err := a.Allow(context.Background(), tok, ev); err != nil {
			t.Fatal(err)
		}
	}
	a.cleanup(time.Now())
	if a.tokenCount() != 2 {
		t.Fatalf("tokens %d want 2", a.tokenCount())
	}

	a.mu.Lock()
	for _, st := range a.byToken {
		for k, e := range st.entries {
			e.expiry = time.Now().Add(-time.Second)
			st.entries[k] = e
		}
	}
	a.mu.Unlock()
	a.cleanup(time.Now())
	if a.tokenCount() != 0 {
		t.Fatalf("expired tokens left %d", a.tokenCount())
	}
}

func TestSSARReusesClientPerToken(t *testing.T) {
	var n int
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		n++
		return client, nil
	})
	kinds := []string{"Namespace", "Secret", "ConfigMap"}
	for _, kind := range kinds {
		ev := Event{
			Type: TypeModified,
			GVR:  schema.GroupVersionResource{Version: "v1", Resource: "namespaces"},
			Object: map[string]any{
				"kind": kind, "apiVersion": "v1",
				"metadata": map[string]any{"name": "x"},
			},
		}
		if _, err := a.Allow(context.Background(), "tok", ev); err != nil {
			t.Fatal(err)
		}
	}
	if n != 1 {
		t.Fatalf("newClient calls %d want 1", n)
	}
}

func TestPrefetchParallelKindList(t *testing.T) {
	const kinds = 8
	const delay = 40 * time.Millisecond
	var mu sync.Mutex
	var calls, inFlight, maxFlight int
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		calls++
		inFlight++
		if inFlight > maxFlight {
			maxFlight = inFlight
		}
		mu.Unlock()
		time.Sleep(delay)
		mu.Lock()
		inFlight--
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(&authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
		})
	}))
	t.Cleanup(ts.Close)
	cfg := &rest.Config{
		Host:            ts.URL,
		TLSClientConfig: rest.TLSClientConfig{Insecure: true},
		QPS:             100,
		Burst:           100,
	}
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return kubernetes.NewForConfig(cfg)
	})
	events := make([]Event, 0, kinds)
	for i := 0; i < kinds; i++ {
		kind := "Kind" + string(rune('A'+i))
		events = append(events, Event{
			Type: TypeModified,
			GVR:  schema.GroupVersionResource{Version: "v1", Resource: "namespaces"},
			Object: map[string]any{
				"kind": kind, "apiVersion": "v1",
				"metadata": map[string]any{"name": "n"},
			},
		})
	}
	start := time.Now()
	a.Prefetch(context.Background(), "tok", events)
	elapsed := time.Since(start)
	if elapsed >= time.Duration(kinds)*delay {
		t.Fatalf("prefetch took %s; want parallel ~%s not serial %s", elapsed, delay, time.Duration(kinds)*delay)
	}
	mu.Lock()
	got, peak := calls, maxFlight
	mu.Unlock()
	if got != kinds {
		t.Fatalf("SSAR calls %d want %d", got, kinds)
	}
	if peak < 4 {
		t.Fatalf("max in-flight %d want concurrent", peak)
	}
	for _, ev := range events {
		if _, err := a.Allow(context.Background(), "tok", ev); err != nil {
			t.Fatal(err)
		}
	}
	mu.Lock()
	got = calls
	mu.Unlock()
	if got != kinds {
		t.Fatalf("after Allow SSAR calls %d want cached %d", got, kinds)
	}
}

func TestPrefetchSkipsDeleted(t *testing.T) {
	var n int
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		n++
		return fake.NewSimpleClientset(), nil
	})
	a.Prefetch(context.Background(), "tok", []Event{
		{Type: TypeDeleted, GVR: schema.GroupVersionResource{Version: "v1", Resource: "namespaces"}, Object: map[string]any{
			"kind": "Namespace", "apiVersion": "v1", "metadata": map[string]any{"name": "x"},
		}},
		{Type: TypeStart},
		{Type: TypeLoaded},
	})
	if n != 0 {
		t.Fatalf("prefetch client %d", n)
	}
}

func TestAllowUnknownTypeDenied(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	ok, err := a.Allow(context.Background(), "tok", Event{Type: "NOPE"})
	if err != nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestSSARPerTokenEntryCap(t *testing.T) {
	orig := accessCacheMaxEntriesPerToken
	accessCacheMaxEntriesPerToken = 3
	t.Cleanup(func() { accessCacheMaxEntriesPerToken = orig })

	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	th := hashToken("cap-token")
	a.mu.Lock()
	st := a.ensureTokenLocked(th)
	now := time.Now().Add(time.Hour)
	for i := 0; i < 5; i++ {
		st.entries[ssarKey{name: string(rune('a' + i))}] = cacheEntry{
			allowed: false,
			expiry:  now.Add(time.Duration(i) * time.Second),
		}
	}
	st.enforceEntryCap()
	n := len(st.entries)
	a.mu.Unlock()
	if n != 3 {
		t.Fatalf("entries %d want 3", n)
	}
}

func TestAccessCacheHashesToken(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	const raw = "raw-jwt-token"
	if _, err := a.Allow(context.Background(), raw, modifiedNS("default")); err != nil {
		t.Fatal(err)
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	if _, ok := a.byToken[raw]; ok {
		t.Fatal("raw token must not be a cache key")
	}
	if _, ok := a.byToken[hashToken(raw)]; !ok {
		t.Fatal("expected hashed token key")
	}
}
