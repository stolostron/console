// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"net/url"
	"strconv"
	"strings"
)

// Cluster is the aggregator subset of a managed cluster.
type Cluster struct {
	Name          string
	KubeAPIServer string
	ConsoleURL    string
}

func (e *Engine) clusters() []Cluster {
	managed := e.listKind("cluster.open-cluster-management.io/v1", "ManagedCluster")
	cds := e.listKind("hive.openshift.io/v1", "ClusterDeployment")
	infos := e.listKind("internal.open-cluster-management.io/v1beta1", "ManagedClusterInfo")
	hosted := e.listKind("hypershift.openshift.io/v1beta1", "HostedCluster")

	filteredCD := make([]map[string]any, 0, len(cds))
	for _, cd := range cds {
		skip := false
		if owners, _ := metaMap(cd)["ownerReferences"].([]any); len(owners) > 0 {
			for _, o := range owners {
				om, _ := o.(map[string]any)
				if strVal(om["kind"]) == "AgentCluster" {
					skip = true
					break
				}
			}
		}
		if !skip {
			filteredCD = append(filteredCD, cd)
		}
	}

	names := map[string]struct{}{}
	add := func(n string) {
		if n != "" {
			names[n] = struct{}{}
		}
	}
	for _, cd := range filteredCD {
		add(metaName(cd))
	}
	for _, mc := range infos {
		add(metaName(mc))
	}
	for _, mc := range managed {
		add(metaName(mc))
	}
	for _, hc := range hosted {
		add(metaName(hc))
	}

	mcMap := keyByName(managed)
	hcMap := keyByName(hosted)
	cdMap := keyByName(filteredCD)
	infoMap := keyByName(infos)

	out := make([]Cluster, 0, len(names))
	for name := range names {
		cd := cdMap[name]
		mc := mcMap[name]
		info := infoMap[name]
		hc := hcMap[name]
		out = append(out, Cluster{
			Name:          firstNonEmpty(metaName(cd), metaName(mc), metaName(info), metaName(hc)),
			KubeAPIServer: kubeAPIServer(cd, info),
			ConsoleURL:    consoleURL(cd, info, mc, hc),
		})
	}
	return out
}

func keyByName(items []map[string]any) map[string]map[string]any {
	out := map[string]map[string]any{}
	for _, item := range items {
		if n := metaName(item); n != "" {
			out[n] = item
		}
	}
	return out
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}

func kubeAPIServer(cd, info map[string]any) string {
	if u := nestedString(cd, "status", "apiURL"); u != "" {
		return u
	}
	if u := nestedString(info, "spec", "masterEndpoint"); u != "" {
		return u
	}
	cn := nestedString(cd, "spec", "clusterName")
	bd := nestedString(cd, "spec", "baseDomain")
	return "https://api." + cn + "." + bd
}

func consoleURL(cd, info, mc, hosted map[string]any) string {
	if claims := nestedSlice(mc, "status", "clusterClaims"); len(claims) > 0 {
		for _, raw := range claims {
			claim, _ := raw.(map[string]any)
			if strVal(claim["name"]) == "consoleurl.cluster.open-cluster-management.io" {
				if v := strVal(claim["value"]); v != "" {
					return v
				}
			}
		}
	}
	if u := nestedString(cd, "status", "webConsoleURL"); u != "" {
		return u
	}
	if u := nestedString(info, "status", "consoleURL"); u != "" {
		return u
	}
	return hypershiftConsoleURL(hosted)
}

func hypershiftConsoleURL(hosted map[string]any) string {
	if hosted == nil {
		return ""
	}
	name := metaName(hosted)
	base := nestedString(hosted, "spec", "dns", "baseDomain")
	if name == "" || base == "" {
		return ""
	}
	return "https://console-openshift-console.apps." + name + "." + base
}

func (e *Engine) clusterMap() map[string]map[string]any {
	out := map[string]map[string]any{}
	for _, c := range e.listKind("cluster.open-cluster-management.io/v1", "ManagedCluster") {
		if n := metaName(c); n != "" {
			out[n] = c
		}
	}
	return out
}

func (e *Engine) applicationClusters(obj map[string]any, typ string, subscriptions, placementDecisions []map[string]any, local *Cluster, clusters []Cluster) []string {
	switch typ {
	case kindFlux, kindOpenShift, kindOpenShiftDefault:
		if st, _ := obj["status"].(map[string]any); st != nil {
			if c := strVal(st["cluster"]); c != "" {
				return []string{c}
			}
		}
	case kindArgo:
		return []string{e.argoCluster(obj, clusters)}
	case kindAppSet:
		if isArgoPullModel(obj) {
			return argoPullModelClusters(e.pulledAppSetMap[metaName(obj)])
		}
		return e.argoPushModelClusters(e.appSetAppsMap[metaName(obj)], local, clusters)
	case kindSubscriptionApp:
		return subscriptionClusters(obj, subscriptions, placementDecisions)
	}
	return []string{e.hubClusterName()}
}

func isArgoPullModel(obj map[string]any) bool {
	return nestedString(obj, "spec", "template", "metadata", "annotations", "apps.open-cluster-management.io/ocm-managed-cluster") != ""
}

func argoPullModelClusters(apps []map[string]any) []string {
	set := map[string]struct{}{}
	for _, app := range apps {
		if c := searchStr(app, "cluster"); c != "" {
			set[c] = struct{}{}
		}
	}
	return setKeys(set)
}

func (e *Engine) argoPushModelClusters(resources []map[string]any, local *Cluster, managed []Cluster) []string {
	set := map[string]struct{}{}
	localName := ""
	if local != nil {
		localName = local.Name
	}
	for _, resource := range resources {
		clusterHint := nestedString(resource, "status", "cluster")
		isRemote := clusterHint != ""

		dest := nestedMap(resource, "spec", "destination")
		destName := strVal(dest["name"])
		destServer := strVal(dest["server"])

		if (destName == "in-cluster" || destName == localName || isLocalClusterURL(destServer, local)) && !isRemote {
			set[localName] = struct{}{}
			continue
		}
		set[e.argoDestinationCluster(dest, managed, clusterHint, localName)] = struct{}{}
	}
	return setKeys(set)
}

func isLocalClusterURL(raw string, local *Cluster) bool {
	if raw == "https://kubernetes.default.svc" {
		return true
	}
	localHost := "localhost"
	if local != nil && local.ConsoleURL != "" {
		if u, err := url.Parse(local.ConsoleURL); err == nil {
			localHost = u.Host
		}
	}
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := u.Hostname()
	idx := strings.Index(host, "api.")
	if idx < 0 {
		return strings.Contains(localHost, host)
	}
	hostnameWithoutAPI := host[idx+4:]
	return strings.Contains(localHost, hostnameWithoutAPI)
}

func subscriptionClusters(obj map[string]any, subscriptions, placementDecisions []map[string]any) []string {
	set := map[string]struct{}{}
	ann := strVal(metaAnnotations(obj)["apps.open-cluster-management.io/subscriptions"])
	if ann == "" {
		return nil
	}
	subs := strings.Split(ann, ",")
	for _, sa := range subs {
		if isLocalSubscription(sa, subs) {
			continue
		}
		details := strings.Split(sa, "/")
		if len(details) < 2 {
			continue
		}
		for _, sub := range subscriptions {
			if metaName(sub) != details[1] || metaNamespace(sub) != details[0] {
				continue
			}
			placementRef := nestedString(sub, "spec", "placement", "placementRef", "name")
			for _, pd := range placementDecisions {
				labels := metaLabels(pd)
				if strVal(labels["cluster.open-cluster-management.io/placement"]) != placementRef {
					continue
				}
				for _, d := range nestedSlice(pd, "status", "decisions") {
					dm, _ := d.(map[string]any)
					if n := strVal(dm["clusterName"]); n != "" {
						set[n] = struct{}{}
					}
				}
			}
		}
	}
	return setKeys(set)
}

func isLocalSubscription(subName string, subList []string) bool {
	const suffix = "-local"
	if !strings.HasSuffix(subName, suffix) {
		return false
	}
	base := subName[:len(subName)-len(suffix)]
	for _, s := range subList {
		if s == base {
			return true
		}
	}
	return false
}

func (e *Engine) argoCluster(obj map[string]any, clusters []Cluster) string {
	if c := nestedString(obj, "status", "cluster"); c != "" {
		return c
	}
	dest := nestedMap(obj, "spec", "destination")
	hub := e.hubClusterName()
	if strVal(dest["name"]) == "in-cluster" || strVal(dest["name"]) == hub || strVal(dest["server"]) == "https://kubernetes.default.svc" {
		return hub
	}
	return e.argoDestinationCluster(dest, clusters, nestedString(obj, "status", "cluster"), hub)
}

func (e *Engine) argoDestinationCluster(dest map[string]any, clusters []Cluster, cluster, hubName string) string {
	if dest == nil {
		return "unknown"
	}
	serverAPI := strVal(dest["server"])
	if serverAPI != "" {
		if serverAPI == "https://kubernetes.default.svc" {
			if cluster != "" {
				return cluster
			}
			return hubName
		}
		if svc := e.clusterProxyService(); svc != nil {
			for _, cls := range clusters {
				if clusterProxyURL(svc, cls.Name) == serverAPI {
					return cls.Name
				}
			}
		} else {
			for _, cls := range clusters {
				if cls.KubeAPIServer == serverAPI {
					return cls.Name
				}
			}
		}
		return "unknown"
	}
	clusterName := strVal(dest["name"])
	if clusterName == "" {
		clusterName = "unknown"
	}
	if cluster != "" && (clusterName == "in-cluster" || clusterName == hubName) {
		clusterName = cluster
	}
	if clusterName == "in-cluster" {
		clusterName = hubName
	}
	return clusterName
}

func (e *Engine) clusterProxyService() map[string]any {
	for _, s := range e.listKind("v1", "Service") {
		if metaName(s) == "cluster-proxy-addon-user" && metaNamespace(s) == "multicluster-engine" {
			return s
		}
	}
	return nil
}

func clusterProxyURL(service map[string]any, cluster string) string {
	if service == nil || cluster == "" {
		return ""
	}
	port := 9092
	if ports := nestedSlice(service, "spec", "ports"); len(ports) > 0 {
		if p, ok := ports[0].(map[string]any); ok {
			switch v := p["port"].(type) {
			case float64:
				port = int(v)
			case int:
				port = v
			}
		}
	}
	return "https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:" + strconv.Itoa(port) + "/" + cluster
}

func setKeys(set map[string]struct{}) []string {
	out := make([]string, 0, len(set))
	for k := range set {
		out = append(out, k)
	}
	return out
}
