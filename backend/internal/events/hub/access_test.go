// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"testing"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
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

func TestSSARCascadeListThenGetNamespace(t *testing.T) {
	var verbs []string
	var namespaces []string
	client := fake.NewSimpleClientset()
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

func TestAllowUnknownTypeDenied(t *testing.T) {
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return fake.NewSimpleClientset(), nil
	})
	ok, err := a.Allow(context.Background(), "tok", Event{Type: "NOPE"})
	if err != nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}
