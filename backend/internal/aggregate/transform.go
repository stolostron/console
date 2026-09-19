// Copyright Contributors to the Open Cluster Management project

package aggregate

import "strings"

func getApplicationType(obj map[string]any, prefixes []string) string {
	api := apiVersionOf(obj)
	kind := kindOf(obj)
	if api == "app.k8s.io/v1beta1" && kind == "Application" {
		return kindSubscriptionApp
	}
	if api == "argoproj.io/v1alpha1" {
		if kind == "Application" {
			return kindArgo
		}
		if kind == "ApplicationSet" {
			return kindAppSet
		}
	}
	if label, ok := obj["label"].(string); ok {
		if isFluxApplication(label) {
			return kindFlux
		}
		if isSystemApp(metaNamespace(obj), prefixes) {
			return kindOpenShiftDefault
		}
		return kindOpenShift
	}
	return "-"
}

func isFluxApplication(label string) bool {
	for _, pair := range fluxAnnotations {
		if strings.Contains(label, pair[0]) && strings.Contains(label, pair[1]) {
			return true
		}
	}
	return false
}

func isSystemApp(namespace string, prefixes []string) bool {
	if namespace == "" {
		return false
	}
	for _, p := range prefixes {
		if strings.HasPrefix(namespace, p) {
			return true
		}
	}
	return false
}

func getAppNamespace(obj map[string]any) string {
	ns := metaNamespace(obj)
	if apiVersionOf(obj) == "argoproj.io/v1alpha1" && kindOf(obj) == "Application" {
		if dest := nestedString(obj, "spec", "destination", "namespace"); dest != "" {
			return dest
		}
	}
	return ns
}

func getAppNameFromLabel(label, defaultName string) string {
	matching := ""
	for _, p := range appOwnerLabels {
		if strings.Contains(label, p) {
			matching = p
			break
		}
	}
	if matching == "" {
		return defaultName
	}
	start := strings.Index(label, matching) + len(matching)
	rest := label[start:]
	if i := strings.Index(rest, ";"); i >= 0 {
		return rest[:i]
	}
	return rest
}

func getTransform(obj map[string]any, typ string, clusterStatusMap map[string]StatusMap, clusters []string) Transform {
	statusKey := typ + "/" + metaNamespace(obj) + "/" + metaName(obj)
	statuses := getAppStatuses(typ, statusKey, clusterStatusMap, clusters)
	return Transform{
		Name:      metaName(obj),
		Type:      typ,
		Namespace: getAppNamespace(obj),
		Clusters:  clusters,
		Statuses:  statuses,
		Scores:    getAppStatusScores(clusters, statuses),
		Created:   metaCreation(obj),
	}
}

func getAppStatuses(typ, statusKey string, clusterStatusMap map[string]StatusMap, clusters []string) StatusMap {
	if appStatuses, ok := clusterStatusMap[statusKey]; ok && appStatuses != nil {
		return appStatuses
	}
	if typ == kindAppSet {
		if len(clusters) == 0 {
			clusters = append(clusters, "-")
		}
		out := StatusMap{}
		for _, cluster := range clusters {
			out[cluster] = missingClusterStatuses()
		}
		return out
	}
	return StatusMap{}
}

func getAppStatusScores(clusters []string, statuses StatusMap) Scores {
	return Scores{
		colHealth:   getAppStatusScore(clusters, statuses, colHealth),
		colSynced:   getAppStatusScore(clusters, statuses, colSynced),
		colDeployed: getAppStatusScore(clusters, statuses, colDeployed),
	}
}

func getAppStatusScore(clusters []string, statuses StatusMap, index int) int {
	score := 0
	for _, cluster := range clusters {
		stats, ok := statuses[cluster]
		if !ok {
			continue
		}
		var column []int
		switch index {
		case colHealth:
			column = stats.Health.Counts
		case colSynced:
			column = stats.Synced.Counts
		case colDeployed:
			column = stats.Deployed.Counts
		}
		if len(column) >= scoreColumnSize {
			score = column[scoreDanger]*1000000 +
				column[scoreWarning]*100000 +
				column[scoreProgress]*10000 +
				column[scoreUnknown]*1000 +
				column[scoreHealthy]
		}
	}
	return score
}

func (e *Engine) transform(items []map[string]any, statusMap map[string]StatusMap, isRemote bool, local *Cluster, clusters []Cluster, uidMap map[string]App) []App {
	subs := e.listKind("apps.open-cluster-management.io/v1", "Subscription")
	placements := e.listKind("cluster.open-cluster-management.io/v1beta1", "PlacementDecision")
	hub := e.hubClusterName()
	out := make([]App, 0, len(items))
	for _, raw := range items {
		app := cloneMap(raw)
		typ := getApplicationType(app, e.systemPrefixes)
		if typ == kindSubscriptionApp {
			if ann := strVal(metaAnnotations(app)["apps.open-cluster-management.io/subscriptions"]); ann != "" {
				allLabels := map[string]any{}
				for _, ref := range strings.Split(ann, ",") {
					parts := strings.Split(strings.TrimSpace(ref), "/")
					if len(parts) != 2 {
						continue
					}
					for _, s := range subs {
						if metaNamespace(s) == parts[0] && metaName(s) == parts[1] {
							for k, v := range metaLabels(s) {
								allLabels[k] = v
							}
						}
					}
				}
				if len(allLabels) > 0 {
					meta := metaMap(app)
					if meta == nil {
						meta = map[string]any{}
						app["metadata"] = meta
					}
					labels := metaLabels(app)
					if labels == nil {
						labels = map[string]any{}
					}
					for k, v := range allLabels {
						labels[k] = v
					}
					meta["labels"] = labels
				}
			}
		}
		cls := e.applicationClusters(app, typ, subs, placements, local, clusters)
		row := App{
			Object:    app,
			Transform: getTransform(app, typ, statusMap, cls),
		}
		remote := isRemote
		if !remote && typ == kindSubscriptionApp {
			for _, n := range cls {
				if n != hub {
					remote = true
					break
				}
			}
		}
		if remote {
			row.RemoteClusters = cls
		}
		if uidMap != nil {
			uidMap[metaUID(app)] = row
		}
		out = append(out, row)
	}
	return out
}

func getApplicationsHelper(cache map[string]*cacheBucket, keys []string) []App {
	var items []App
	for _, key := range keys {
		b := cache[key]
		if b == nil {
			continue
		}
		if b.Resources != nil {
			items = append(items, b.Resources...)
			continue
		}
		if b.ResourceUIDMap != nil {
			for _, a := range b.ResourceUIDMap {
				items = append(items, a)
			}
			continue
		}
		if b.ResourceMap != nil {
			for _, list := range b.ResourceMap {
				items = append(items, list...)
			}
		}
	}
	return items
}

func filterApplications(filters map[string][]string, items []App) []App {
	if len(filters) == 0 {
		return items
	}
	out := make([]App, 0, len(items))
	for _, item := range items {
		ok := true
		for filter, values := range filters {
			match := false
			switch filter {
			case "type":
				for _, v := range values {
					if v == item.Transform.Type {
						match = true
						break
					}
				}
			case "cluster":
				for _, v := range values {
					for _, c := range item.Transform.Clusters {
						if c == v {
							match = true
							break
						}
					}
				}
			case "podStatuses":
				key := statusFilterKey(item, colDeployed)
				for _, v := range values {
					if v == key {
						match = true
						break
					}
				}
			case "healthStatus":
				key := statusFilterKey(item, colHealth)
				for _, v := range values {
					if v == key {
						match = true
						break
					}
				}
			case "syncStatus":
				key := statusFilterKey(item, colSynced)
				for _, v := range values {
					if v == key {
						match = true
						break
					}
				}
			default:
				match = false
			}
			if !match {
				ok = false
				break
			}
		}
		if ok {
			out = append(out, item)
		}
	}
	return out
}

func statusFilterKey(item App, index int) string {
	score := 0
	if item.Transform.Scores != nil {
		score = item.Transform.Scores[index]
	}
	switch index {
	case colHealth:
		if score < 1000 {
			return "Healthy"
		}
		return "Unhealthy"
	case colSynced:
		if score < 1000 {
			return "Synced"
		}
		return "OutOfSync"
	case colDeployed:
		if score < 1000 {
			return "Deployed"
		}
		return "Not Deployed"
	default:
		return ""
	}
}

func sortApplications(index int, desc bool, items []App) []App {
	out := append([]App(nil), items...)
	stringCols := map[int]struct{}{colName: {}, colNamespace: {}, colClusters: {}, colCreated: {}}
	scoreCols := map[int]struct{}{colHealth: {}, colSynced: {}, colDeployed: {}}
	less := func(i, j int) bool { return false }
	if _, ok := stringCols[index]; ok {
		less = func(i, j int) bool {
			a := transformString(out[i], index)
			b := transformString(out[j], index)
			if a == "" || b == "" {
				return false
			}
			return a < b
		}
	} else if _, ok := scoreCols[index]; ok {
		less = func(i, j int) bool {
			// Node comparator is bScore - aScore (higher score first).
			return out[i].Transform.Scores[index] > out[j].Transform.Scores[index]
		}
	}
	// insertion sort matching a stable-ish order
	for i := 1; i < len(out); i++ {
		for j := i; j > 0 && less(j, j-1); j-- {
			out[j], out[j-1] = out[j-1], out[j]
		}
	}
	if desc {
		for i, k := 0, len(out)-1; i < k; i, k = i+1, k-1 {
			out[i], out[k] = out[k], out[i]
		}
	}
	return out
}

func transformString(a App, index int) string {
	switch index {
	case colName:
		return a.Transform.Name
	case colNamespace:
		return a.Transform.Namespace
	case colClusters:
		if len(a.Transform.Clusters) == 0 {
			return ""
		}
		return a.Transform.Clusters[0]
	case colCreated:
		return a.Transform.Created
	default:
		return ""
	}
}

func (e *Engine) addUIData(items []App) []App {
	e.mu.RLock()
	defer e.mu.RUnlock()
	argoAppSets := getApplicationsHelper(e.cache, []string{cacheAppSet})
	out := make([]App, len(items))
	for i, item := range items {
		out[i] = item
		apps := []string{}
		placement := []any{"", []string{}}
		if kindOf(item.Object) == "ApplicationSet" {
			placement = e.appSetPlacementData(item.Object, argoAppSets)
			if list := e.appSetAppsMap[metaName(item.Object)]; list != nil {
				for _, app := range list {
					apps = append(apps, metaName(app))
				}
			}
		}
		out[i].UIData = &UIData{
			ClusterList:         item.Transform.Clusters,
			AppClusterStatuses:  []StatusMap{item.Transform.Statuses},
			AppSetPlacementData: placement,
			AppSetApps:          apps,
		}
		if out[i].Transform.Clusters == nil {
			out[i].UIData.ClusterList = []string{}
		}
	}
	return out
}
