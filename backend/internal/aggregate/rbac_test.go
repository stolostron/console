// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"testing"

	authzv1 "k8s.io/api/authorization/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

func TestAllowAllWindow(t *testing.T) {
	items := []App{{Transform: Transform{Name: "a"}}, {Transform: Transform{Name: "b"}}, {Transform: Transform{Name: "c"}}}
	got := AllowAll{}.Authorized(context.Background(), "t", items, 1, 3)
	if len(got) != 2 || got[0].Transform.Name != "b" {
		t.Fatalf("%+v", got)
	}
}

func TestSSARListClusterThenNamespaced(t *testing.T) {
	var verbs []string
	var namespaces []string
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
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

func TestSSARRemoteManagedClusterView(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
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
