// Copyright Contributors to the Open Cluster Management project

package aggregate

import "strings"

func extractMessages(entry *StatusEntry, item map[string]any, status string) {
	if status != "" {
		entry.Messages = append(entry.Messages, map[string]string{"key": "Status", "value": status})
	}
	for k, v := range item {
		if strings.HasPrefix(k, "_") && (strings.Contains(k, "condition") || strings.Contains(k, "missing")) {
			exists := false
			for _, msg := range entry.Messages {
				if msg["key"] == k {
					exists = true
					break
				}
			}
			if !exists {
				entry.Messages = append(entry.Messages, map[string]string{"key": k, "value": strVal(v)})
			}
		}
	}
}

func computeAppHealthStatus(health *StatusEntry, app map[string]any) {
	switch searchStr(app, "healthStatus") {
	case "Healthy":
		health.Counts[scoreHealthy]++
	case "Degraded":
		health.Counts[scoreDanger]++
		extractMessages(health, app, searchStr(app, "healthStatus"))
	case "Progressing":
		health.Counts[scoreProgress]++
		extractMessages(health, app, searchStr(app, "healthStatus"))
	case "Unknown":
		health.Counts[scoreUnknown]++
		extractMessages(health, app, searchStr(app, "healthStatus"))
	default:
		health.Counts[scoreWarning]++
		extractMessages(health, app, searchStr(app, "healthStatus"))
	}
}

func computeAppSyncStatus(synced *StatusEntry, app map[string]any) {
	switch searchStr(app, "syncStatus") {
	case "Synced":
		synced.Counts[scoreHealthy]++
	case "OutOfSync":
		synced.Counts[scoreWarning]++
	case "Unknown":
		synced.Counts[scoreUnknown]++
		extractMessages(synced, app, searchStr(app, "syncStatus"))
	default:
		synced.Counts[scoreDanger]++
		extractMessages(synced, app, searchStr(app, "syncStatus"))
	}
}

func computePodStatus(deployed *StatusEntry, pods []map[string]any) {
	for _, pod := range pods {
		status := lower(searchStr(pod, "status"))
		if status == "terminating" {
			continue
		}
		if _, ok := resErrorStates[status]; ok {
			deployed.Counts[scoreDanger]++
			extractMessages(deployed, pod, status)
		} else if _, ok := resWarningStates[status]; ok {
			deployed.Counts[scoreWarning]++
			extractMessages(deployed, pod, status)
		} else {
			deployed.Counts[scoreHealthy]++
		}
	}
}

type relatedMaps struct {
	byName map[string][]map[string]any
	byUID  map[string][]map[string]any
}

type statusIDs struct {
	appName     string
	deployments []map[string]any
	uids        []string
}

func relatedKindItems(related []mapKind, kind string) []map[string]any {
	for _, r := range related {
		if r.Kind == kind {
			return r.Items
		}
	}
	return nil
}

func createResourceMap(related []mapKind, kind string) relatedMaps {
	byName := map[string][]map[string]any{}
	byUID := map[string][]map[string]any{}
	for _, item := range relatedKindItems(related, kind) {
		name := getAppNameFromLabel(searchStr(item, "label"), "")
		if name != "" {
			key := searchStr(item, "cluster") + "/" + searchStr(item, "namespace") + "/" + name
			byName[key] = append(byName[key], item)
		}
		if uids, ok := item["_relatedUids"].([]any); ok {
			for _, u := range uids {
				uid := strVal(u)
				byUID[uid] = append(byUID[uid], item)
			}
		}
	}
	return relatedMaps{byName: byName, byUID: byUID}
}

func collectRelatedResources(cluster string, m relatedMaps, ids statusIDs) []map[string]any {
	var items []map[string]any
	if len(ids.deployments) > 1 {
		for _, d := range ids.deployments {
			key := cluster + "/" + searchStr(d, "namespace") + "/" + searchStr(d, "name")
			if found := m.byName[key]; len(found) > 0 {
				items = append(items, found...)
			} else if found := m.byUID[searchStr(d, "_uid")]; len(found) > 0 {
				items = append(items, found...)
			}
		}
	} else {
		items = append(items, m.byName[cluster+"/"+ids.appName]...)
	}
	if len(items) == 0 {
		for _, uid := range ids.uids {
			items = append(items, m.byUID[uid]...)
		}
	}
	uniq := map[string]map[string]any{}
	for _, item := range items {
		if uid := searchStr(item, "_uid"); uid != "" {
			uniq[uid] = item
		}
	}
	out := make([]map[string]any, 0, len(uniq))
	for _, item := range uniq {
		out = append(out, item)
	}
	return out
}

type mapKind struct {
	Kind  string
	Items []map[string]any
}

func statusIDKey(appKey, cluster string) string {
	return appKey + "\x00" + cluster
}

func computeDeployedPodStatuses(related []mapKind, appStatusesMap map[string]StatusMap, ids map[string]*statusIDs, ignoreHealthCheck bool) {
	deploymentMap := createResourceMap(related, "Deployment")
	replicaSetMap := createResourceMap(related, "ReplicaSet")
	podMap := createResourceMap(related, "Pod")
	for appKey, clusterMap := range appStatusesMap {
		for clusterKey, appStatuses := range clusterMap {
			if !(appStatuses.Health.Counts[scoreHealthy] > 0 && appStatuses.Synced.Counts[scoreHealthy] > 0) && !ignoreHealthCheck {
				continue
			}
			id := ids[statusIDKey(appKey, clusterKey)]
			if id == nil {
				continue
			}
			podItems := collectRelatedResources(clusterKey, podMap, *id)
			replicaItems := collectRelatedResources(clusterKey, replicaSetMap, *id)
			deploymentItems := collectRelatedResources(clusterKey, deploymentMap, *id)
			computePodStatus(&appStatuses.Deployed, podItems)
			currentPodCount := appStatuses.Deployed.Counts[scoreDanger] + appStatuses.Deployed.Counts[scoreWarning] +
				appStatuses.Deployed.Counts[scoreHealthy] + appStatuses.Deployed.Counts[scoreProgress]
			desiredPodCount := 0
			if len(replicaItems) > 0 {
				for _, item := range replicaItems {
					desiredPodCount += int(searchFloat(item, "desired"))
				}
			}
			if len(deploymentItems) > 0 {
				prod := 1
				for _, item := range deploymentItems {
					d := searchFloat(item, "desired")
					if d == 0 {
						d = 1
					}
					prod *= int(d)
				}
				desiredPodCount *= prod
			}
			if currentPodCount < desiredPodCount {
				missingCount := desiredPodCount - currentPodCount
				process := func(items []map[string]any) {
					for _, item := range items {
						if missingCount <= 0 {
							break
						}
						available := searchFloat(item, "available")
						if available == 0 {
							available = searchFloat(item, "current")
						}
						desired := searchFloat(item, "desired")
						if available == desired {
							continue
						}
						if available < desired || desired <= 0 {
							appStatuses.Deployed.Counts[scoreProgress]++
							extractMessages(&appStatuses.Deployed, item, "")
							missingCount--
						} else if item["desired"] == nil || available == 0 {
							appStatuses.Deployed.Counts[scoreDanger]++
							extractMessages(&appStatuses.Deployed, item, "")
							missingCount--
						}
					}
				}
				process(replicaItems)
				process(deploymentItems)
				if missingCount > 0 {
					appStatuses.Deployed.Counts[scoreWarning] += missingCount
					appStatuses.Deployed.Messages = []map[string]string{}
				}
			} else if currentPodCount == 0 && desiredPodCount == 0 {
				appStatuses.Deployed.Counts = make([]int, scoreColumnSize)
			}
			clusterMap[clusterKey] = appStatuses
		}
	}
}
