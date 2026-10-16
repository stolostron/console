// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
	ktesting "k8s.io/client-go/testing"
)

func TestSSARAccessHashesTokenAndCaches(t *testing.T) {
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
	role := &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "r1"}}
	const token = "super-secret-bearer"
	for i := 0; i < 2; i++ {
		ok, err := a.CanSee(context.Background(), token, role)
		if err != nil || !ok {
			t.Fatalf("allowed=%v err=%v", ok, err)
		}
	}
	if got := calls.Load(); got != 1 {
		t.Fatalf("SSAR calls %d want 1", got)
	}
	a.mu.Lock()
	defer a.mu.Unlock()
	if len(a.cache) == 0 {
		t.Fatal("expected cache entry")
	}
	for key := range a.cache {
		if key.token == token {
			t.Fatal("cache key stores raw bearer token")
		}
		if key.token != hashToken(token) {
			t.Fatalf("token key %q", key.token)
		}
	}
}

func TestCanSeeNilRole(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		t.Fatal("unexpected SSAR")
		return nil, nil
	})
	ok, err := a.CanSee(context.Background(), "tok", nil)
	if err != nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestCanSeeListAllowsSkipsGet(t *testing.T) {
	var verbs []string
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
			verbs = append(verbs, review.Spec.ResourceAttributes.Verb)
			allowed := review.Spec.ResourceAttributes.Verb == "list"
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.CanSee(context.Background(), "tok", &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "r1"}})
	if err != nil || !ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
	if len(verbs) != 1 || verbs[0] != "list" {
		t.Fatalf("verbs %v", verbs)
	}
}

func TestSSARAccessClientAndReviewErrors(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return nil, errors.New("no client")
	})
	_, err := a.CanSee(context.Background(), "tok", &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "r"}})
	if err == nil {
		t.Fatal("expected client error")
	}

	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			return true, nil, errors.New("apiserver down")
		})
	a = NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	_, err = a.CanSee(context.Background(), "tok", &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "r"}})
	if err == nil {
		t.Fatal("expected review error")
	}
}

func TestNewSSARAccessConstructsClient(t *testing.T) {
	a := NewSSARAccess(&rest.Config{
		Host:            "https://example.invalid",
		TLSClientConfig: rest.TLSClientConfig{Insecure: true},
	})
	if a == nil || a.newClient == nil {
		t.Fatal("expected accessor")
	}
}

func TestSSARAccessCleanupAndStartCleanup(t *testing.T) {
	orig := accessCacheMaxSize
	accessCacheMaxSize = 2
	t.Cleanup(func() { accessCacheMaxSize = orig })

	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			return true, &authzv1.SelfSubjectAccessReview{
				Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
			}, nil
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	role := &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "a"}}
	for _, name := range []string{"a", "b", "c"} {
		role.Name = name
		if _, err := a.CanSee(context.Background(), "tok", role); err != nil {
			t.Fatal(err)
		}
	}
	a.cleanup(time.Now())
	a.mu.Lock()
	if len(a.cache) > accessCacheMaxSize {
		t.Fatalf("cache size %d", len(a.cache))
	}
	for k, e := range a.cache {
		e.expiry = time.Now().Add(-time.Second)
		a.cache[k] = e
	}
	a.mu.Unlock()
	a.cleanup(time.Now())
	a.mu.Lock()
	n := len(a.cache)
	a.mu.Unlock()
	if n != 0 {
		t.Fatalf("expired entries %d", n)
	}

	ctx, cancel := context.WithCancel(context.Background())
	a.StartCleanup(ctx)
	cancel()
	var nilAccess *SSARAccess
	nilAccess.StartCleanup(ctx)
}
