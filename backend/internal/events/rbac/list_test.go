// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"testing"

	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes/fake"
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
