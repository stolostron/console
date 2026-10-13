// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"strings"

	"github.com/stolostron/console/backend/internal/searchapi"
)

func (e *Engine) addOCPQueryInputs(q *searchapi.Query) {
	e.lastOCPChunk = e.nextAppPageChunk(&e.ocpPageChunks, cacheRemoteOCP)
	chunk := e.lastOCPChunk
	filters := []searchapi.Filter{
		{Property: "kind", Values: []string{"Deployment"}},
		{Property: "label", Values: ownerLabelStars()},
		{Property: "namespace", Values: []string{"!openshift*"}},
		{Property: "namespace", Values: []string{"!open-cluster-management*"}},
	}
	if chunk != nil && len(chunk.Keys) > 0 {
		filters = append(filters, searchapi.Filter{Property: "name", Values: chunk.Keys})
	}
	q.Variables.Input = append(q.Variables.Input, searchapi.Input{
		Filters:      filters,
		RelatedKinds: []string{"Pod", "ReplicaSet", "StatefulSet"},
		Limit:        searchQueryLimit,
	})
}

func ownerLabelStars() []string {
	out := make([]string, len(appOwnerLabels))
	for i, l := range appOwnerLabels {
		out[i] = l + "*"
	}
	return out
}

func (e *Engine) addSystemQueryInputs(q *searchapi.Query) {
	e.lastSystemChunk = e.nextClusterNameChunk()
	chunk := e.lastSystemChunk
	q.Variables.Input = append(q.Variables.Input, searchapi.Input{
		Filters: []searchapi.Filter{
			{Property: "kind", Values: []string{"Deployment"}},
			{Property: "label", Values: ownerLabelStars()},
			{Property: "namespace", Values: []string{"openshift*", "open-cluster-management*"}},
			{Property: "cluster", Values: chunk},
		},
		RelatedKinds: []string{"Pod", "ReplicaSet", "StatefulSet"},
		Limit:        searchQueryLimit,
	})
}

func (e *Engine) nextClusterNameChunk() []string {
	if len(e.clusterNameChunks) == 0 {
		cm := e.clusterMap()
		names := make([]string, 0, len(cm))
		for n := range cm {
			names = append(names, n)
		}
		if len(names) > 0 {
			var chunks [][]string
			for i, n := range names {
				cidx := i / remoteClusterChunks
				for len(chunks) <= cidx {
					chunks = append(chunks, nil)
				}
				chunks[cidx] = append(chunks[cidx], n)
			}
			e.clusterNameChunks = chunks
		} else {
			e.clusterNameChunks = [][]string{{e.hubClusterName()}}
		}
		b := e.cache[cacheRemoteSys]
		if b.Resources != nil {
			b.Resources = nil
			b.ResourceMap = map[string][]App{}
		} else if len(b.ResourceMap) > 0 {
			for name := range b.ResourceMap {
				if _, ok := cm[name]; !ok {
					delete(b.ResourceMap, name)
				}
			}
		}
	}
	ch := e.clusterNameChunks[0]
	e.clusterNameChunks = e.clusterNameChunks[1:]
	return ch
}

func (e *Engine) cacheOCPApplications(search searchapi.ResultBucket, ocpArgoFilter map[string]struct{}, isSystem bool) {
	helm := e.listKind("apps.open-cluster-management.io/v1", "HelmRelease")
	hub := e.hubClusterName()
	var localApps, remoteApps []map[string]any
	var ocpApps []map[string]any
	openShiftMap := map[string][]map[string]any{}
	for _, ocpApp := range search.Items {
		if searchStr(ocpApp, "_hostingSubscription") != "" {
			continue
		}
		labels := parseSearchLabels(searchStr(ocpApp, "label"))
		itemLabel, isHelm, argoInstance := ocpLabelValues(labels)
		if itemLabel != "" && isHelm {
			hosted := false
			for _, hr := range helm {
				if metaName(hr) == itemLabel && metaNamespace(hr) == searchStr(ocpApp, "namespace") {
					if strVal(metaAnnotations(hr)["apps.open-cluster-management.io/hosting-subscription"]) != "" {
						hosted = true
					}
				}
			}
			if hosted {
				continue
			}
		}
		if itemLabel == "" {
			continue
		}
		key := itemLabel + "-" + searchStr(ocpApp, "namespace") + "-" + searchStr(ocpApp, "cluster")
		argoKey := argoInstance + "-" + searchStr(ocpApp, "namespace") + "-" + searchStr(ocpApp, "cluster")
		if _, skip := ocpArgoFilter[argoKey]; skip {
			continue
		}
		openShiftMap[key] = append(openShiftMap[key], ocpApp)
	}
	for _, values := range openShiftMap {
		value := values[0]
		appLabel := getAppNameFromLabel(searchStr(value, "label"), searchStr(value, "name"))
		api := searchStr(value, "apiversion")
		if g := searchStr(value, "apigroup"); g != "" {
			api = g + "/" + api
		}
		app := map[string]any{
			"apiVersion": api,
			"kind":       searchStr(value, "kind"),
			"label":      searchStr(value, "label"),
			"metadata": map[string]any{
				"name":              appLabel,
				"namespace":         searchStr(value, "namespace"),
				"creationTimestamp": searchStr(value, "created"),
			},
			"status": map[string]any{
				"cluster":      searchStr(value, "cluster"),
				"resourceName": searchStr(value, "name"),
			},
		}
		if searchStr(value, "cluster") == hub {
			localApps = append(localApps, app)
		} else {
			remoteApps = append(remoteApps, app)
		}
		value["type"] = getApplicationType(app, e.systemPrefixes)
		value["deployments"] = values
		ocpApps = append(ocpApps, value)
	}
	statusMap := createOCPStatusMap(ocpApps, relatedKinds(search.Related))
	if !isSystem {
		e.cache[cacheLocalOCP].Resources = e.transform(localApps, statusMap, false, nil, nil, nil)
		e.cacheRemoteApps(statusMap, remoteApps, e.lastOCPChunk, cacheRemoteOCP)
		return
	}
	if len(localApps) > 0 {
		e.cache[cacheLocalSys].Resources = e.transform(localApps, statusMap, false, nil, nil, nil)
	}
	e.cacheRemoteSystemApps(statusMap, remoteApps, e.lastSystemChunk)
}

func parseSearchLabels(label string) [][2]string {
	var out [][2]string
	clean := strings.ReplaceAll(strings.ReplaceAll(label, " ", ""), "\t", "")
	for _, part := range strings.Split(clean, ";") {
		ann, val, _ := strings.Cut(part, "=")
		out = append(out, [2]string{ann, val})
	}
	return out
}

func ocpLabelValues(labels [][2]string) (itemLabel string, isManagedByHelm bool, argoInstance string) {
	for _, p := range labels {
		ann, value := p[0], p[1]
		switch ann {
		case "app":
			itemLabel = value
		case "app.kubernetes.io/part-of":
			if itemLabel == "" {
				itemLabel = value
			}
		}
		if ann == "app.kubernetes.io/instance" {
			argoInstance = value
		}
		if ann == "app.kubernetes.io/managed-by" && value == "Helm" {
			isManagedByHelm = true
		}
	}
	return itemLabel, isManagedByHelm, argoInstance
}

func createOCPStatusMap(ocpApps []map[string]any, related []mapKind) map[string]StatusMap {
	out := map[string]StatusMap{}
	ids := map[string]*statusIDs{}
	for _, app := range ocpApps {
		appName := searchStr(app, "namespace") + "/" + getAppNameFromLabel(searchStr(app, "label"), searchStr(app, "name"))
		appKey := searchStr(app, "type") + "/" + appName
		if out[appKey] == nil {
			out[appKey] = StatusMap{}
		}
		cluster := searchStr(app, "cluster")
		st, ok := out[appKey][cluster]
		if !ok {
			st = emptyClusterStatuses()
		}
		idKey := statusIDKey(appKey, cluster)
		id := ids[idKey]
		if id == nil {
			deps, _ := app["deployments"].([]map[string]any)
			if idSlice, ok := app["deployments"].([]any); ok && deps == nil {
				for _, d := range idSlice {
					if m, ok := d.(map[string]any); ok {
						deps = append(deps, m)
					}
				}
			}
			id = &statusIDs{appName: appName, deployments: deps}
			ids[idKey] = id
		}
		id.uids = append(id.uids, searchStr(app, "_uid"))
		out[appKey][cluster] = st
	}
	computeDeployedPodStatuses(related, out, ids, true)
	return out
}

func (e *Engine) cacheRemoteSystemApps(statusMap map[string]StatusMap, remote []map[string]any, clusterChunk []string) {
	if e.cache[cacheRemoteSys].ResourceMap == nil {
		e.cache[cacheRemoteSys].ResourceMap = map[string][]App{}
	}
	for _, name := range clusterChunk {
		e.cache[cacheRemoteSys].ResourceMap[name] = []App{}
	}
	resources := e.transform(remote, statusMap, true, nil, nil, nil)
	for _, resource := range resources {
		clustername := joinKeys(resource.Transform.Clusters)
		e.cache[cacheRemoteSys].ResourceMap[clustername] = append(e.cache[cacheRemoteSys].ResourceMap[clustername], resource)
	}
}
