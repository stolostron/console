// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"strings"

	"github.com/stolostron/console/backend/internal/searchapi"
)

func relatedKinds(related []searchapi.Related) []mapKind {
	out := make([]mapKind, 0, len(related))
	for _, r := range related {
		out = append(out, mapKind{Kind: r.Kind, Items: r.Items})
	}
	return out
}

func (e *Engine) addArgoQueryInputs(q *searchapi.Query) {
	e.lastArgoChunk = e.nextAppPageChunk(&e.argoPageChunks, cacheRemoteArgo)
	chunk := e.lastArgoChunk
	filters := []searchapi.Filter{
		{Property: "kind", Values: []string{"Application"}},
		{Property: "apigroup", Values: []string{"argoproj.io"}},
	}
	if chunk != nil && len(chunk.Keys) > 0 {
		filters = append(filters, searchapi.Filter{Property: "name", Values: chunk.Keys})
	}
	q.Variables.Input = append(q.Variables.Input, searchapi.Input{
		Filters:      filters,
		RelatedKinds: []string{"Pod", "ReplicaSet", "Deployment", "StatefulSet"},
		Limit:        searchQueryLimit,
	})
}

func (e *Engine) cacheArgoApplications(search searchapi.ResultBucket, pushResult *searchapi.ResultBucket, pushMap map[string]pushEntry) map[string]struct{} {
	hub := e.hubClusterName()
	clusters := e.clusters()
	var local *Cluster
	for i := range clusters {
		if clusters[i].Name == hub {
			c := clusters[i]
			local = &c
			break
		}
	}
	var remote []map[string]any
	for _, app := range search.Items {
		if searchStr(app, "cluster") != hub {
			remote = append(remote, app)
		}
	}
	statusMap := e.createArgoStatusMap(search, clusters)
	if pushResult != nil && len(pushMap) > 0 {
		mergePushModelPodStatuses(*pushResult, pushMap, statusMap)
	}
	e.lastArgoStatus = statusMap
	if e.cache[cacheLocalArgo].ResourceUIDMap != nil {
		vals := make([]map[string]any, 0, len(e.cache[cacheLocalArgo].ResourceUIDMap))
		uidMap := e.cache[cacheLocalArgo].ResourceUIDMap
		for _, a := range uidMap {
			vals = append(vals, a.Object)
		}
		e.transform(vals, statusMap, false, local, clusters, uidMap)
	}
	e.cacheRemoteApps(statusMap, e.remoteArgoApps(remote), e.lastArgoChunk, cacheRemoteArgo)
	if e.cache[cacheAppSet].ResourceUIDMap != nil {
		vals := make([]map[string]any, 0, len(e.cache[cacheAppSet].ResourceUIDMap))
		uidMap := e.cache[cacheAppSet].ResourceUIDMap
		for _, a := range uidMap {
			vals = append(vals, a.Object)
		}
		e.transform(vals, statusMap, false, local, clusters, uidMap)
	}
	return e.ocpArgoFilter
}

func filterArgoApps(items []map[string]any, clusters []Cluster, ocpFilter map[string]struct{}, appSetApps map[string][]map[string]any, hub string) []map[string]any {
	var out []map[string]any
	for _, app := range items {
		dest := nestedMap(app, "spec", "destination")
		resources := nestedSlice(app, "status", "resources")
		definedNS := ""
		if len(resources) > 0 {
			if r, ok := resources[0].(map[string]any); ok {
				definedNS = strVal(r["namespace"])
			}
		}
		ns := ""
		if dest != nil {
			ns = strVal(dest["namespace"])
		}
		if definedNS != "" {
			ns = definedNS
		}
		ocpFilter[metaName(app)+"-"+ns+"-"+simpleDest(dest, clusters, hub)] = struct{}{}
		owners := nestedSlice(app, "metadata", "ownerReferences")
		isChild := false
		appSetName := ""
		if len(owners) > 0 {
			if o, ok := owners[0].(map[string]any); ok {
				if strVal(o["kind"]) == "ApplicationSet" {
					isChild = true
					appSetName = strVal(o["name"])
				}
			}
		}
		if len(owners) == 0 || !isChild {
			out = append(out, app)
			continue
		}
		apps := appSetApps[appSetName]
		replaced := false
		for i, it := range apps {
			if metaUID(it) == metaUID(app) {
				apps[i] = app
				replaced = true
				break
			}
		}
		if !replaced {
			apps = append(apps, app)
		}
		appSetApps[appSetName] = apps
	}
	return out
}

func simpleDest(dest map[string]any, clusters []Cluster, hub string) string {
	if dest == nil {
		return "unknown"
	}
	serverAPI := strVal(dest["server"])
	if serverAPI != "" {
		if serverAPI == "https://kubernetes.default.svc" {
			return hub
		}
		for _, cls := range clusters {
			if cls.KubeAPIServer == serverAPI {
				return cls.Name
			}
		}
		return "unknown"
	}
	name := strVal(dest["name"])
	if name == "" {
		name = "unknown"
	}
	if name == "in-cluster" || name == hub {
		return hub
	}
	return name
}

func (e *Engine) remoteArgoApps(remote []map[string]any) []map[string]any {
	if len(e.argoPageChunks) == 0 {
		e.pulledAppSetMap = e.tempPulled
		e.tempPulled = map[string][]map[string]any{}
	}
	var apps []map[string]any
	for _, argoApp := range remote {
		e.ocpArgoFilter[searchStr(argoApp, "name")+"-"+searchStr(argoApp, "destinationNamespace")+"-"+searchStr(argoApp, "cluster")] = struct{}{}
		hosting := searchStr(argoApp, "_hostingResource")
		if hosting != "" {
			parts := strings.Split(hosting, "/")
			if len(parts) >= 3 && parts[0] == "ApplicationSet" {
				appSetName := parts[2]
				pulled := e.tempPulled[appSetName]
				replaced := false
				for i, it := range pulled {
					if searchStr(it, "_uid") == searchStr(argoApp, "_uid") {
						pulled[i] = argoApp
						replaced = true
						break
					}
				}
				if !replaced {
					pulled = append(pulled, argoApp)
				}
				e.tempPulled[appSetName] = pulled
			}
			continue
		}
		apps = append(apps, map[string]any{
			"apiVersion": "argoproj.io/v1alpha1",
			"kind":       "Application",
			"metadata": map[string]any{
				"name":              searchStr(argoApp, "name"),
				"namespace":         searchStr(argoApp, "namespace"),
				"creationTimestamp": searchStr(argoApp, "created"),
			},
			"spec": map[string]any{
				"destination": map[string]any{
					"namespace": searchStr(argoApp, "destinationNamespace"),
					"name":      searchStr(argoApp, "destinationName"),
					"server":    firstNonEmpty(searchStr(argoApp, "destinationCluster"), searchStr(argoApp, "destinationServer")),
				},
				"source": map[string]any{
					"path":           searchStr(argoApp, "path"),
					"repoURL":        searchStr(argoApp, "repoURL"),
					"targetRevision": searchStr(argoApp, "targetRevision"),
					"chart":          searchStr(argoApp, "chart"),
				},
			},
			"status": map[string]any{
				"cluster": searchStr(argoApp, "cluster"),
				"health":  map[string]any{"status": searchStr(argoApp, "healthStatus")},
				"sync":    map[string]any{"status": searchStr(argoApp, "syncStatus")},
			},
		})
	}
	return apps
}

func (e *Engine) appSetPlacementData(appSet map[string]any, applicationSets []App) []any {
	current := placementFromAppSet(appSet)
	if current == "" {
		return []any{"", []string{}}
	}
	sharing := []string{}
	for _, item := range applicationSets {
		p := placementFromAppSet(item.Object)
		if p == "" {
			continue
		}
		sameName := metaName(item.Object) == metaName(appSet)
		sameNS := metaNamespace(item.Object) == metaNamespace(appSet)
		if !sameName || (sameName && !sameNS) {
			if p == current && metaName(item.Object) != "" {
				sharing = append(sharing, metaName(item.Object))
			}
		}
	}
	return []any{current, sharing}
}

func placementFromAppSet(obj map[string]any) string {
	spec, _ := obj["spec"].(map[string]any)
	gens := nestedSlice(obj, "spec", "generators")
	if len(gens) == 0 {
		return placementNameFromSpec(spec)
	}
	if g, ok := gens[0].(map[string]any); ok {
		return nestedString(g, "clusterDecisionResource", "labelSelector", "matchLabels", "cluster.open-cluster-management.io/placement")
	}
	return ""
}

func (e *Engine) createArgoStatusMap(search searchapi.ResultBucket, clusters []Cluster) map[string]StatusMap {
	out := map[string]StatusMap{}
	ids := map[string]*statusIDs{}
	sorted := make([]string, 0, len(clusters))
	for _, c := range clusters {
		sorted = append(sorted, c.Name)
	}
	// longest name first
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if len(sorted[j]) > len(sorted[i]) {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}
	for _, app := range search.Items {
		var appKey, appName, appSetName, appNamespace string
		appCluster := searchStr(app, "cluster")
		appNamespace = searchStr(app, "namespace")
		if hosting := searchStr(app, "_hostingResource"); hosting != "" {
			parts := strings.Split(hosting, "/")
			if len(parts) >= 3 {
				appNamespace, appSetName = parts[1], parts[2]
				appName = appNamespace + "/" + appSetName
				appKey = "appset/" + appName
			}
		} else if aset := searchStr(app, "applicationSet"); aset != "" {
			if !strings.Contains(searchStr(app, "label"), "apps.open-cluster-management.io/pull-to-ocm-managed-cluster=true") {
				appName = searchStr(app, "namespace") + "/" + aset
				appKey = "appset/" + appName
				namePart := searchStr(app, "name")
				if len(namePart) > len(aset) && namePart[:len(aset)] == aset {
					namePart = namePart[len(aset)+1:]
				} else {
					namePart = aset
				}
				for _, cluster := range sorted {
					if namePart == cluster || strings.Contains(namePart, "-"+cluster) || strings.Contains(namePart, cluster+"-") {
						appCluster = cluster
						break
					}
				}
				appSetName = aset
			}
		} else {
			appName = searchStr(app, "namespace") + "/" + searchStr(app, "name")
			appKey = "argo/" + appName
		}
		if appKey == "" {
			continue
		}
		if out[appKey] == nil {
			out[appKey] = StatusMap{}
		}
		st, ok := out[appKey][appCluster]
		if !ok {
			st = emptyClusterStatuses()
		}
		computeAppHealthStatus(&st.Health, app)
		computeAppSyncStatus(&st.Synced, app)
		if appSetName != "" {
			key := appNamespace + "/" + appSetName
			if e.appStatusByName[key] == nil {
				e.appStatusByName[key] = map[string]AppHealthSync{}
			}
			var hs AppHealthSync
			hs.Health.Status = searchStr(app, "healthStatus")
			hs.Sync.Status = searchStr(app, "syncStatus")
			e.appStatusByName[key][searchStr(app, "name")] = hs
		}
		idKey := statusIDKey(appKey, appCluster)
		id := ids[idKey]
		if id == nil {
			id = &statusIDs{appName: appName}
			ids[idKey] = id
		}
		id.uids = append(id.uids, searchStr(app, "_uid"))
		out[appKey][appCluster] = st
	}
	computeDeployedPodStatuses(relatedKinds(search.Related), out, ids, false)
	return out
}

type pushEntry struct {
	appSetKey     string
	targetCluster string
}

func mergePushModelPodStatuses(search searchapi.ResultBucket, pushMap map[string]pushEntry, argo map[string]StatusMap) {
	if len(search.Items) == 0 {
		return
	}
	workloadUID := map[string]pushEntry{}
	for _, item := range search.Items {
		key := searchStr(item, "cluster") + "/" + searchStr(item, "namespace") + "/" + searchStr(item, "name")
		if entry, ok := pushMap[key]; ok {
			workloadUID[searchStr(item, "_uid")] = entry
		}
	}
	var pods []map[string]any
	for _, r := range search.Related {
		if r.Kind == "Pod" {
			pods = r.Items
			break
		}
	}
	if pods == nil {
		return
	}
	already := map[string]struct{}{}
	for _, entry := range pushMap {
		if st, ok := argo[entry.appSetKey][entry.targetCluster]; ok {
			counts := st.Deployed.Counts
			if counts[scoreHealthy]+counts[scoreProgress]+counts[scoreWarning]+counts[scoreDanger] > 0 {
				already[entry.appSetKey+"/"+entry.targetCluster] = struct{}{}
			}
		}
	}
	buckets := map[string][]map[string]any{}
	statusPtr := map[string]string{}
	for _, pod := range pods {
		uids, _ := pod["_relatedUids"].([]any)
		var matched *pushEntry
		for _, u := range uids {
			if entry, ok := workloadUID[strVal(u)]; ok {
				e := entry
				matched = &e
				break
			}
		}
		if matched == nil {
			continue
		}
		entryKey := matched.appSetKey + "/" + matched.targetCluster
		if _, ok := already[entryKey]; ok {
			continue
		}
		if _, ok := argo[matched.appSetKey][matched.targetCluster]; !ok {
			continue
		}
		buckets[entryKey] = append(buckets[entryKey], pod)
		statusPtr[entryKey] = matched.appSetKey + "\x00" + matched.targetCluster
	}
	for entryKey, plist := range buckets {
		appSetKey, targetCluster, ok := strings.Cut(statusPtr[entryKey], "\x00")
		if !ok {
			continue
		}
		st := argo[appSetKey][targetCluster]
		computePodStatus(&st.Deployed, plist)
		argo[appSetKey][targetCluster] = st
		_ = entryKey
	}
}
