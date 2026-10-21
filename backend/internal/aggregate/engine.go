// Copyright Contributors to the Open Cluster Management project

package aggregate

import (
	"context"
	"os"
	"strconv"
	"sync"
	"time"

	"k8s.io/client-go/dynamic"

	"github.com/stolostron/console/backend/internal/hubresources"
	applog "github.com/stolostron/console/backend/internal/log"
	"github.com/stolostron/console/backend/internal/searchapi"
)

// Engine holds the application cache and Search loop (ACM-42600).
type Engine struct {
	Lister  Lister
	Search  *searchapi.Client
	Dynamic dynamic.Interface

	// PreLimit is PREPROCESS_BREAKPOINT (500). Set 0 in tests to always preprocess.
	PreLimit *int
	// retryWait overrides the 5m MultiClusterHub / Search-API retry delay. Tests set a short value.
	retryWait time.Duration

	mu                sync.RWMutex
	cache             map[string]*cacheBucket
	listCache         map[string][]map[string]any
	appSetAppsMap     map[string][]map[string]any
	pulledAppSetMap   map[string][]map[string]any
	tempPulled        map[string][]map[string]any
	appStatusByName   map[string]map[string]AppHealthSync
	ocpArgoFilter     map[string]struct{}
	systemPrefixes    []string
	lastArgoStatus    map[string]StatusMap
	argoPageChunks    []pageChunk
	ocpPageChunks     []pageChunk
	clusterNameChunks [][]string
	lastArgoChunk     *pageChunk
	lastOCPChunk      *pageChunk
	lastSystemChunk   []string
}

// AppHealthSync is topology health/sync for one Argo app in an AppSet.
type AppHealthSync struct {
	Health struct {
		Status string `json:"status"`
	} `json:"health"`
	Sync struct {
		Status string `json:"status"`
	} `json:"sync"`
}

type pageChunk struct {
	Keys  []string
	Limit int
}

// NewEngine builds an empty aggregator cache.
func NewEngine(lister Lister, search *searchapi.Client, dyn dynamic.Interface) *Engine {
	return &Engine{
		Lister:          lister,
		Search:          search,
		Dynamic:         dyn,
		cache:           emptyCache(),
		appSetAppsMap:   map[string][]map[string]any{},
		pulledAppSetMap: map[string][]map[string]any{},
		tempPulled:      map[string][]map[string]any{},
		appStatusByName: map[string]map[string]AppHealthSync{},
		ocpArgoFilter:   map[string]struct{}{},
		lastArgoStatus:  map[string]StatusMap{},
	}
}

// searchLimit returns the per-chunk Search GraphQL limit (APP_SEARCH_LIMIT or appSearchLimitDefault).
func (e *Engine) searchLimit() int {
	if v := os.Getenv("APP_SEARCH_LIMIT"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return appSearchLimitDefault
}

// searchInterval returns the interval between search-loop passes (APP_SEARCH_INTERVAL or 60s).
func (e *Engine) searchInterval() time.Duration {
	if v := os.Getenv("APP_SEARCH_INTERVAL"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return time.Duration(n) * time.Second
		}
	}
	return time.Duration(appSearchIntervalDefault) * time.Second
}

// preprocessLimit returns the item count threshold that triggers server-side
// pre-processing (filter/sort/paginate). Tests can override via PreLimit.
func (e *Engine) preprocessLimit() int {
	if e.PreLimit != nil {
		return *e.PreLimit
	}
	return preprocessBreakpoint
}

// Start discovers system prefixes and runs the Search loop until ctx is done.
func (e *Engine) Start(ctx context.Context) {
	e.discoverPrefixes(ctx)
	go e.searchLoop(ctx)
}

// discoverPrefixes resolves system-namespace prefixes (MCH + MCE target
// namespaces) so that OCP workloads in those namespaces are classified as
// openshift-default instead of openshift.
func (e *Engine) discoverPrefixes(ctx context.Context) {
	prefixes := []string{"openshift", "hive", "open-cluster-management"}
	if e.Dynamic != nil {
		lctx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()
		ns, err := hubresources.MCHNamespace(lctx, e.Dynamic)
		if err != nil {
			applog.Logger().Error("mch namespace", "error", err)
		} else if ns != "" && ns != "open-cluster-management" {
			prefixes = append(prefixes, ns)
		}
		mce, err := hubresources.MCETargetNamespace(lctx, e.Dynamic)
		if err != nil || mce == "" {
			prefixes = append(prefixes, "multicluster-engine")
		} else {
			prefixes = append(prefixes, mce)
		}
	} else {
		prefixes = append(prefixes, "multicluster-engine")
	}
	e.mu.Lock()
	e.systemPrefixes = prefixes
	e.mu.Unlock()
}

// retryWaitOrDefault returns the retry delay when MCH or Search API is absent (default 5m).
func (e *Engine) retryWaitOrDefault() time.Duration {
	if e.retryWait > 0 {
		return e.retryWait
	}
	return 5 * time.Minute
}

// wait blocks for d or until ctx is canceled. Returns false if canceled.
func (e *Engine) wait(ctx context.Context, d time.Duration) bool {
	select {
	case <-ctx.Done():
		return false
	case <-time.After(d):
		return true
	}
}

// searchLoop runs continuously until ctx is done. Each pass checks for MCH
// and Search API availability, then calls aggregateRemote to refresh remote
// app caches from Search. The first three passes use 15s intervals; later
// passes use searchInterval.
func (e *Engine) searchLoop(ctx context.Context) {
	pass := 1
	searchAPIMissing := false
	multiClusterHubMissing := false
	for {
		if ctx.Err() != nil {
			return
		}
		mchCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		present, err := hubresources.MCHPresent(mchCtx, e.Dynamic)
		cancel()
		if err != nil {
			applog.Logger().Error("MultiClusterHub list failed", "error", err)
		} else if !present {
			if !multiClusterHubMissing {
				applog.Logger().Info("MultiClusterHub not found; waiting before search aggregation")
				multiClusterHubMissing = true
			}
			e.mu.Lock()
			e.rebuildLocalLocked()
			e.mu.Unlock()
			if !e.wait(ctx, e.retryWaitOrDefault()) {
				return
			}
			continue
		} else if multiClusterHubMissing {
			applog.Logger().Info("MultiClusterHub found")
			multiClusterHubMissing = false
		}

		if e.Search != nil {
			ok, err := e.Search.Ping(ctx)
			if err != nil || !ok {
				if !searchAPIMissing {
					applog.Logger().Error("search API missing")
					searchAPIMissing = true
				}
				e.mu.Lock()
				e.rebuildLocalLocked()
				e.mu.Unlock()
				if !e.wait(ctx, e.retryWaitOrDefault()) {
					return
				}
				continue
			}
			if searchAPIMissing {
				applog.Logger().Info("search API found")
				searchAPIMissing = false
			}
			if err := e.aggregateRemote(ctx, pass); err != nil {
				applog.Logger().Error("aggregateRemoteApplications exception", "error", err)
			}
		}
		e.mu.Lock()
		e.rebuildLocalLocked()
		e.mu.Unlock()
		pass++
		wait := 15 * time.Second
		if pass > firstPassesFastInterval {
			wait = e.searchInterval()
		}
		if !e.wait(ctx, wait) {
			return
		}
	}
}

// applications returns all cached App rows merged from every cache bucket.
func (e *Engine) applications() []App {
	e.mu.RLock()
	defer e.mu.RUnlock()
	items := getApplicationsHelper(e.cache, cacheKeys)
	if items == nil {
		return []App{}
	}
	return items
}

// withListCache enables the per-rebuild listKind cache for the duration of fn,
// so repeated listKind calls within one rebuild do not re-list from informers.
func (e *Engine) withListCache(fn func()) {
	e.listCache = map[string][]map[string]any{}
	defer func() { e.listCache = nil }()
	fn()
}

// rebuildSubscriptionLocked re-transforms ACM Subscription apps from the informer cache.
func (e *Engine) rebuildSubscriptionLocked() {
	subs := e.listKind("app.k8s.io/v1beta1", "Application")
	e.cache[cacheSubscription].Resources = e.transform(subs, map[string]StatusMap{}, false, nil, nil, nil)
	e.cache[cacheSubscription].ResourceUIDMap = nil
	e.cache[cacheSubscription].ResourceMap = nil
}

// rebuildLocalLocked rebuilds all local (hub informer) cache buckets:
// subscriptions, Argo CD Applications, and ApplicationSets. Must hold e.mu.
func (e *Engine) rebuildLocalLocked() {
	e.withListCache(func() {
		e.rebuildSubscriptionLocked()

		clusters := e.clusters()
		hub := e.hubClusterName()
		var local *Cluster
		for i := range clusters {
			if clusters[i].Name == hub {
				c := clusters[i]
				local = &c
				break
			}
		}
		e.ocpArgoFilter = map[string]struct{}{}
		temp := map[string][]map[string]any{}
		argoItems := e.listKind("argoproj.io/v1alpha1", "Application")
		filtered := filterArgoApps(argoItems, clusters, e.ocpArgoFilter, temp, hub)
		e.appSetAppsMap = temp
		uidMap := map[string]App{}
		e.transform(filtered, e.lastArgoStatus, false, local, clusters, uidMap)
		e.cache[cacheLocalArgo].Resources = nil
		e.cache[cacheLocalArgo].ResourceUIDMap = uidMap
		e.cache[cacheLocalArgo].ResourceMap = nil

		appsets := e.listKind("argoproj.io/v1alpha1", "ApplicationSet")
		asetMap := map[string]App{}
		e.transform(appsets, e.lastArgoStatus, false, local, clusters, asetMap)
		e.cache[cacheAppSet].Resources = nil
		e.cache[cacheAppSet].ResourceUIDMap = asetMap
		e.cache[cacheAppSet].ResourceMap = nil
	})
}

// aggregateRemote issues Search GraphQL queries for Argo, OCP, and system
// applications on remote clusters, then caches the results. System queries
// run every 5th pass after pass 60 to reduce load.
func (e *Engine) aggregateRemote(ctx context.Context, pass int) error {
	querySystem := pass < 60 || pass%5 == 0
	q := searchapi.NewQuery()
	e.mu.Lock()
	e.addArgoQueryInputs(&q)
	e.addOCPQueryInputs(&q)
	if querySystem {
		e.addSystemQueryInputs(&q)
	}
	pushIndex := len(q.Variables.Input)
	pushMap, err := e.addPushModelPodQueryInputs(&q)
	e.mu.Unlock()
	if err != nil {
		applog.Logger().Error("addPushModelPodQueryInputs exception", "error", err)
	}
	hasPush := len(pushMap) > 0
	resp, err := e.Search.Search(ctx, q)
	if err != nil {
		return err
	}
	var buckets []searchapi.ResultBucket
	if resp != nil && resp.Data != nil {
		buckets = resp.Data.SearchResult
	}
	var argo, ocp, sys searchapi.ResultBucket
	if len(buckets) > 0 {
		argo = buckets[0]
	}
	if len(buckets) > 1 {
		ocp = buckets[1]
	}
	if querySystem && len(buckets) > 2 {
		sys = buckets[2]
	}
	var pushPtr *searchapi.ResultBucket
	if hasPush && pushIndex < len(buckets) {
		b := buckets[pushIndex]
		pushPtr = &b
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	filter := e.cacheArgoApplications(argo, pushPtr, pushMap)
	e.cacheOCPApplications(ocp, filter, false)
	if querySystem {
		e.cacheOCPApplications(sys, filter, true)
	}
	return nil
}
