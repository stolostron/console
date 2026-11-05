// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"

	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
)

// listVMClusterRolesForToken lists vm-clusterroles ClusterRoles with the user's token (SSE fallback).
func listVMClusterRolesForToken(ctx context.Context, base *rest.Config, token string) ([]*rbacv1.ClusterRole, error) {
	client, err := kubernetes.NewForConfig(auth.UserRESTConfig(base, token))
	if err != nil {
		return nil, err
	}
	return listVMClusterRoles(ctx, client)
}

// listVMClusterRoles returns DeepCopied ClusterRoles matching the vm-clusterroles label selector.
func listVMClusterRoles(ctx context.Context, client kubernetes.Interface) ([]*rbacv1.ClusterRole, error) {
	list, err := client.RbacV1().ClusterRoles().List(ctx, metav1.ListOptions{LabelSelector: VMClusterRolesSelector})
	if err != nil {
		return nil, err
	}
	out := make([]*rbacv1.ClusterRole, 0, len(list.Items))
	for i := range list.Items {
		role := list.Items[i]
		if !matchesVMLabel(&role) {
			continue
		}
		out = append(out, cloneRole(&role))
	}
	return out, nil
}
