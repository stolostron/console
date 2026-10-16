// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/rest"
	ktesting "k8s.io/client-go/testing"
)

func TestListVMClusterRolesKeepsLabeled(t *testing.T) {
	keep := &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: "kubevirt.io:view",
			Labels: map[string]string{
				vmClusterRolesLabel: vmClusterRolesValue,
			},
		},
	}
	drop := &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "other"}}
	client := fake.NewSimpleClientset([]runtime.Object{keep, drop}...)
	roles, err := listVMClusterRoles(context.Background(), client)
	if err != nil {
		t.Fatal(err)
	}
	if len(roles) != 1 || roles[0].Name != "kubevirt.io:view" {
		t.Fatalf("roles %+v", roles)
	}
	if roles[0].Kind != clusterRoleKind || roles[0].APIVersion != clusterRoleAPIVersion {
		t.Fatalf("type meta %+v", roles[0])
	}
}

func TestListVMClusterRolesForToken(t *testing.T) {
	keep := &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: "kubevirt.io:admin",
			Labels: map[string]string{
				vmClusterRolesLabel: vmClusterRolesValue,
			},
		},
	}
	list := &rbacv1.ClusterRoleList{Items: []rbacv1.ClusterRole{*keep}}
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.URL.Path, "clusterroles") {
			http.NotFound(w, r)
			return
		}
		if r.Header.Get("Authorization") != "Bearer user-token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(list)
	}))
	defer ts.Close()

	base := &rest.Config{Host: ts.URL, TLSClientConfig: rest.TLSClientConfig{Insecure: true}}
	roles, err := listVMClusterRolesForToken(context.Background(), base, "user-token")
	if err != nil {
		t.Fatal(err)
	}
	if len(roles) != 1 || roles[0].Name != "kubevirt.io:admin" {
		t.Fatalf("roles %+v", roles)
	}
}

func TestListVMClusterRolesListError(t *testing.T) {
	client := fake.NewSimpleClientset()
	client.PrependReactor("list", "clusterroles", func(action ktesting.Action) (bool, runtime.Object, error) {
		return true, nil, errors.New("list denied")
	})
	_, err := listVMClusterRoles(context.Background(), client)
	if err == nil {
		t.Fatal("expected list error")
	}
}

func TestListVMClusterRolesForTokenClientError(t *testing.T) {
	_, err := listVMClusterRolesForToken(context.Background(), &rest.Config{Host: "://not-a-valid-host"}, "tok")
	if err == nil {
		t.Fatal("expected client construction error")
	}
}
