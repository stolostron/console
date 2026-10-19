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
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
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

func testRole(name string) *rbacv1.ClusterRole {
	return &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: name}}
}

func ssarReview(allowed bool) (bool, runtime.Object, error) {
	return true, &authzv1.SelfSubjectAccessReview{
		Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
	}, nil
}

func TestCanSeeDeletedDeniedWithoutHistory(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(ktesting.Action) (bool, runtime.Object, error) {
		return ssarReview(false)
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.CanSeeDeleted(context.Background(), "tok", testRole("r1"))
	if err != nil || ok {
		t.Fatalf("allowed=%v err=%v", ok, err)
	}
}

func TestCanSeeDeletedListAllowIsNotRemembered(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			verb := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes.Verb
			return ssarReview(verb == "list")
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.CanSeeDeleted(context.Background(), "tok", testRole("r1"))
	if err != nil || !ok {
		t.Fatalf("allowed=%v err=%v", ok, err)
	}
	if a.roleWasAllowed("tok", "r1") {
		t.Fatal("list allow must not be remembered")
	}
}

func TestCanSeeDeletedNotFoundUsesLastAllow(t *testing.T) {
	missing := false
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			if attr.Verb == "list" {
				return ssarReview(false)
			}
			if missing {
				return true, nil, apierrors.NewNotFound(schema.GroupResource{Resource: "clusterroles"}, attr.Name)
			}
			return ssarReview(true)
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.CanSee(context.Background(), "tok", testRole("r1"))
	if err != nil || !ok {
		t.Fatalf("see allowed=%v err=%v", ok, err)
	}
	if !a.roleWasAllowed("tok", "r1") {
		t.Fatal("expected remembered get allow")
	}
	a.mu.Lock()
	a.cache = map[cacheKey]cacheEntry{}
	a.mu.Unlock()
	missing = true
	ok, err = a.CanSeeDeleted(context.Background(), "tok", testRole("r1"))
	if err != nil || !ok {
		t.Fatalf("deleted allowed=%v err=%v", ok, err)
	}
	if a.roleWasAllowed("tok", "r1") {
		t.Fatal("single-stream delete should drop the remembered allow")
	}
}

func TestCanSeeDeletedSharedAcrossStreams(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			if attr.Verb == "list" {
				return ssarReview(false)
			}
			return ssarReview(false)
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	a.BeginStream("tok")
	a.BeginStream("tok")
	a.rememberRole("tok", "r1")
	ok, err := a.CanSeeDeleted(context.Background(), "tok", testRole("r1"))
	if err != nil || !ok {
		t.Fatalf("first stream deleted allowed=%v err=%v", ok, err)
	}
	if !a.roleWasAllowed("tok", "r1") {
		t.Fatal("remembered allow must remain for the other active stream")
	}
	ok, err = a.CanSeeDeleted(context.Background(), "tok", testRole("r1"))
	if err != nil || !ok {
		t.Fatalf("second stream deleted allowed=%v err=%v", ok, err)
	}
	if a.roleWasAllowed("tok", "r1") {
		t.Fatal("allow should clear after every active stream consumed the delete")
	}
}

func TestEndStreamClearsRememberedRoles(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			if attr.Verb == "list" {
				return ssarReview(false)
			}
			return ssarReview(true)
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	a.BeginStream("tok")
	ok, err := a.CanSee(context.Background(), "tok", testRole("r1"))
	if err != nil || !ok {
		t.Fatalf("see allowed=%v err=%v", ok, err)
	}
	if !a.roleWasAllowed("tok", "r1") {
		t.Fatal("expected remembered allow while stream is open")
	}
	a.BeginStream("tok")
	a.EndStream("tok")
	if !a.roleWasAllowed("tok", "r1") {
		t.Fatal("remembered allow must survive while another stream is open")
	}
	a.EndStream("tok")
	if a.roleWasAllowed("tok", "r1") {
		t.Fatal("last EndStream must clear remembered roles")
	}
}

func TestCanSeeDenyClearsDeletedFallback(t *testing.T) {
	getAllowed := true
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			create := action.(ktesting.CreateAction)
			attr := create.GetObject().(*authzv1.SelfSubjectAccessReview).Spec.ResourceAttributes
			if attr.Verb == "list" {
				return ssarReview(false)
			}
			return ssarReview(getAllowed)
		})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ok, err := a.CanSee(context.Background(), "tok", testRole("r1"))
	if err != nil || !ok {
		t.Fatalf("see allowed=%v err=%v", ok, err)
	}
	a.mu.Lock()
	a.cache = map[cacheKey]cacheEntry{}
	a.mu.Unlock()
	getAllowed = false
	ok, err = a.CanSee(context.Background(), "tok", testRole("r1"))
	if err != nil || ok {
		t.Fatalf("revoke allowed=%v err=%v", ok, err)
	}
	ok, err = a.CanSeeDeleted(context.Background(), "tok", testRole("r1"))
	if err != nil || ok {
		t.Fatalf("deleted allowed=%v err=%v", ok, err)
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
