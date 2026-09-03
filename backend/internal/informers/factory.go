// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"context"
	"runtime"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	k8sruntime "k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	k8swatch "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/dynamic"
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

func init() {
	resetStartSem()
}

func resetStartSem() {
	startSem = make(chan struct{}, startConcurrency)
}

func acquireStartSlot(ctx context.Context) bool {
	select {
	case startSem <- struct{}{}:
		return true
	case <-ctx.Done():
		return false
	}
}

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

		lw := newListWatch(dyn, gvr, st.spec)
		inf := cache.NewSharedIndexInformer(lw, &unstructured.Unstructured{}, resyncPeriod, cache.Indexers{
			cache.NamespaceIndex: cache.MetaNamespaceIndexFunc,
		})
		if err := inf.SetTransform(transformFor(st.spec)); err != nil {
			applog.Logger().Warn("informer transform", "kind", st.spec.Kind, "error", err)
		}

		c.mu.Lock()
		st.gvr = gvr
		st.informer = inf
		c.mu.Unlock()

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

func newListWatch(dyn dynamic.Interface, gvr schema.GroupVersionResource, spec WatchSpec) *cache.ListWatch {
	ns := metav1.NamespaceAll
	return &cache.ListWatch{
		ListFunc: func(options metav1.ListOptions) (k8sruntime.Object, error) {
			applySelectors(spec, &options)
			return dyn.Resource(gvr).Namespace(ns).List(context.TODO(), options)
		},
		WatchFunc: func(options metav1.ListOptions) (k8swatch.Interface, error) {
			applySelectors(spec, &options)
			return dyn.Resource(gvr).Namespace(ns).Watch(context.TODO(), options)
		},
	}
}

func applySelectors(spec WatchSpec, options *metav1.ListOptions) {
	if s := SelectorQuery(spec.LabelSelector); s != "" {
		options.LabelSelector = s
	}
	if s := SelectorQuery(spec.FieldSelector); s != "" {
		options.FieldSelector = s
	}
}

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

func (c *InformerCache) logHeap(msg string) {
	var ms runtime.MemStats
	runtime.ReadMemStats(&ms)
	applog.Logger().Info(msg,
		"heapAlloc", ms.HeapAlloc,
		"heapInuse", ms.HeapInuse,
		"items", c.itemCount(),
		"note", "compare Go heapAlloc of this process after sync to Node deflate cache size, not combined dual-run RSS",
	)
}
