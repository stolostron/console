// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"context"
	"runtime"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/dynamic/dynamicinformer"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"

	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	// InformerQPS and InformerBurst apply only to the dedicated informer rest.Config.
	InformerQPS             float32 = 20
	InformerBurst           int     = 40
	defaultStartConcurrency int     = 8
)

var (
	startConcurrency = defaultStartConcurrency
	startSem         chan struct{}
)

// init sizes the concurrent list/watch start semaphore.
func init() {
	resetStartSem()
}

// resetStartSem recreates the start semaphore (tests and package init).
func resetStartSem() {
	startSem = make(chan struct{}, startConcurrency)
}

// acquireStartSlot blocks until a concurrent list/watch start slot is free, or
// ctx is canceled. Returns false when canceled so the caller can exit.
func acquireStartSlot(ctx context.Context) bool {
	select {
	case startSem <- struct{}{}:
		return true
	case <-ctx.Done():
		return false
	}
}

// releaseStartSlot frees one concurrent list/watch start slot.
func releaseStartSlot() {
	<-startSem
}

// RESTConfig copies base and sets informer-only QPS/Burst so watches do not share
// the default 5/10 limiter used by other service-account clients.
func RESTConfig(base *rest.Config) *rest.Config {
	c := rest.CopyConfig(base)
	c.QPS = InformerQPS
	c.Burst = InformerBurst
	return c
}

// New builds an empty cache for specs. Call StartCache after the HTTP listener is bound.
func New(specs []WatchSpec) *InformerCache {
	return newCache(specs)
}

// Start launches one informer per DefaultWatchSpecs entry. It does not block the caller.
func Start(ctx context.Context, dyn dynamic.Interface, mapper ResourceMapper) *InformerCache {
	return StartSpecs(ctx, dyn, mapper, DefaultWatchSpecs())
}

// StartSpecs is Start with an explicit spec list (tests).
func StartSpecs(ctx context.Context, dyn dynamic.Interface, mapper ResourceMapper, specs []WatchSpec) *InformerCache {
	c := New(specs)
	StartCache(ctx, c, dyn, mapper)
	return c
}

// StartCache begins list/watch goroutines for an existing cache (listener-first startup).
func StartCache(ctx context.Context, c *InformerCache, dyn dynamic.Interface, mapper ResourceMapper) {
	if c == nil {
		return
	}
	for i := range c.states {
		st := c.states[i]
		go c.runSpec(ctx, dyn, mapper, st)
	}
	go c.logMemoryWhenReady(ctx)
}

// runSpec resolves the GVR and starts a SharedIndexInformer for one WatchSpec.
// GVR resolution failures retry until ctx is canceled. After the informer
// starts, an initial cache-sync timeout waits for that same informer to sync
// (or for ctx to end) and then returns — it does not start another informer.
// Startup concurrency is capped by acquireStartSlot so many specs do not list at once.
func (c *InformerCache) runSpec(ctx context.Context, dyn dynamic.Interface, mapper ResourceMapper, st *specRuntime) {
	for {
		if ctx.Err() != nil {
			return
		}
		gvr, err := ResolveGVR(mapper, st.spec.APIVersion, st.spec.Kind)
		if err != nil {
			st.setError(err)
			if isUnavailable(err) {
				st.unavailable.Store(true)
				applog.Logger().Info("informer spec unavailable; retrying",
					"kind", st.spec.Kind, "apiVersion", st.spec.APIVersion, "error", err)
			} else {
				applog.Logger().Warn("informer GVR resolve failed; retrying",
					"kind", st.spec.Kind, "apiVersion", st.spec.APIVersion, "error", err)
				if inv, ok := mapper.(CacheInvalidator); ok {
					inv.Invalidate()
				}
			}
			if !waitRetry(ctx) {
				return
			}
			continue
		}
		st.unavailable.Store(false)
		st.setError(nil)

		if !acquireStartSlot(ctx) {
			return
		}

		// NewFilteredDynamicInformer enables WatchListClient streaming sync
		// (default since client-go 1.35). The real dynamic client supports it;
		// set KUBE_FEATURE_WatchListClient=false to force paginated LIST instead.
		inf := dynamicinformer.NewFilteredDynamicInformer(
			dyn,
			gvr,
			metav1.NamespaceAll,
			resyncPeriod,
			cache.Indexers{cache.NamespaceIndex: cache.MetaNamespaceIndexFunc},
			func(options *metav1.ListOptions) {
				applySelectors(st.spec, options)
			},
		).Informer()
		if err := inf.SetTransform(transformFor(st.spec)); err != nil {
			applog.Logger().Warn("informer transform", "kind", st.spec.Kind, "error", err)
		}

		c.mu.Lock()
		st.gvr = gvr
		st.informer = inf
		sink := c.sink
		c.mu.Unlock()

		if sink != nil && st.spec.ShouldForward() {
			if _, err := inf.AddEventHandler(resourceHandler{spec: st.spec, gvr: gvr, sink: sink}); err != nil {
				applog.Logger().Warn("informer event handler", "kind", st.spec.Kind, "error", err)
			}
		}

		go inf.Run(ctx.Done())

		syncCtx, cancel := context.WithTimeout(ctx, syncGiveUpAfter)
		synced := cache.WaitForCacheSync(syncCtx.Done(), inf.HasSynced)
		cancel()
		releaseStartSlot()

		if synced {
			st.unavailable.Store(false)
			st.synced.Store(true)
			applog.Logger().Info("informer synced",
				"kind", st.spec.Kind, "apiVersion", st.spec.APIVersion, "resource", gvr.Resource)
			<-ctx.Done()
			return
		}
		if ctx.Err() != nil {
			return
		}
		applog.Logger().Error("informer cache sync timed out; not blocking HasSynced",
			"kind", st.spec.Kind, "apiVersion", st.spec.APIVersion)
		st.unavailable.Store(true)
		if cache.WaitForCacheSync(ctx.Done(), inf.HasSynced) {
			st.unavailable.Store(false)
			st.synced.Store(true)
		}
		return
	}
}

// applySelectors copies label and field selectors from spec onto list/watch options.
func applySelectors(spec WatchSpec, options *metav1.ListOptions) {
	if s := SelectorQuery(spec.LabelSelector); s != "" {
		options.LabelSelector = s
	}
	if s := SelectorQuery(spec.FieldSelector); s != "" {
		options.FieldSelector = s
	}
}

// logMemoryWhenReady waits until HasSynced (or 2m) then logs heap stats once so
// operators can see informer memory after startup without polling forever.
func (c *InformerCache) logMemoryWhenReady(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	timeout := time.NewTimer(2 * time.Minute)
	defer timeout.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-timeout.C:
			c.logHeap("informer cache memory (sync wait timed out)")
			return
		case <-ticker.C:
			if c.HasSynced() {
				c.logHeap("informer cache memory")
				return
			}
		}
	}
}

// logHeap logs heapAlloc, heapInuse, and cached item count for informer memory diagnostics.
func (c *InformerCache) logHeap(msg string) {
	var ms runtime.MemStats
	runtime.ReadMemStats(&ms)
	applog.Logger().Info(msg,
		"heapAlloc", ms.HeapAlloc,
		"heapInuse", ms.HeapInuse,
		"items", c.itemCount(),
	)
}
