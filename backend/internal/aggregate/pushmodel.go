// Copyright Contributors to the Open Cluster Management project

package aggregate

import "github.com/stolostron/console/backend/internal/searchapi"

func (e *Engine) addPushModelPodQueryInputs(q *searchapi.Query) (map[string]pushEntry, error) {
	resourceMap := map[string]pushEntry{}
	hub := e.hubClusterName()
	allClusters := e.clusters()
	deploymentNames := map[string]struct{}{}
	clusterFilters := map[string]struct{}{}
	e.mu.RLock()
	appSetApps := e.appSetAppsMap
	e.mu.RUnlock()
	for appSetName, apps := range appSetApps {
		e.collectPushModelWorkloads(apps, appSetName, allClusters, hub, resourceMap, deploymentNames, clusterFilters)
	}
	if len(deploymentNames) == 0 {
		return resourceMap, nil
	}
	q.Variables.Input = append(q.Variables.Input, searchapi.Input{
		Filters: []searchapi.Filter{
			{Property: "kind", Values: []string{"Deployment", "StatefulSet"}},
			{Property: "name", Values: setKeys(deploymentNames)},
			{Property: "cluster", Values: setKeys(clusterFilters)},
		},
		RelatedKinds: []string{"Pod", "ReplicaSet"},
		Limit:        searchQueryLimit,
	})
	return resourceMap, nil
}

func (e *Engine) collectPushModelWorkloads(apps []map[string]any, appSetName string, allClusters []Cluster, hub string, resourceMap map[string]pushEntry, deploymentNames, clusterFilters map[string]struct{}) {
	for _, app := range apps {
		dest := nestedMap(app, "spec", "destination")
		target := e.argoDestinationCluster(dest, allClusters, "", hub)
		if target == "" || target == hub {
			continue
		}
		resources := nestedSlice(app, "status", "resources")
		if len(resources) == 0 {
			continue
		}
		appSetKey := "appset/" + metaNamespace(app) + "/" + appSetName
		clusterFilters[target] = struct{}{}
		for _, raw := range resources {
			res, _ := raw.(map[string]any)
			kind := strVal(res["kind"])
			if kind != "Deployment" && kind != "StatefulSet" {
				continue
			}
			ns := strVal(res["namespace"])
			if ns == "" && dest != nil {
				ns = strVal(dest["namespace"])
			}
			name := strVal(res["name"])
			deploymentNames[name] = struct{}{}
			resourceMap[target+"/"+ns+"/"+name] = pushEntry{appSetKey: appSetKey, targetCluster: target}
		}
	}
}
