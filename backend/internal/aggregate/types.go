// Copyright Contributors to the Open Cluster Management project

// Package aggregate serves POST /aggregate/{applications,statuses,appSetData} (ACM-42600).
package aggregate

import (
	"encoding/json"
	"strings"
)

const (
	appSearchLimitDefault    = 5000
	searchQueryLimit         = 20000
	preprocessBreakpoint     = 500
	scoreColumnSize          = 5
	remoteClusterChunks      = 10
	firstPassesFastInterval  = 3
	appSearchIntervalDefault = 60
)

// AppColumns matches Node aggregators/applications.ts.
const (
	colName      = 0
	colType      = 1
	colNamespace = 2
	colClusters  = 3
	colHealth    = 4
	colSynced    = 5
	colDeployed  = 6
	colCreated   = 7
)

const (
	scoreHealthy  = 0
	scoreProgress = 1
	scoreWarning  = 2
	scoreDanger   = 3
	scoreUnknown  = 4
)

const (
	kindSubscriptionApp  = "subscription"
	kindArgo             = "argo"
	kindAppSet           = "appset"
	kindFlux             = "flux"
	kindOpenShift        = "openshift"
	kindOpenShiftDefault = "openshift-default"
)

const (
	cacheSubscription = "subscription"
	cacheAppSet       = "appset"
	cacheLocalArgo    = "localArgoApps"
	cacheRemoteArgo   = "remoteArgoApps"
	cacheLocalOCP     = "localOCPApps"
	cacheRemoteOCP    = "remoteOCPApps"
	cacheLocalSys     = "localSysApps"
	cacheRemoteSys    = "remoteSysApps"
)

var cacheKeys = []string{
	cacheSubscription, cacheAppSet, cacheLocalArgo, cacheRemoteArgo,
	cacheLocalOCP, cacheRemoteOCP, cacheLocalSys, cacheRemoteSys,
}

var appOwnerLabels = []string{
	"kustomize.toolkit.fluxcd.io/name=",
	"helm.toolkit.fluxcd.io/name=",
	"app=",
	"app.kubernetes.io/part-of=",
}

var fluxAnnotations = [][2]string{
	{"helm.toolkit.fluxcd.io/name", "helm.toolkit.fluxcd.io/namespace"},
	{"kustomize.toolkit.fluxcd.io/name", "kustomize.toolkit.fluxcd.io/namespace"},
}

var resErrorStates = map[string]struct{}{
	"err": {}, "off": {}, "invalid": {}, "kill": {}, "propagationfailed": {},
	"imagepullbackoff": {}, "crashloopbackoff": {}, "lost": {},
}

var resWarningStates = map[string]struct{}{
	"pending": {}, "creating": {}, "terminating": {},
}

// StatusEntry is [counts[], messages[]].
type StatusEntry struct {
	Counts   []int               `json:"-"`
	Messages []map[string]string `json:"-"`
}

func emptyStatusEntry() StatusEntry {
	return StatusEntry{Counts: make([]int, scoreColumnSize), Messages: []map[string]string{}}
}

func missingStatusEntry() StatusEntry {
	return StatusEntry{Counts: []int{0, 0, 0, 0, 1}, Messages: []map[string]string{{"key": "Status", "value": "Missing"}}}
}

func emptyDeployedEntry() StatusEntry {
	return StatusEntry{Counts: make([]int, scoreColumnSize), Messages: []map[string]string{}}
}

func (s StatusEntry) MarshalJSON() ([]byte, error) {
	return json.Marshal([]any{s.Counts, s.Messages})
}

func (c ClusterStatuses) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]StatusEntry{
		"health":   c.Health,
		"synced":   c.Synced,
		"deployed": c.Deployed,
	})
}

// ClusterStatuses is health/synced/deployed for one cluster.
type ClusterStatuses struct {
	Health   StatusEntry
	Synced   StatusEntry
	Deployed StatusEntry
}

func emptyClusterStatuses() ClusterStatuses {
	return ClusterStatuses{
		Health:   emptyStatusEntry(),
		Synced:   emptyStatusEntry(),
		Deployed: emptyStatusEntry(),
	}
}

func missingClusterStatuses() ClusterStatuses {
	return ClusterStatuses{
		Health:   missingStatusEntry(),
		Synced:   missingStatusEntry(),
		Deployed: emptyDeployedEntry(),
	}
}

// StatusMap is cluster name → statuses.
type StatusMap map[string]ClusterStatuses

// Scores is keyed by AppColumns health/synced/deployed.
type Scores map[int]int

// Transform is the in-memory list/sort/filter projection.
type Transform struct {
	Name      string
	Type      string
	Namespace string
	Clusters  []string
	Statuses  StatusMap
	Scores    Scores
	Created   string
}

// App is a cached application row (no deflate).
type App struct {
	Object         map[string]any
	Transform      Transform
	RemoteClusters []string
	UIData         *UIData
}

// MarshalJSON emits the K8s object plus optional uidata.
func (a App) MarshalJSON() ([]byte, error) {
	out := cloneMap(a.Object)
	if out == nil {
		out = map[string]any{}
	}
	if a.UIData != nil {
		out["uidata"] = a.UIData
	}
	return json.Marshal(out)
}

// UIData is attached for the Applications UI then returned in JSON.
type UIData struct {
	ClusterList         []string    `json:"clusterList"`
	AppClusterStatuses  []StatusMap `json:"appClusterStatuses"`
	AppSetPlacementData []any       `json:"appSetPlacementData"`
	AppSetApps          []string    `json:"appSetApps"`
}

func cloneMap(m map[string]any) map[string]any {
	if m == nil {
		return nil
	}
	out := make(map[string]any, len(m))
	for k, v := range m {
		out[k] = v
	}
	return out
}

type cacheBucket struct {
	Resources      []App
	ResourceMap    map[string][]App
	ResourceUIDMap map[string]App
}

func emptyCache() map[string]*cacheBucket {
	out := make(map[string]*cacheBucket, len(cacheKeys))
	for _, k := range cacheKeys {
		out[k] = &cacheBucket{Resources: []App{}}
	}
	return out
}

func strVal(v any) string {
	s, _ := v.(string)
	return s
}

func metaMap(obj map[string]any) map[string]any {
	if obj == nil {
		return nil
	}
	m, _ := obj["metadata"].(map[string]any)
	return m
}

func metaName(obj map[string]any) string {
	return strVal(metaMap(obj)["name"])
}

func metaNamespace(obj map[string]any) string {
	return strVal(metaMap(obj)["namespace"])
}

func metaUID(obj map[string]any) string {
	return strVal(metaMap(obj)["uid"])
}

func metaCreation(obj map[string]any) string {
	return strVal(metaMap(obj)["creationTimestamp"])
}

func metaLabels(obj map[string]any) map[string]any {
	m, _ := metaMap(obj)["labels"].(map[string]any)
	return m
}

func metaAnnotations(obj map[string]any) map[string]any {
	m, _ := metaMap(obj)["annotations"].(map[string]any)
	return m
}

func kindOf(obj map[string]any) string {
	return strVal(obj["kind"])
}

func apiVersionOf(obj map[string]any) string {
	return strVal(obj["apiVersion"])
}

func nestedMap(obj map[string]any, keys ...string) map[string]any {
	cur := obj
	for _, k := range keys {
		if cur == nil {
			return nil
		}
		n, _ := cur[k].(map[string]any)
		cur = n
	}
	return cur
}

func nestedString(obj map[string]any, keys ...string) string {
	if len(keys) == 0 {
		return ""
	}
	cur := obj
	for i, k := range keys {
		if cur == nil {
			return ""
		}
		if i == len(keys)-1 {
			return strVal(cur[k])
		}
		n, _ := cur[k].(map[string]any)
		cur = n
	}
	return ""
}

func nestedSlice(obj map[string]any, keys ...string) []any {
	if len(keys) == 0 {
		return nil
	}
	cur := obj
	for i, k := range keys {
		if cur == nil {
			return nil
		}
		if i == len(keys)-1 {
			s, _ := cur[k].([]any)
			return s
		}
		n, _ := cur[k].(map[string]any)
		cur = n
	}
	return nil
}

func searchStr(item map[string]any, key string) string {
	return strVal(item[key])
}

func searchFloat(item map[string]any, key string) float64 {
	switch v := item[key].(type) {
	case float64:
		return v
	case int:
		return float64(v)
	case json.Number:
		f, _ := v.Float64()
		return f
	case string:
		return 0
	default:
		return 0
	}
}

func lower(s string) string { return strings.ToLower(s) }

func findObjectWithKey(obj any, key string) map[string]any {
	switch t := obj.(type) {
	case map[string]any:
		if _, ok := t[key]; ok {
			return t
		}
		for _, v := range t {
			if found := findObjectWithKey(v, key); found != nil {
				return found
			}
		}
	case []any:
		for _, v := range t {
			if found := findObjectWithKey(v, key); found != nil {
				return found
			}
		}
	}
	return nil
}

func placementNameFromSpec(spec map[string]any) string {
	if spec == nil {
		return ""
	}
	gen := findObjectWithKey(spec, "clusterDecisionResource")
	if gen == nil {
		return ""
	}
	return nestedString(gen, "clusterDecisionResource", "labelSelector", "matchLabels", "cluster.open-cluster-management.io/placement")
}

func resourcePlural(kind string) string {
	k := strings.ToLower(kind)
	if k == "" {
		return ""
	}
	if strings.HasSuffix(k, "s") {
		return k
	}
	return k + "s"
}

func apiGroup(apiVersion string) string {
	if i := strings.Index(apiVersion, "/"); i >= 0 {
		return apiVersion[:i]
	}
	return ""
}
