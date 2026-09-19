// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"sort"

	"github.com/stolostron/console/backend/internal/informers"
)

func modifiedEvent(o informers.ForwardedObject) Event {
	obj := o.Object.Object
	if obj == nil {
		obj = map[string]any{}
	}
	return Event{Type: TypeModified, Object: obj, GVR: o.GVR}
}

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
		case "MulticlusterRoleAssignment", "User", "Group":
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

func (h *Hub) snapshotEvents() []Event {
	var objs []informers.ForwardedObject
	if h.cache != nil {
		objs = h.cache.ListForwarded()
	}
	out := []Event{
		{Type: TypeStart},
		{Type: TypeSettings, Settings: h.settings()},
	}
	out = append(out, packetize(objs)...)
	out = append(out, Event{Type: TypeLoaded})
	return out
}
