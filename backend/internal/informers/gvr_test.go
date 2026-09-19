// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"errors"
	"fmt"
	"testing"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func TestResolveGVRSuccess(t *testing.T) {
	m := mapperFor("apps/v1",
		metav1.APIResource{Name: "deployments", Kind: "Deployment", Namespaced: true},
		metav1.APIResource{Name: "deployments/scale", Kind: "Scale"},
	)
	gvr, err := ResolveGVR(m, "apps/v1", "Deployment")
	if err != nil {
		t.Fatal(err)
	}
	want := schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	if gvr != want {
		t.Fatalf("got %+v want %+v", gvr, want)
	}
}

func TestResolveGVRSkipsSubresource(t *testing.T) {
	m := mapperFor("v1", metav1.APIResource{Name: "pods/status", Kind: "Pod"})
	_, err := ResolveGVR(m, "v1", "Pod")
	if !errors.Is(err, errKindNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestResolveGVRDiscoveryError(t *testing.T) {
	m := staticMapper{errs: map[string]error{
		"v1": apierrors.NewForbidden(schema.GroupResource{Resource: "namespaces"}, "x", errors.New("no")),
	}}
	_, err := ResolveGVR(m, "v1", "Namespace")
	if !apierrors.IsForbidden(err) {
		t.Fatalf("got %v", err)
	}
}

func TestResolveGVRKindNotFound(t *testing.T) {
	m := mapperFor("v1", metav1.APIResource{Name: "pods", Kind: "Pod"})
	_, err := ResolveGVR(m, "v1", "NoSuchKind")
	if !errors.Is(err, errKindNotFound) {
		t.Fatalf("got %v", err)
	}
}

func TestIsUnavailable(t *testing.T) {
	cases := []struct {
		err error
		ok  bool
	}{
		{nil, false},
		{errors.New("other"), false},
		{apierrors.NewNotFound(schema.GroupResource{Resource: "x"}, "n"), true},
		{apierrors.NewForbidden(schema.GroupResource{Resource: "x"}, "n", errors.New("denied")), true},
		{fmt.Errorf("%w: v1 Thing", errKindNotFound), true},
		{errors.New("not found"), true},
	}
	for _, tc := range cases {
		if got := isUnavailable(tc.err); got != tc.ok {
			t.Fatalf("isUnavailable(%v)=%v want %v", tc.err, got, tc.ok)
		}
	}
}
