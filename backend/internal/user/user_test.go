// Copyright Contributors to the Open Cluster Management project

package user_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/user"
)

type stubReviewer struct {
	result auth.TokenReviewResult
	err    error
}

func (s stubReviewer) Review(context.Context, string) (auth.TokenReviewResult, error) {
	return s.result, s.err
}

func apiProbeServer(t *testing.T) (*httptest.Server, *rest.Config) {
	t.Helper()
	ts := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api" {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("Authorization") != "Bearer good" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	t.Cleanup(ts.Close)
	return ts, &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
}

func TestAuthenticated_OK(t *testing.T) {
	_, base := apiProbeServer(t)
	h := user.New(user.Options{RESTConfig: base, Reviewer: stubReviewer{}})
	req := httptest.NewRequest(http.MethodGet, "/authenticated", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}
}

func TestAuthenticated_Unauthorized(t *testing.T) {
	_, base := apiProbeServer(t)
	h := user.New(user.Options{RESTConfig: base, Reviewer: stubReviewer{}})
	req := httptest.NewRequest(http.MethodGet, "/authenticated", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestUsername(t *testing.T) {
	_, base := apiProbeServer(t)
	h := user.New(user.Options{
		RESTConfig: base,
		Reviewer: stubReviewer{result: auth.TokenReviewResult{
			Authenticated: true,
			Username:      "testuser",
		}},
	})
	req := httptest.NewRequest(http.MethodGet, "/username", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var payload map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
		t.Fatal(err)
	}
	body, ok := payload["body"].(map[string]interface{})
	if !ok || body["username"] != "testuser" {
		t.Fatalf("payload %#v", payload)
	}
}

func TestUserPreferenceGet_NotFoundReturnsNull(t *testing.T) {
	_, base := apiProbeServer(t)
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "console.open-cluster-management.io", Version: "v1", Resource: "userpreferences"}: "UserPreferenceList",
	})
	h := user.New(user.Options{
		RESTConfig: base,
		Reviewer: stubReviewer{result: auth.TokenReviewResult{
			Authenticated: true,
			Username:      "kube:admin",
		}},
		Dynamic: client,
	})
	req := httptest.NewRequest(http.MethodGet, "/userpreference", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.String() != "null" {
		t.Fatalf("body %q", rec.Body.String())
	}
}

func TestUserPreferenceGet_Existing(t *testing.T) {
	_, base := apiProbeServer(t)
	obj := &unstructured.Unstructured{Object: map[string]interface{}{
		"apiVersion": "console.open-cluster-management.io/v1",
		"kind":       "UserPreference",
		"metadata":   map[string]interface{}{"name": "kube-admin"},
	}}
	client := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "console.open-cluster-management.io", Version: "v1", Resource: "userpreferences"}: "UserPreferenceList",
	}, obj)
	h := user.New(user.Options{
		RESTConfig: base,
		Reviewer: stubReviewer{result: auth.TokenReviewResult{
			Authenticated: true,
			Username:      "kube:admin",
		}},
		Dynamic: client,
	})
	req := httptest.NewRequest(http.MethodGet, "/userpreference", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	var got map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if got["kind"] != "UserPreference" {
		t.Fatalf("got %#v", got)
	}
}
