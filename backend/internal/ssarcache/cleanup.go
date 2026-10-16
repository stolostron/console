// Copyright Contributors to the Open Cluster Management project

package ssarcache

import (
	"context"
	"sort"
	"time"
)

// Start runs cleanup on a ticker until ctx is canceled.
// The returned channel is closed when the cleanup goroutine exits.
func Start(ctx context.Context, every time.Duration, cleanup func(time.Time)) <-chan struct{} {
	done := make(chan struct{})
	if cleanup == nil {
		close(done)
		return done
	}
	go func() {
		defer close(done)
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
	return done
}

// StartIf runs cleanup when enabled is true.
// When enabled is false it returns an already-closed channel and does not call cleanup,
// so callers can pass a nil-receiver method value without invoking it.
func StartIf(ctx context.Context, every time.Duration, cleanup func(time.Time), enabled bool) <-chan struct{} {
	if !enabled {
		done := make(chan struct{})
		close(done)
		return done
	}
	return Start(ctx, every, cleanup)
}

// ExpireIf deletes map entries for which expired returns true.
func ExpireIf[K comparable, V any](m map[K]V, expired func(V) bool) {
	for k, v := range m {
		if expired(v) {
			delete(m, k)
		}
	}
}

// Sweep removes tokens for which remove returns true (unless keep says to retain them),
// then evicts oldest tokens until at most max remain. keep may be nil.
func Sweep[T any](
	byToken map[string]T,
	max int,
	last func(T) time.Time,
	remove func(T) bool,
	keep func(T) bool,
) {
	for h, st := range byToken {
		if !remove(st) {
			continue
		}
		if keep != nil && keep(st) {
			continue
		}
		delete(byToken, h)
	}
	if max < 0 || len(byToken) <= max {
		return
	}
	items := make([]Timed[string], 0, len(byToken))
	for h, st := range byToken {
		items = append(items, Timed[string]{Key: h, Time: last(st)})
	}
	EvictOldest(len(byToken), max, items, func(h string) { delete(byToken, h) }, func(h string) bool {
		if keep == nil {
			return false
		}
		st, ok := byToken[h]
		return ok && keep(st)
	})
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
