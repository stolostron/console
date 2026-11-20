// Copyright Contributors to the Open Cluster Management project

package rbacany

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"

	authzv1 "k8s.io/api/authorization/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

type reviewFunc func(authzv1.ResourceAttributes) (authzv1.SubjectAccessReviewStatus, error)

func fakeClient(reviewer reviewFunc) *fake.Clientset {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews",
		func(action ktesting.Action) (bool, runtime.Object, error) {
			request := action.(ktesting.CreateAction).GetObject().(*authzv1.SelfSubjectAccessReview)
			status, err := reviewer(*request.Spec.ResourceAttributes)
			if err != nil {
				return true, nil, err
			}
			return true, &authzv1.SelfSubjectAccessReview{Status: status}, nil
		})
	return client
}

func TestAnyNamespaceAuthorizedAllowedInOneNamespaceShortCircuitsLaterBatches(t *testing.T) {
	var mu sync.Mutex
	checkedNamespaces := map[string]bool{}
	client := fakeClient(func(attributes authzv1.ResourceAttributes) (authzv1.SubjectAccessReviewStatus, error) {
		if attributes.Namespace == "*" {
			return authzv1.SubjectAccessReviewStatus{}, nil
		}
		mu.Lock()
		checkedNamespaces[attributes.Namespace] = true
		mu.Unlock()
		return authzv1.SubjectAccessReviewStatus{Allowed: attributes.Namespace == "namespace-1"}, nil
	})
	namespaces := make([]string, reviewBatchSize+1)
	for i := range namespaces {
		namespaces[i] = fmt.Sprintf("namespace-%d", i+1)
	}

	allowed, err := anyNamespaceAuthorized(context.Background(), client, authzv1.ResourceAttributes{
		Verb: "create", Resource: "deployments", Group: "apps",
	}, namespaces)
	if err != nil {
		t.Fatal(err)
	}
	if !allowed {
		t.Fatal("expected authorization in namespace-1")
	}
	mu.Lock()
	defer mu.Unlock()
	if checkedNamespaces["namespace-41"] {
		t.Fatal("evaluated a later batch after access was allowed")
	}
}

func TestAnyNamespaceAuthorizedDeniedInAllNamespaces(t *testing.T) {
	client := fakeClient(func(attributes authzv1.ResourceAttributes) (authzv1.SubjectAccessReviewStatus, error) {
		return authzv1.SubjectAccessReviewStatus{}, nil
	})

	allowed, err := anyNamespaceAuthorized(context.Background(), client, authzv1.ResourceAttributes{
		Verb: "create", Resource: "deployments", Group: "apps",
	}, []string{"namespace-1", "namespace-2"})
	if err != nil {
		t.Fatal(err)
	}
	if allowed {
		t.Fatal("expected denied when every namespace is confirmed denied")
	}
	if got := len(client.Actions()); got != 3 {
		t.Fatalf("expected admin review and two namespace reviews, got %d", got)
	}
}

func TestAnyNamespaceAuthorizedAdminFastPath(t *testing.T) {
	client := fakeClient(func(attributes authzv1.ResourceAttributes) (authzv1.SubjectAccessReviewStatus, error) {
		return authzv1.SubjectAccessReviewStatus{Allowed: attributes.Namespace == "*"}, nil
	})

	allowed, err := anyNamespaceAuthorized(context.Background(), client, authzv1.ResourceAttributes{
		Verb: "create", Resource: "deployments", Group: "apps",
	}, []string{"namespace-1", "namespace-2"})
	if err != nil {
		t.Fatal(err)
	}
	if !allowed {
		t.Fatal("expected admin access to allow the action")
	}
	if got := len(client.Actions()); got != 1 {
		t.Fatalf("expected only the admin review, got %d reviews", got)
	}
}

func TestAnyNamespaceAuthorizedTransientFailureIsIndeterminate(t *testing.T) {
	client := fakeClient(func(attributes authzv1.ResourceAttributes) (authzv1.SubjectAccessReviewStatus, error) {
		if attributes.Namespace == "namespace-1" {
			return authzv1.SubjectAccessReviewStatus{}, errors.New("temporary API failure")
		}
		return authzv1.SubjectAccessReviewStatus{}, nil
	})

	allowed, err := anyNamespaceAuthorized(context.Background(), client, authzv1.ResourceAttributes{
		Verb: "create", Resource: "deployments", Group: "apps",
	}, []string{"namespace-1", "namespace-2"})
	if err == nil {
		t.Fatal("expected an indeterminate error when one namespace review fails")
	}
	if allowed {
		t.Fatal("unexpectedly allowed after a denied or failed check")
	}
}

func TestHandlerUsesCallerTokenAndRequiresAuthentication(t *testing.T) {
	client := fakeClient(func(attributes authzv1.ResourceAttributes) (authzv1.SubjectAccessReviewStatus, error) {
		return authzv1.SubjectAccessReviewStatus{Allowed: attributes.Namespace == "*"}, nil
	})
	handler := New(Options{ClientForUser: func(token string) (kubernetes.Interface, error) {
		if token != "caller-token" {
			return nil, fmt.Errorf("unexpected user token %q", token)
		}
		return client, nil
	}})

	requestBody, err := json.Marshal(Request{
		ResourceAttributes: authzv1.ResourceAttributes{Verb: "create", Resource: "deployments"},
		Namespaces:         []string{"namespace-1"},
	})
	if err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(http.MethodPost, Route, strings.NewReader(string(requestBody)))
	request.Header.Set("Authorization", "Bearer caller-token")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", response.Code, response.Body.String())
	}
	var result Response
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	if !result.Allowed {
		t.Fatal("expected caller's admin access to allow the action")
	}

	unauthenticated := httptest.NewRequest(http.MethodPost, Route, strings.NewReader(string(requestBody)))
	unauthenticatedResponse := httptest.NewRecorder()
	handler.ServeHTTP(unauthenticatedResponse, unauthenticated)
	if unauthenticatedResponse.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 without a token, got %d", unauthenticatedResponse.Code)
	}
}

func TestHandlerReturnsServiceUnavailableForReviewFailure(t *testing.T) {
	client := fakeClient(func(attributes authzv1.ResourceAttributes) (authzv1.SubjectAccessReviewStatus, error) {
		if attributes.Namespace == "*" {
			return authzv1.SubjectAccessReviewStatus{}, nil
		}
		return authzv1.SubjectAccessReviewStatus{}, fmt.Errorf("temporary API failure")
	})
	handler := New(Options{ClientForUser: func(string) (kubernetes.Interface, error) { return client, nil }})
	request := httptest.NewRequest(
		http.MethodPost,
		Route,
		strings.NewReader(`{"resourceAttributes":{"verb":"create","resource":"deployments"},"namespaces":["namespace-1"]}`),
	)
	request.Header.Set("Authorization", "Bearer caller-token")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503 for an incomplete review, got %d: %s", response.Code, response.Body.String())
	}
}

func TestUniqueNamespaces(t *testing.T) {
	got, err := uniqueNamespaces([]string{" namespace-1 ", "namespace-1", "namespace-2"})
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || got[0] != "namespace-1" || got[1] != "namespace-2" {
		t.Fatalf("unexpected namespace list: %#v", got)
	}
	if _, err := uniqueNamespaces([]string{""}); err == nil {
		t.Fatal("expected empty namespace to be rejected")
	}
}
