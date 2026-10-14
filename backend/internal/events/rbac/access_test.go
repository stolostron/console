// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"sync/atomic"
	"testing"

	authzv1 "k8s.io/api/authorization/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func TestSSARAccessHashesTokenAndCaches(t *testing.T) {
	var calls atomic.Int32
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
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
