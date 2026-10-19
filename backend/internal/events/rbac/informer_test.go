// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"context"
	"testing"
	"time"

	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes/fake"
	"k8s.io/client-go/tools/cache"
)

func labeledRoleForInformer(name string) *rbacv1.ClusterRole {
	return &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			UID:  types.UID(name + "-uid"),
			Labels: map[string]string{
				vmClusterRolesLabel: vmClusterRolesValue,
			},
		},
	}
}

func TestClusterRoleHandlersUpdateAndDelete(t *testing.T) {
	store := NewStore()
	h := clusterRoleHandlers(store)
	role := labeledRoleForInformer("updated-role")
	h.AddFunc(role)
	if len(store.List()) != 1 {
		t.Fatalf("list %d", len(store.List()))
	}

	role.Labels["extra"] = "x"
	h.UpdateFunc(role, role)
	h.DeleteFunc(role)
	if len(store.List()) != 0 {
		t.Fatal("expected delete")
	}
}

func TestClusterRoleHandlersDeleteTombstone(t *testing.T) {
	store := NewStore()
	h := clusterRoleHandlers(store)
	role := labeledRoleForInformer("tomb-role")
	h.DeleteFunc(cache.DeletedFinalStateUnknown{Obj: role})
	if len(store.List()) != 0 {
		t.Fatal("tombstone delete should not add to store")
	}

	h.DeleteFunc(cache.DeletedFinalStateUnknown{Obj: "not-a-role"})
	h.DeleteFunc("garbage")
}

func TestStartInformerSyncTimeout(t *testing.T) {
	client := fake.NewSimpleClientset()
	store := NewStore()
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if err := StartInformer(ctx, client, store); err != nil {
		t.Fatal(err)
	}
}

func TestStartInformerWatchesUpdates(t *testing.T) {
	role := labeledRoleForInformer("watch-me")
	client := fake.NewSimpleClientset(role)
	store := NewStore()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := StartInformer(ctx, client, store); err != nil {
		t.Fatal(err)
	}
	role.Labels["touch"] = "1"
	if _, err := client.RbacV1().ClusterRoles().Update(ctx, role, metav1.UpdateOptions{}); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		for _, r := range store.List() {
			if r.Labels["touch"] == "1" {
				return
			}
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("update not reflected in store")
}
