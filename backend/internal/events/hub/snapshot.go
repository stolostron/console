// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"sort"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"

	"github.com/stolostron/console/backend/internal/informers"
	applog "github.com/stolostron/console/backend/internal/log"
)

// modifiedEvent wraps a cached object as a MODIFIED SSE event (creates and updates share this type).
func modifiedEvent(o informers.ForwardedObject) Event {
	obj := o.Object.Object
	if obj == nil {
		obj = map[string]any{}
	}
	return Event{Type: TypeModified, Object: obj, GVR: o.GVR}
}

// splice takes up to n objects from the front of src and returns them as MODIFIED events.
func splice(src *[]informers.ForwardedObject, n int) []Event {
	if n <= 0 || len(*src) == 0 {
		return nil
	}
	if n > len(*src) {
		n = len(*src)
	}
	chunk := (*src)[:n]
	*src = (*src)[n:]
	out := make([]Event, len(chunk))
	for i, o := range chunk {
		out[i] = modifiedEvent(o)
	}
	return out
}

func sortByName(items []informers.ForwardedObject) {
	sort.Slice(items, func(i, j int) bool {
		return items[i].Object.GetName() < items[j].Object.GetName()
	})
}

func sortByNamespace(items []informers.ForwardedObject) {
	sort.Slice(items, func(i, j int) bool {
		return items[i].Object.GetNamespace() < items[j].Object.GetNamespace()
	})
}

// packetize orders objects into priority packets with EOP markers (Node snapshot packetization).
func packetize(objs []informers.ForwardedObject) []Event {
	var clusters, agents, infos, policies, addons, rbac, other, remainder []informers.ForwardedObject
	for _, o := range objs {
		switch o.Object.GetKind() {
		case "ManagedCluster", "HostedCluster", "ClusterDeployment", "ManagedClusterSet":
			clusters = append(clusters, o)
		case "Policy", "PolicySet":
			policies = append(policies, o)
		case "AgentClusterInstall":
			agents = append(agents, o)
		case "ManagedClusterInfo":
			infos = append(infos, o)
		case "ManagedClusterAddOn":
			addons = append(addons, o)
		case "MulticlusterRoleAssignment", "User":
			rbac = append(rbac, o)
		case "Search", "Secret":
			other = append(other, o)
		default:
			remainder = append(remainder, o)
		}
	}
	sortByName(clusters)
	sortByNamespace(infos)
	sortByName(policies)
	sortByNamespace(addons)
	sortByName(rbac)

	var out []Event
	for {
		out = append(out, splice(&clusters, 200)...)
		out = append(out, splice(&agents, 200)...)
		out = append(out, splice(&infos, 200)...)
		out = append(out, splice(&policies, 200)...)
		out = append(out, splice(&addons, 400)...)
		out = append(out, splice(&rbac, 200)...)
		out = append(out, splice(&other, 100)...)
		out = append(out, Event{Type: TypeEOP})
		if len(clusters)+len(agents)+len(infos)+len(policies)+len(addons)+len(rbac)+len(other) == 0 {
			break
		}
	}
	for len(remainder) > 0 {
		out = append(out, splice(&remainder, 1978)...)
	}
	return out
}

// snapshotEvents builds the full unauthenticated snapshot from the informer cache (tests/debug).
func (h *Hub) snapshotEvents() []Event {
	var objs []informers.ForwardedObject
	if h.cache != nil {
		objs = h.cache.ListForwarded()
	}
	h.applyFlapOverlay(objs)
	return snapshotFromObjects(h.settings(), objs)
}

// snapshotFromObjects frames START → SETTINGS → priority packets → LOADED around objs.
func snapshotFromObjects(settings map[string]string, objs []informers.ForwardedObject) []Event {
	out := []Event{
		{Type: TypeStart},
		{Type: TypeSettings, Settings: settings},
	}
	out = append(out, packetize(objs)...)
	out = append(out, Event{Type: TypeLoaded})
	return out
}

// metaEvent builds a lightweight MODIFIED event from a ref for RBAC prefetch/Allow without full objects.
func metaEvent(ref informers.ForwardedRef) Event {
	meta := map[string]any{"name": ref.Name}
	if ref.Namespace != "" {
		meta["namespace"] = ref.Namespace
	}
	return Event{
		Type: TypeModified,
		GVR:  ref.GVR,
		Object: map[string]any{
			"apiVersion": ref.APIVersion,
			"kind":       ref.Kind,
			"metadata":   meta,
		},
	}
}

var copyRef = func(ref informers.ForwardedRef) informers.ForwardedObject {
	return ref.Copy()
}

// authorizeRefs prefetches cluster list SSARs then returns only objects the token may get.
func authorizeRefs(ctx context.Context, token string, access AccessChecker, refs []informers.ForwardedRef) []informers.ForwardedObject {
	if access == nil {
		access = AllowAllAccess{}
	}
	prefetch := make([]Event, 0, len(refs))
	for _, ref := range refs {
		prefetch = append(prefetch, metaEvent(ref))
	}
	access.Prefetch(ctx, token, prefetch)

	allowed := make([]informers.ForwardedObject, 0, len(refs))
	for _, ref := range refs {
		ok, err := access.Allow(ctx, token, metaEvent(ref))
		if err != nil {
			applog.Logger().Warn("events ssar failed", "error", err)
			continue
		}
		if !ok {
			continue
		}
		allowed = append(allowed, copyRef(ref))
	}
	return allowed
}

// authorizedSnapshot is the per-user initial SSE snapshot after RBAC filtering and flap overlay.
func (h *Handler) authorizedSnapshot(ctx context.Context, token string) []Event {
	var refs []informers.ForwardedRef
	if h.hub != nil && h.hub.cache != nil {
		refs = h.hub.cache.ListForwardedRefs()
	}
	settings := map[string]string{}
	if h.hub != nil {
		settings = h.hub.settings()
	}
	objs := authorizeRefs(ctx, token, h.access, refs)
	if h.hub != nil {
		h.hub.applyFlapOverlay(objs)
	}
	return snapshotFromObjects(settings, objs)
}

// applyFlapOverlay rewrites throttled Policy objects in the snapshot to match what live fan-out sends.
func (h *Hub) applyFlapOverlay(objs []informers.ForwardedObject) {
	if h == nil || h.flap == nil {
		return
	}
	for i := range objs {
		if objs[i].Object.GetKind() != policyKind {
			continue
		}
		next, ok := h.flap.clientPolicy(objs[i].Object.GetNamespace(), objs[i].Object.GetName(), objs[i].Object.Object)
		if !ok {
			continue
		}
		objs[i].Object = unstructured.Unstructured{Object: next}
	}
}
