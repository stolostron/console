// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
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

func TestAllowControlEvents(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		t.Fatal("SSAR should not run")
		return nil, nil
	})
	for _, typ := range []string{TypeStart, TypeEOP, TypeLoaded, TypeSettings} {
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
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
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
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
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

func TestSSARCacheSeparatesSameKindDifferentGroups(t *testing.T) {
	var mu sync.Mutex
	var groups []string
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			attr := review.Spec.ResourceAttributes
			mu.Lock()
			groups = append(groups, attr.Group)
			mu.Unlock()
			allowed := attr.Group == "apps.open-cluster-management.io" && attr.Verb == "list" && attr.Namespace == ""
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	subscription := func(apiVersion, group, resource string) Event {
		return Event{
			Type: TypeModified,
			GVR:  schema.GroupVersionResource{Group: group, Version: "v1", Resource: resource},
			Object: map[string]any{
				"kind":       "Subscription",
				"apiVersion": apiVersion,
				"metadata":   map[string]any{"name": "app", "namespace": "ns"},
			},
		}
	}
	ok, err := a.Allow(context.Background(), "tok", subscription(
		"apps.open-cluster-management.io/v1", "apps.open-cluster-management.io", "subscriptions",
	))
	if err != nil || !ok {
		t.Fatalf("acm allowed=%v err=%v", ok, err)
	}
	ok, err = a.Allow(context.Background(), "tok", subscription(
		"operators.coreos.com/v1alpha1", "operators.coreos.com", "subscriptions",
	))
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Fatal("OLM Subscription reused the ACM list decision")
	}
	mu.Lock()
	defer mu.Unlock()
	sawOLM := false
	for _, group := range groups {
		if group == "operators.coreos.com" {
			sawOLM = true
		}
	}
	if !sawOLM {
		t.Fatalf("groups %v", groups)
	}
}

func TestSSARCacheTTL(t *testing.T) {
	var n int
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
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
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
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
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
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
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
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

func secretEvent(typ, name, namespace string) Event {
	return Event{
		Type: typ,
		GVR:  schema.GroupVersionResource{Version: "v1", Resource: "secrets"},
		Object: map[string]any{
			"kind": "Secret", "apiVersion": "v1",
			"metadata": map[string]any{"name": name, "namespace": namespace},
		},
	}
}

func clearReviewCache(a *SSARAccess, token string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	st := a.byToken[hashToken(token)]
	if st == nil {
		return
	}
	st.entries = map[ssarKey]cacheEntry{}
	st.rules = map[string]timedRules{}
	st.kindAccess = map[kindAccessKey]timedKindAccess{}
}

func TestDeletedDeniedWithoutHistory(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: emptyRules()}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || ok {
		t.Fatalf("allowed=%v err=%v", ok, err)
	}
}

func TestDeletedAllowedByClusterList(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: attr.Verb == "list" && attr.Namespace == ""},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("allowed=%v err=%v", ok, err)
	}
	key, _ := objectSeenKey("", "secrets", "ns", "creds")
	if a.wasAllowed("tok", key) {
		t.Fatal("cluster list allow must not be remembered")
	}
}

func TestClusterListAllowDoesNotCoverLaterDelete(t *testing.T) {
	listOK := true
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: emptyRules()}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			allowed := listOK && attr.Verb == "list" && attr.Namespace == ""
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("modified allowed=%v err=%v", ok, err)
	}
	key, _ := objectSeenKey("", "secrets", "ns", "creds")
	if a.wasAllowed("tok", key) {
		t.Fatal("cluster list allow must not be remembered")
	}
	clearReviewCache(a, "tok")
	listOK = false
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || ok {
		t.Fatalf("deleted allowed=%v err=%v", ok, err)
	}
}

func TestDeletedFallsBackWhenReviewDenies(t *testing.T) {
	rules := secretGetRules()
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: rules}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("modified allowed=%v err=%v", ok, err)
	}
	key, keyed := objectSeenKey("", "secrets", "ns", "creds")
	if !keyed || !a.wasAllowed("tok", key) {
		t.Fatal("expected remembered namespaced allow")
	}
	clearReviewCache(a, "tok")
	rules = emptyRules()
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("deleted allowed=%v err=%v", ok, err)
	}
	if a.wasAllowed("tok", key) {
		t.Fatal("single-stream delete should drop the remembered allow")
	}
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || ok {
		t.Fatalf("second deleted allowed=%v err=%v", ok, err)
	}
}

func TestDeletedFallbackSharedAcrossStreams(t *testing.T) {
	rules := secretGetRules()
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: rules}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(ktesting.Action) (bool, runtime.Object, error) {
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	a.BeginStream("tok")
	a.BeginStream("tok")
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("modified allowed=%v err=%v", ok, err)
	}
	key, _ := objectSeenKey("", "secrets", "ns", "creds")
	clearReviewCache(a, "tok")
	rules = emptyRules()
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("first stream deleted allowed=%v err=%v", ok, err)
	}
	if !a.wasAllowed("tok", key) {
		t.Fatal("remembered allow must remain for the other active stream")
	}
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("second stream deleted allowed=%v err=%v", ok, err)
	}
	if a.wasAllowed("tok", key) {
		t.Fatal("allow should clear after every active stream consumed the delete")
	}
}

func TestDeletedNotFoundUsesRememberedAllow(t *testing.T) {
	rules := secretGetRules()
	notFound := false
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: rules}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			if notFound && attr.Namespace != "" {
				return true, nil, apierrors.NewNotFound(schema.GroupResource{Resource: "namespaces"}, attr.Namespace)
			}
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("modified allowed=%v err=%v", ok, err)
	}
	clearReviewCache(a, "tok")
	rules = incompletePodRules()
	notFound = true
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("deleted allowed=%v err=%v", ok, err)
	}
	key, _ := objectSeenKey("", "secrets", "ns", "creds")
	if a.wasAllowed("tok", key) {
		t.Fatal("delete should drop the remembered allow")
	}
}

func TestDeletedClusterListErrorKeepsRememberedAllow(t *testing.T) {
	rules := secretGetRules()
	failList := false
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: rules}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			if failList && attr.Verb == "list" && attr.Namespace == "" {
				return true, nil, errors.New("apiserver down")
			}
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if _, err := a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns")); err != nil {
		t.Fatal(err)
	}
	clearReviewCache(a, "tok")
	failList = true
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err == nil || ok {
		t.Fatalf("allowed=%v err=%v", ok, err)
	}
	key, _ := objectSeenKey("", "secrets", "ns", "creds")
	if !a.wasAllowed("tok", key) {
		t.Fatal("unrelated error must keep the remembered allow")
	}
}

func TestEndStreamClearsRememberedAllows(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: secretGetRules()}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	a.BeginStream("tok")
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("modified allowed=%v err=%v", ok, err)
	}
	key, _ := objectSeenKey("", "secrets", "ns", "creds")
	if !a.wasAllowed("tok", key) {
		t.Fatal("expected remembered allow while stream is open")
	}
	a.BeginStream("tok")
	a.EndStream("tok")
	if !a.wasAllowed("tok", key) {
		t.Fatal("remembered allow must survive while another stream is open")
	}
	a.EndStream("tok")
	if a.wasAllowed("tok", key) {
		t.Fatal("last EndStream must clear remembered allows")
	}
}

func TestModifiedDenyClearsDeletedFallback(t *testing.T) {
	rules := secretGetRules()
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectRulesReview{Status: rules}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns"))
	if err != nil || !ok {
		t.Fatalf("modified allowed=%v err=%v", ok, err)
	}
	clearReviewCache(a, "tok")
	rules = emptyRules()
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeModified, "creds", "ns"))
	if err != nil || ok {
		t.Fatalf("revoke allowed=%v err=%v", ok, err)
	}
	key, _ := objectSeenKey("", "secrets", "ns", "creds")
	if a.wasAllowed("tok", key) {
		t.Fatal("deny should drop the remembered allow")
	}
	ok, err = a.Allow(context.Background(), "tok", secretEvent(TypeDeleted, "creds", "ns"))
	if err != nil || ok {
		t.Fatalf("deleted allowed=%v err=%v", ok, err)
	}
}

func TestAllowAllAccessPrefetchNoOp(t *testing.T) {
	var a AllowAllAccess
	a.Prefetch(context.Background(), "tok", []Event{modifiedNS("default")})
}

func TestNewSSARAccess(t *testing.T) {
	a := NewSSARAccess(&rest.Config{
		Host:            "https://example.invalid",
		TLSClientConfig: rest.TLSClientConfig{Insecure: true},
	})
	if a == nil || a.newClient == nil {
		t.Fatal("expected client factory")
	}
}

func TestObjectMetaAndResourceNameHelpers(t *testing.T) {
	if apiGroup("not-a-version") != "" {
		t.Fatal("invalid apiVersion")
	}
	if apiGroup("apps/v1") != "apps" {
		t.Fatal("apiGroup")
	}
	kind, ver, name, ns := objectMeta(Event{Object: map[string]any{
		"kind": "Pod", "apiVersion": "v1",
		"metadata": map[string]any{"name": "p", "namespace": "ns"},
	}})
	if kind != "Pod" || ver != "v1" || name != "p" || ns != "ns" {
		t.Fatalf("meta %s %s %s %s", kind, ver, name, ns)
	}
	kind, _, name, ns = objectMeta(Event{Object: map[string]any{"kind": "Pod"}})
	if kind != "Pod" || name != "" || ns != "" {
		t.Fatalf("kind-only meta kind=%q name=%q ns=%q", kind, name, ns)
	}
	if resourceName(Event{GVR: schema.GroupVersionResource{Resource: "pods"}}) != "pods" {
		t.Fatal("resourceName")
	}
	if resourceName(Event{}) != "" {
		t.Fatal("empty resource")
	}
}

func TestIncompleteFallbackNamespacedListThenGet(t *testing.T) {
	var verbs []string
	client := fake.NewSimpleClientset()
	attachIncompleteRules(client)
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			attr := review.Spec.ResourceAttributes
			verbs = append(verbs, attr.Verb)
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
			"metadata": map[string]any{"name": "s", "namespace": "ns"},
		},
	}
	ok, err := a.Allow(context.Background(), "tok", ev)
	if err != nil || !ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
	if len(verbs) < 2 {
		t.Fatalf("verbs %v", verbs)
	}
}

func TestEnsureTokenLockedRepairsNilMaps(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	th := hashToken("tok")
	a.mu.Lock()
	a.byToken[th] = &tokenState{}
	a.mu.Unlock()
	a.mu.Lock()
	st := a.ensureTokenLocked(th)
	a.mu.Unlock()
	if st.entries == nil || st.flight == nil || st.rules == nil {
		t.Fatal("expected maps initialized")
	}
}

func TestSSARAccessStartCleanup(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	ctx, cancel := context.WithCancel(context.Background())
	a.StartCleanup(ctx)
	cancel()
	var nilAccess *SSARAccess
	nilAccess.StartCleanup(ctx)
}

func TestPrefetchEmptyInputs(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		t.Fatal("unexpected client")
		return nil, nil
	})
	a.Prefetch(context.Background(), "", nil)
	a.Prefetch(context.Background(), "tok", []Event{{Type: TypeDeleted}})
}
