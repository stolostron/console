// Copyright Contributors to the Open Cluster Management project

package ssarcache

import (
	"context"
	"sort"
	"time"
)

// Start runs cleanup on a ticker until ctx is canceled.
func Start(ctx context.Context, every time.Duration, cleanup func(time.Time)) {
	if cleanup == nil {
		return
	}
	go func() {
		tick := time.NewTicker(every)
		defer tick.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-tick.C:
				cleanup(time.Now())
			}
		}
	}()
}

// Timed is a cache key with the time used for oldest-first eviction.
type Timed[K comparable] struct {
	Key  K
	Time time.Time
}

// EvictOldest deletes oldest keys until at most max remain.
// skip may reject a candidate (return true to keep it and try the next).
func EvictOldest[K comparable](n, max int, items []Timed[K], del func(K), skip func(K) bool) {
	if n <= max || max < 0 {
		return
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Time.Before(items[j].Time) })
	for i := 0; i < len(items) && n > max; i++ {
		k := items[i].Key
		if skip != nil && skip(k) {
			continue
		}
		del(k)
		n--
	}
}
