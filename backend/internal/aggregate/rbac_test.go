// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
	ktesting "k8s.io/client-go/testing"
)

func TestAllowAllAuthorizedBounds(t *testing.T) {
	items := []App{{Transform: Transform{Name: "a"}}, {Transform: Transform{Name: "b"}}, {Transform: Transform{Name: "c"}}}
	if got := (AllowAll{}).Authorized(context.Background(), "", items, -1, 2); len(got) != 2 {
		t.Fatalf("negative start %+v", got)
	}
	if got := (AllowAll{}).Authorized(context.Background(), "", items, 5, 3); got != nil {
		t.Fatalf("start>stop %+v", got)
	}
}

func TestNewSSARAccess(t *testing.T) {
	a := NewSSARAccess(&rest.Config{Host: "http://127.0.0.1:1"})
	if a == nil || a.newClient == nil {
		t.Fatal("constructor")
	}
	if _, err := a.newClient("tok"); err != nil {
		t.Fatalf("newClient: %v", err)
	}
}

func TestStartCleanupNilReceiver(t *testing.T) {
	var a *SSARAccess
	a.StartCleanup(context.Background())
}

func TestCanListClusterScopedOnly(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	obj := map[string]any{
		"kind": "ClusterRole", "apiVersion": "rbac.authorization.k8s.io/v1",
		"metadata": map[string]any{"name": "view"},
	}
	ok, err := a.canList(context.Background(), "tok", obj)
	if err != nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestCanAccessRemoteAllDenied(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.canAccessRemote(context.Background(), "tok", []string{"c1"})
	if err != nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestSSARAuthorizedWindowPastEnd(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	items := []App{{Object: map[string]any{
		"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
		"metadata": map[string]any{"name": "a", "namespace": "ns"},
	}}}
	if got := a.Authorized(context.Background(), "tok", items, 5, 3); got != nil {
		t.Fatalf("%+v", got)
	}
}

func TestClientForSecondWaiter(t *testing.T) {
	release := make(chan struct{})
	client := fake.NewSimpleClientset()
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		<-release
		return client, nil
	})
	th := hashToken("tok")
	go func() {
		_, _ = a.clientFor("tok", th)
	}()
	time.Sleep(10 * time.Millisecond)
	close(release)
	got, err := a.clientFor("tok", th)
	if err != nil || got == nil {
		t.Fatalf("clientFor waiter: %v", err)
	}
}

func TestAllowAllWindow(t *testing.T) {
	items := []App{{Transform: Transform{Name: "a"}}, {Transform: Transform{Name: "b"}}, {Transform: Transform{Name: "c"}}}
	got := AllowAll{}.Authorized(context.Background(), "t", items, 1, 3)
	if len(got) != 2 || got[0].Transform.Name != "b" {
		t.Fatalf("%+v", got)
	}
}

func TestSSARAuthorizedStopBeforeStart(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	items := []App{{
		Object: map[string]any{
			"kind":       "Application",
			"apiVersion": "app.k8s.io/v1beta1",
			"metadata":   map[string]any{"name": "a", "namespace": "ns"},
		},
	}}
	got := a.Authorized(context.Background(), "tok", items, 5, 1)
	if got != nil {
		t.Fatalf("%+v", got)
	}
}

func TestSSARListClusterThenNamespaced(t *testing.T) {
	var verbs []string
	var namespaces []string
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			attr := review.Spec.ResourceAttributes
			verbs = append(verbs, attr.Verb)
			namespaces = append(namespaces, attr.Namespace)
			allowed := attr.Namespace == "ns"
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	items := []App{{
		Object: map[string]any{
			"kind":       "Application",
			"apiVersion": "app.k8s.io/v1beta1",
			"metadata":   map[string]any{"name": "a", "namespace": "ns"},
		},
	}}
	got := a.Authorized(context.Background(), "tok", items, 0, 1)
	if len(got) != 1 {
		t.Fatalf("authorized %d verbs %v ns %v", len(got), verbs, namespaces)
	}
	if len(verbs) < 2 || verbs[0] != "list" || verbs[1] != "list" {
		t.Fatalf("verbs %v", verbs)
	}
	if namespaces[0] != "" || namespaces[1] != "ns" {
		t.Fatalf("namespaces %v", namespaces)
	}
}

func TestSSARCacheIncludesAPIGroup(t *testing.T) {
	var groups []string
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			groups = append(groups, review.Spec.ResourceAttributes.Group)
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	items := []App{
		{Object: map[string]any{
			"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
			"metadata": map[string]any{"name": "a", "namespace": "ns"},
		}},
		{Object: map[string]any{
			"kind": "Application", "apiVersion": "argoproj.io/v1alpha1",
			"metadata": map[string]any{"name": "a", "namespace": "ns"},
		}},
	}
	got := a.Authorized(context.Background(), "tok", items, 0, 2)
	if len(got) != 2 {
		t.Fatalf("authorized %d groups %v", len(got), groups)
	}
	if len(groups) != 2 || groups[0] != "app.k8s.io" || groups[1] != "argoproj.io" {
		t.Fatalf("ssar groups %v", groups)
	}
}

func TestSSARRemoteManagedClusterView(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			attr := review.Spec.ResourceAttributes
			allowed := attr.Verb == "create" && attr.Resource == "managedclusterviews"
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	items := []App{{
		Object:         map[string]any{"kind": "Application", "apiVersion": "argoproj.io/v1alpha1"},
		RemoteClusters: []string{"remote-1"},
	}}
	got := a.Authorized(context.Background(), "tok", items, 0, 1)
	if len(got) != 1 {
		t.Fatal("remote app should pass MCV create")
	}
}

func TestClientForSurvivesCleanupDuringCreate(t *testing.T) {
	started := make(chan struct{})
	var startedOnce sync.Once
	release := make(chan struct{})
	client := fake.NewSimpleClientset()
	var creates atomic.Int32
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		creates.Add(1)
		startedOnce.Do(func() { close(started) })
		<-release
		return client, nil
	})

	var wg sync.WaitGroup
	errCh := make(chan error, 2)
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := a.clientFor("tok", hashToken("tok"))
			errCh <- err
		}()
	}

	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("newClient not started")
	}
	// Cleanup must not yank the in-flight single-flight wait (empty entries).
	a.cleanup(time.Now())
	close(release)
	wg.Wait()
	close(errCh)
	for err := range errCh {
		if err != nil {
			t.Fatalf("clientFor after cleanup: %v", err)
		}
	}
	if n := creates.Load(); n != 1 {
		t.Fatalf("newClient calls=%d want 1", n)
	}
}

func TestSSARCacheHitAndCleanup(t *testing.T) {
	var calls atomic.Int32
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			calls.Add(1)
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	obj := map[string]any{
		"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
		"metadata": map[string]any{"name": "a", "namespace": "ns"},
	}
	_, _ = a.ssar(context.Background(), "tok", obj, "list", "", "")
	_, _ = a.ssar(context.Background(), "tok", obj, "list", "", "")
	if calls.Load() != 1 {
		t.Fatalf("cache miss count %d", calls.Load())
	}
	a.cleanup(time.Now().Add(accessCacheTTL + time.Second))
	_, _ = a.ssar(context.Background(), "tok", obj, "list", "", "")
	if calls.Load() != 2 {
		t.Fatalf("after expiry %d", calls.Load())
	}
}

func TestSSARCleanupLRU(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	now := time.Now()
	inFlight := hashToken("in-flight")
	a.mu.Lock()
	a.byToken[inFlight] = &tokenState{
		last:       now,
		clientWait: make(chan struct{}),
		entries:    map[ssarKey]cacheEntry{},
	}
	a.mu.Unlock()
	for i := 0; i < accessCacheMaxTokens+2; i++ {
		th := hashToken(fmt.Sprintf("token-%d", i))
		a.mu.Lock()
		a.byToken[th] = &tokenState{
			last: now.Add(time.Duration(i) * time.Millisecond),
			entries: map[ssarKey]cacheEntry{
				{verb: "list"}: {allowed: true, expiry: now.Add(accessCacheTTL)},
			},
		}
		a.mu.Unlock()
	}
	a.cleanup(now)
	if len(a.byToken) > accessCacheMaxTokens+1 {
		t.Fatalf("tokens %d", len(a.byToken))
	}
	if a.byToken[inFlight] == nil {
		t.Fatal("in-flight token evicted during LRU")
	}
}

func TestStartCleanupExitsOnCancel(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	ctx, cancel := context.WithCancel(context.Background())
	done := a.StartCleanup(ctx)
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("cleanup did not terminate after cancel")
	}
}

func TestSSARAuthorizedLargeChunk(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	items := make([]App, 120)
	for i := range items {
		items[i] = App{Object: map[string]any{
			"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
			"metadata": map[string]any{"name": "a", "namespace": "ns"},
		}}
	}
	got := a.Authorized(context.Background(), "tok", items, 0, 110)
	if len(got) != 110 {
		t.Fatalf("authorized %d", len(got))
	}
}

func TestSSARCreateError(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, errors.New("apiserver down")
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	obj := map[string]any{
		"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
		"metadata": map[string]any{"name": "a", "namespace": "ns"},
	}
	ok, err := a.ssar(context.Background(), "tok", obj, "list", "", "")
	if err == nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestClientForNewClientError(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return nil, errors.New("no client")
	})
	_, err := a.clientFor("tok", hashToken("tok"))
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestCleanupDropsExpiredEmptyToken(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	now := time.Now()
	th := hashToken("old")
	a.mu.Lock()
	a.byToken[th] = &tokenState{
		last: now.Add(-time.Hour),
		entries: map[ssarKey]cacheEntry{
			{verb: "list"}: {allowed: true, expiry: now.Add(-time.Minute)},
		},
	}
	a.mu.Unlock()
	a.cleanup(now)
	a.mu.Lock()
	defer a.mu.Unlock()
	if a.byToken[th] != nil {
		t.Fatal("expired token should be removed")
	}
}

func TestCleanupKeepsInFlightClient(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	th := hashToken("tok")
	a.mu.Lock()
	a.byToken[th] = &tokenState{
		clientWait: make(chan struct{}),
		entries:    map[ssarKey]cacheEntry{},
	}
	a.mu.Unlock()
	a.cleanup(time.Now())
	a.mu.Lock()
	if a.byToken[th] == nil {
		t.Fatal("in-flight token removed")
	}
	a.mu.Unlock()
}

func TestCanListClusterScopedDenied(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			allowed := review.Spec.ResourceAttributes.Namespace != ""
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	obj := map[string]any{
		"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
		"metadata": map[string]any{"name": "a", "namespace": "ns"},
	}
	ok, err := a.canList(context.Background(), "tok", obj)
	if err != nil || !ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestCanListDeniedInNamespace(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	obj := map[string]any{
		"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
		"metadata": map[string]any{"name": "a", "namespace": "ns"},
	}
	ok, err := a.canList(context.Background(), "tok", obj)
	if err != nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestSSARAuthorizedSkipsErrors(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, errors.New("denied")
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	items := []App{{Object: map[string]any{
		"kind": "Application", "apiVersion": "app.k8s.io/v1beta1",
		"metadata": map[string]any{"name": "a", "namespace": "ns"},
	}}}
	if got := a.Authorized(context.Background(), "tok", items, 0, 1); len(got) != 0 {
		t.Fatalf("%+v", got)
	}
}

func TestCanAccessRemoteSecondCluster(t *testing.T) {
	var ns []string
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			ns = append(ns, review.Spec.ResourceAttributes.Namespace)
			allowed := review.Spec.ResourceAttributes.Namespace == "ok"
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.canAccessRemote(context.Background(), "tok", []string{"deny", "ok"})
	if err != nil || !ok {
		t.Fatalf("ok=%v err=%v ns=%v", ok, err, ns)
	}
}
