// Copyright Contributors to the Open Cluster Management project

// Package aggregate serves POST /aggregate/{applications,statuses,appSetData} (ACM-42600).
package aggregate

import (
	"encoding/json"
	"strings"
)

const (
	// appSearchLimitDefault is the maximum number of apps per Search GraphQL page chunk (overridden by APP_SEARCH_LIMIT).
	appSearchLimitDefault = 5000
	// searchQueryLimit is the per-input GraphQL result limit sent to Search API.
	searchQueryLimit = 20000
	// preprocessBreakpoint is the item count above which the backend pre-filters, sorts, and paginates
	// server-side instead of sending the full list to the frontend (overridden by PREPROCESS_BREAKPOINT).
	preprocessBreakpoint = 500
	// scoreColumnSize is the number of severity buckets in each status column (healthy through unknown).
	scoreColumnSize = 5
	// remoteClusterChunks is how many managed clusters are batched into a single Search query for system apps.
	remoteClusterChunks = 10
	// firstPassesFastInterval is the number of initial search-loop passes that run at the fast 15-second cadence.
	firstPassesFastInterval = 3
	// appSearchIntervalDefault is the seconds between search-loop passes after the fast interval (overridden by APP_SEARCH_INTERVAL).
	appSearchIntervalDefault = 60
)

// AppColumns are zero-based column indices matching the frontend table in
// Node aggregators/applications.ts. They are used for sorting and status-score lookups.
const (
	colName      = 0 // application name
	colType      = 1 // application type (subscription, argo, appset, flux, openshift)
	colNamespace = 2 // application namespace
	colClusters  = 3 // target clusters
	colHealth    = 4 // health status score
	colSynced    = 5 // sync status score
	colDeployed  = 6 // deployed/pod status score
	colCreated   = 7 // creation timestamp
)

// Score severity levels ordered from best (0) to worst (4). Each status column
// has scoreColumnSize (5) buckets; these are indices into those count arrays.
const (
	scoreHealthy  = 0 // resource is fully healthy / synced / running
	scoreProgress = 1 // resource is progressing (roll-out, scaling, etc.)
	scoreWarning  = 2 // resource has a warning condition (pending, creating, terminating)
	scoreDanger   = 3 // resource is in an error state (crash loop, image pull failure, etc.)
	scoreUnknown  = 4 // status could not be determined
)

// Application type identifiers stored in Transform.Type and used for filtering.
const (
	kindSubscriptionApp  = "subscription"     // ACM Subscription-based application
	kindArgo             = "argo"             // standalone Argo CD Application
	kindAppSet           = "appset"           // Argo CD ApplicationSet
	kindFlux             = "flux"             // Flux CD application (kustomize or helm)
	kindOpenShift        = "openshift"        // OpenShift workload (Deployment with owner labels)
	kindOpenShiftDefault = "openshift-default" // OpenShift workload in a system namespace
)

// Cache bucket keys for Engine.cache. Each bucket holds a different category
// of application, split into local (hub informer) and remote (Search API) sources.
const (
	cacheSubscription = "subscription"  // ACM Subscription apps (local informer only)
	cacheAppSet       = "appset"        // Argo CD ApplicationSets (local informer only)
	cacheLocalArgo    = "localArgoApps" // Argo CD Applications discovered from hub informer
	cacheRemoteArgo   = "remoteArgoApps" // Argo CD Applications discovered from Search
	cacheLocalOCP     = "localOCPApps"  // OCP workloads on the hub cluster (from Search)
	cacheRemoteOCP    = "remoteOCPApps" // OCP workloads on managed clusters (from Search)
	cacheLocalSys     = "localSysApps"  // system-namespace OCP workloads on the hub (from Search)
	cacheRemoteSys    = "remoteSysApps" // system-namespace OCP workloads on managed clusters (from Search)
)

// cacheKeys lists every cache bucket in the order they are merged when
// building the full application list for /aggregate/applications.
var cacheKeys = []string{
	cacheSubscription, cacheAppSet, cacheLocalArgo, cacheRemoteArgo,
	cacheLocalOCP, cacheRemoteOCP, cacheLocalSys, cacheRemoteSys,
}

// appOwnerLabels are label key prefixes that identify an OCP Deployment as
// belonging to a named application. The first match wins.
var appOwnerLabels = []string{
	"kustomize.toolkit.fluxcd.io/name=",
	"helm.toolkit.fluxcd.io/name=",
	"app=",
	"app.kubernetes.io/part-of=",
}

// fluxAnnotations are annotation key pairs whose joint presence on a resource
// label string identifies it as a Flux CD application.
var fluxAnnotations = [][2]string{
	{"helm.toolkit.fluxcd.io/name", "helm.toolkit.fluxcd.io/namespace"},
	{"kustomize.toolkit.fluxcd.io/name", "kustomize.toolkit.fluxcd.io/namespace"},
}

// resErrorStates are lowercased pod/resource status strings that map to scoreDanger.
var resErrorStates = map[string]struct{}{
	"err": {}, "off": {}, "invalid": {}, "kill": {}, "propagationfailed": {},
	"imagepullbackoff": {}, "crashloopbackoff": {}, "lost": {},
}

// resWarningStates are lowercased pod/resource status strings that map to scoreWarning.
var resWarningStates = map[string]struct{}{
	"pending": {}, "creating": {}, "terminating": {},
}

// StatusEntry is [counts[], messages[]].
type StatusEntry struct {
	Counts   []int               `json:"-"`
	Messages []map[string]string `json:"-"`
}

// emptyStatusEntry returns a StatusEntry with zeroed counts and an empty messages slice.
func emptyStatusEntry() StatusEntry {
	return StatusEntry{Counts: make([]int, scoreColumnSize), Messages: []map[string]string{}}
}

// missingStatusEntry returns a StatusEntry with one scoreUnknown count and a "Missing" message.
func missingStatusEntry() StatusEntry {
	return StatusEntry{Counts: []int{0, 0, 0, 0, 1}, Messages: []map[string]string{{"key": "Status", "value": "Missing"}}}
}

// emptyDeployedEntry returns a zeroed StatusEntry for the deployed column (no "Missing" marker).
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

// emptyClusterStatuses returns a ClusterStatuses with zeroed health/synced/deployed.
func emptyClusterStatuses() ClusterStatuses {
	return ClusterStatuses{
		Health:   emptyStatusEntry(),
		Synced:   emptyStatusEntry(),
		Deployed: emptyStatusEntry(),
	}
}

// missingClusterStatuses returns health/synced as "Missing" (unknown) with an empty deployed entry.
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

// cloneMap returns a shallow copy of the map (top-level keys only).
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

// cacheBucket stores applications in one of three representations:
// Resources (flat slice), ResourceMap (keyed by page-chunk prefix), or
// ResourceUIDMap (keyed by UID for merge-on-refresh).
type cacheBucket struct {
	Resources      []App
	ResourceMap    map[string][]App
	ResourceUIDMap map[string]App
}

// emptyCache initialises a cache map with an empty bucket for every cacheKey.
func emptyCache() map[string]*cacheBucket {
	out := make(map[string]*cacheBucket, len(cacheKeys))
	for _, k := range cacheKeys {
		out[k] = &cacheBucket{Resources: []App{}}
	}
	return out
}

// strVal safely type-asserts v to a string, returning "" on nil or non-string.
func strVal(v any) string {
	s, _ := v.(string)
	return s
}

// metaMap returns the "metadata" sub-map from a K8s-style unstructured object.
func metaMap(obj map[string]any) map[string]any {
	if obj == nil {
		return nil
	}
	m, _ := obj["metadata"].(map[string]any)
	return m
}

// metaName extracts metadata.name from an unstructured object.
func metaName(obj map[string]any) string {
	return strVal(metaMap(obj)["name"])
}

// metaNamespace extracts metadata.namespace from an unstructured object.
func metaNamespace(obj map[string]any) string {
	return strVal(metaMap(obj)["namespace"])
}

// appSetMapKey qualifies an ApplicationSet so two sets with the same name in
// different namespaces do not share child Applications.
func appSetMapKey(namespace, name string) string {
	return namespace + "/" + name
}

// appSetNameFromMapKey returns the ApplicationSet name from an appSetMapKey.
func appSetNameFromMapKey(key string) string {
	if i := strings.LastIndex(key, "/"); i >= 0 {
		return key[i+1:]
	}
	return key
}

// metaUID extracts metadata.uid from an unstructured object.
func metaUID(obj map[string]any) string {
	return strVal(metaMap(obj)["uid"])
}

// metaCreation extracts metadata.creationTimestamp from an unstructured object.
func metaCreation(obj map[string]any) string {
	return strVal(metaMap(obj)["creationTimestamp"])
}

// metaLabels extracts metadata.labels from an unstructured object.
func metaLabels(obj map[string]any) map[string]any {
	m, _ := metaMap(obj)["labels"].(map[string]any)
	return m
}

// metaAnnotations extracts metadata.annotations from an unstructured object.
func metaAnnotations(obj map[string]any) map[string]any {
	m, _ := metaMap(obj)["annotations"].(map[string]any)
	return m
}

// kindOf extracts the top-level "kind" field from an unstructured object.
func kindOf(obj map[string]any) string {
	return strVal(obj["kind"])
}

// apiVersionOf extracts the top-level "apiVersion" field from an unstructured object.
func apiVersionOf(obj map[string]any) string {
	return strVal(obj["apiVersion"])
}

// nestedMap traverses a chain of map keys and returns the final map, or nil.
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

// nestedString traverses a chain of map keys and returns the leaf value as a string.
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

// nestedSlice traverses a chain of map keys and returns the leaf value as []any.
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

// searchStr returns a top-level string field from a Search result item.
func searchStr(item map[string]any, key string) string {
	return strVal(item[key])
}

// searchFloat returns a top-level numeric field from a Search result item,
// handling float64, int, and json.Number representations.
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

// lower is a convenience alias for strings.ToLower.
func lower(s string) string { return strings.ToLower(s) }

// findObjectWithKey recursively searches obj (maps and slices) for the first
// map that contains the given key.
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

// placementNameFromSpec extracts the Placement name from an ApplicationSet spec
// by locating the clusterDecisionResource matchLabels.
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

// resourcePlural returns a naive plural of a K8s kind (lowercased + "s") for SSAR requests.
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

// apiGroup splits "group/version" and returns just the group (empty for core resources).
func apiGroup(apiVersion string) string {
	if i := strings.Index(apiVersion, "/"); i >= 0 {
		return apiVersion[:i]
	}
	return ""
}
