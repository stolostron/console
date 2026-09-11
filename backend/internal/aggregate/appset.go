// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"

	"github.com/stolostron/console/backend/internal/auth"
)

type requestStatuses struct {
	Clusters []string `json:"clusters"`
}

type resultStatuses struct {
	ItemCount           string                    `json:"itemCount"`
	FilterCounts        map[string]map[string]int `json:"filterCounts"`
	SystemAppNSPrefixes []string                  `json:"systemAppNSPrefixes"`
	Loading             bool                      `json:"loading"`
}

type resultAppSetData struct {
	Appset             map[string]any           `json:"appset"`
	ClusterList        []string                 `json:"clusterList"`
	Placement          map[string]any           `json:"placement,omitempty"`
	PlacementDecision  map[string]any           `json:"placementDecision,omitempty"`
	AppSetApps         []map[string]any         `json:"appSetApps"`
	AppStatusByNameMap map[string]AppHealthSync `json:"appStatusByNameMap"`
	IsAppSetPullModel  bool                     `json:"isAppSetPullModel"`
}

func (h *Handler) statuses(w http.ResponseWriter, r *http.Request, token string) {
	var req requestStatuses
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	items := h.Engine.applications()
	if len(req.Clusters) > 0 {
		filtered := make([]App, 0, len(items))
		for _, item := range items {
			match := false
			for _, want := range req.Clusters {
				for _, c := range item.Transform.Clusters {
					if c == want {
						match = true
						break
					}
				}
				if match {
					break
				}
			}
			if match {
				filtered = append(filtered, item)
			}
		}
		items = filtered
	}
	authorized := h.Access.Authorized(r.Context(), token, items, 0, len(items))
	counts := map[string]map[string]int{
		"type": {}, "cluster": {}, "podStatuses": {}, "healthStatus": {}, "syncStatus": {},
	}
	for _, item := range authorized {
		incFilterCounts(counts, "type", []string{item.Transform.Type})
		incFilterCounts(counts, "cluster", item.Transform.Clusters)
		incStatusCounts(counts, "healthStatus", item, colHealth)
		incStatusCounts(counts, "syncStatus", item, colSynced)
		incStatusCounts(counts, "podStatuses", item, colDeployed)
	}
	h.Engine.mu.RLock()
	prefixes := append([]string{}, h.Engine.systemPrefixes...)
	h.Engine.mu.RUnlock()
	writeJSON(w, resultStatuses{
		ItemCount:           itoaCount(len(authorized)),
		FilterCounts:        counts,
		SystemAppNSPrefixes: prefixes,
		Loading:             false,
	})
}

func itoaCount(n int) string {
	return strconv.Itoa(n)
}

func incFilterCounts(m map[string]map[string]int, id string, keys []string) {
	inner := m[id]
	if inner == nil {
		inner = map[string]int{}
		m[id] = inner
	}
	for _, key := range keys {
		inner[key]++
	}
}

func incStatusCounts(m map[string]map[string]int, id string, item App, index int) {
	inner := m[id]
	if inner == nil {
		inner = map[string]int{}
		m[id] = inner
	}
	typ := item.Transform.Type
	if (index == colHealth || index == colSynced) && (typ == kindAppSet || typ == kindArgo) {
		if len(item.Transform.Statuses) == 0 {
			return
		}
		key := statusFilterKey(item, index)
		inner[key]++
	}
}

func (h *Handler) appSetData(w http.ResponseWriter, r *http.Request, token string) {
	var stub map[string]any
	if err := json.NewDecoder(r.Body).Decode(&stub); err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}
	appset, err := h.fetchAppSet(r.Context(), token, stub)
	if err != nil {
		writeJSONStatus(w, http.StatusBadRequest, map[string]string{"error": "Failed to fetch resource"})
		return
	}
	h.Engine.mu.RLock()
	defer h.Engine.mu.RUnlock()
	name := metaName(appset)
	nsName := metaNamespace(appset) + "/" + name
	appSetApps := eMaps(h.Engine.appSetAppsMap[name])
	statusByName := h.Engine.appStatusByName[nsName]
	if statusByName == nil {
		statusByName = map[string]AppHealthSync{}
	}
	hub := h.Engine.hubClusterName()
	clusters := h.Engine.clusters()
	var local *Cluster
	for i := range clusters {
		if clusters[i].Name == hub {
			c := clusters[i]
			local = &c
			break
		}
	}
	clusterList := h.Engine.applicationClusters(appset, kindAppSet, nil, nil, local, clusters)
	if clusterList == nil {
		clusterList = []string{}
	}
	var placement, placementDecision map[string]any
	spec, _ := appset["spec"].(map[string]any)
	placementName := placementNameFromSpec(spec)
	if placementName != "" {
		placements := h.Engine.listKind("cluster.open-cluster-management.io/v1beta1", "Placement")
		decisions := h.Engine.listKind("cluster.open-cluster-management.io/v1beta1", "PlacementDecision")
		for _, p := range decisions {
			labels := metaLabels(p)
			if metaNamespace(p) == metaNamespace(appset) && strVal(labels["cluster.open-cluster-management.io/placement"]) == placementName {
				placementDecision = p
				break
			}
		}
		if len(clusterList) == 0 && placementDecision != nil {
			for _, d := range nestedSlice(placementDecision, "status", "decisions") {
				dm, _ := d.(map[string]any)
				if n := strVal(dm["clusterName"]); n != "" {
					clusterList = append(clusterList, n)
				}
			}
		}
		owners := nestedSlice(placementDecision, "metadata", "ownerReferences")
		if len(owners) > 0 {
			owner0, _ := owners[0].(map[string]any)
			for _, resource := range placements {
				if kindOf(resource) == strVal(owner0["kind"]) &&
					metaName(resource) == strVal(owner0["name"]) &&
					metaNamespace(resource) == metaNamespace(appset) {
					placement = resource
					break
				}
			}
		}
	}
	writeJSON(w, resultAppSetData{
		Appset:             appset,
		ClusterList:        clusterList,
		Placement:          placement,
		PlacementDecision:  placementDecision,
		AppSetApps:         appSetApps,
		AppStatusByNameMap: statusByName,
		IsAppSetPullModel:  isArgoPullModel(appset),
	})
}

func eMaps(in []map[string]any) []map[string]any {
	if in == nil {
		return []map[string]any{}
	}
	return in
}

func (h *Handler) fetchAppSet(ctx context.Context, token string, stub map[string]any) (map[string]any, error) {
	if h.GetAppSet != nil {
		return h.GetAppSet(ctx, token, stub)
	}
	if h.REST == nil {
		return stub, nil
	}
	cfg := auth.UserRESTConfig(h.REST, token)
	client, err := dynamic.NewForConfig(cfg)
	if err != nil {
		return nil, err
	}
	gvr := schema.GroupVersionResource{Group: "argoproj.io", Version: "v1alpha1", Resource: "applicationsets"}
	obj, err := client.Resource(gvr).Namespace(metaNamespace(stub)).Get(ctx, metaName(stub), metav1.GetOptions{})
	if err != nil {
		return nil, err
	}
	return obj.Object, nil
}
