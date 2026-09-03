// Copyright Contributors to the Open Cluster Management project

package rbac

import (
	"sync"

	rbacv1 "k8s.io/api/rbac/v1"
)

const (
	clusterRoleAPIVersion  = "rbac.authorization.k8s.io/v1"
	clusterRoleKind        = "ClusterRole"
	vmClusterRolesLabel    = "rbac.open-cluster-management.io/filter"
	vmClusterRolesValue    = "vm-clusterroles"
	VMClusterRolesSelector = vmClusterRolesLabel + "=" + vmClusterRolesValue
)

// Event is a watch-style change from the ClusterRole informer.
type Event struct {
	Type string
	Role *rbacv1.ClusterRole
}

const subscriberBuffer = 64

// Store holds labeled ClusterRoles and fans out informer events to SSE clients.
type Store struct {
	mu    sync.RWMutex
	byUID map[string]*rbacv1.ClusterRole
	subs  map[chan Event]struct{}
}

func NewStore() *Store {
	return &Store{
		byUID: map[string]*rbacv1.ClusterRole{},
		subs:  map[chan Event]struct{}{},
	}
}

func roleUID(role *rbacv1.ClusterRole) string {
	if role.UID != "" {
		return string(role.UID)
	}
	return role.Name
}

func cloneRole(role *rbacv1.ClusterRole) *rbacv1.ClusterRole {
	cp := role.DeepCopy()
	cp.APIVersion = clusterRoleAPIVersion
	cp.Kind = clusterRoleKind
	cp.ManagedFields = nil
	return cp
}

func matchesVMLabel(role *rbacv1.ClusterRole) bool {
	if role == nil || role.Labels == nil {
		return false
	}
	return role.Labels[vmClusterRolesLabel] == vmClusterRolesValue
}

// Upsert stores the role and broadcasts Type (ADDED or MODIFIED).
func (s *Store) Upsert(eventType string, role *rbacv1.ClusterRole) {
	if !matchesVMLabel(role) {
		return
	}
	cp := cloneRole(role)
	s.mu.Lock()
	s.byUID[roleUID(role)] = cp
	s.broadcastLocked(Event{Type: eventType, Role: cp})
	s.mu.Unlock()
}

// Delete removes the role and broadcasts DELETED.
func (s *Store) Delete(role *rbacv1.ClusterRole) {
	if role == nil {
		return
	}
	cp := cloneRole(role)
	s.mu.Lock()
	delete(s.byUID, roleUID(role))
	s.broadcastLocked(Event{Type: "DELETED", Role: cp})
	s.mu.Unlock()
}

func (s *Store) broadcastLocked(ev Event) {
	for ch := range s.subs {
		select {
		case ch <- ev:
		default:
			// slow subscriber; drop rather than block the informer
		}
	}
}

// List returns a snapshot of stored ClusterRoles.
func (s *Store) List() []*rbacv1.ClusterRole {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]*rbacv1.ClusterRole, 0, len(s.byUID))
	for _, role := range s.byUID {
		out = append(out, role.DeepCopy())
	}
	return out
}

// Subscribe receives live events until Unsubscribe.
func (s *Store) Subscribe() chan Event {
	ch := make(chan Event, subscriberBuffer)
	s.mu.Lock()
	s.subs[ch] = struct{}{}
	s.mu.Unlock()
	return ch
}

func (s *Store) Unsubscribe(ch chan Event) {
	s.mu.Lock()
	delete(s.subs, ch)
	s.mu.Unlock()
	close(ch)
}
