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

	mu                sync.RWMutex
	cache             map[string]*cacheBucket
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

func (e *Engine) searchLimit() int {
	if v := os.Getenv("APP_SEARCH_LIMIT"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return appSearchLimitDefault
}

func (e *Engine) searchInterval() time.Duration {
	if v := os.Getenv("APP_SEARCH_INTERVAL"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return time.Duration(n) * time.Second
		}
	}
	return time.Duration(appSearchIntervalDefault) * time.Second
}

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

func (e *Engine) discoverPrefixes(ctx context.Context) {
	prefixes := []string{"openshift", "hive", "open-cluster-management"}
	if e.Dynamic != nil {
		ns, err := hubresources.MCHNamespace(ctx, e.Dynamic)
		if err != nil {
			applog.Logger().Error("mch namespace", "error", err)
		} else if ns != "" && ns != "open-cluster-management" {
			prefixes = append(prefixes, ns)
		}
		mce, err := hubresources.MCETargetNamespace(ctx, e.Dynamic)
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

func (e *Engine) searchLoop(ctx context.Context) {
	pass := 1
	searchAPIMissing := false
	for {
		if ctx.Err() != nil {
			return
		}
		if e.Search != nil {
			for {
				ok, err := e.Search.Ping(ctx)
				if err != nil || !ok {
					if !searchAPIMissing {
						applog.Logger().Error("search API missing")
						searchAPIMissing = true
					}
					select {
					case <-ctx.Done():
						return
					case <-time.After(5 * time.Minute):
					}
					continue
				}
				break
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
		select {
		case <-ctx.Done():
			return
		case <-time.After(wait):
		}
	}
}

func (e *Engine) applications() []App {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.rebuildLocalLocked()
	items := getApplicationsHelper(e.cache, cacheKeys)
	if items == nil {
		return []App{}
	}
	return items
}

func (e *Engine) rebuildLocalLocked() {
	subs := e.listKind("app.k8s.io/v1beta1", "Application")
	e.cache[cacheSubscription].Resources = e.transform(subs, map[string]StatusMap{}, false, nil, nil, nil)
	e.cache[cacheSubscription].ResourceUIDMap = nil
	e.cache[cacheSubscription].ResourceMap = nil

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
}

func (e *Engine) aggregateRemote(ctx context.Context, pass int) error {
	querySystem := pass < 60 || pass%5 == 0
	q := searchapi.NewQuery()
	e.mu.Lock()
	e.addArgoQueryInputs(&q)
	e.addOCPQueryInputs(&q)
	e.mu.Unlock()
	if querySystem {
		e.mu.Lock()
		e.addSystemQueryInputs(&q)
		e.mu.Unlock()
	}
	pushIndex := len(q.Variables.Input)
	pushMap, err := e.addPushModelPodQueryInputs(&q)
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
