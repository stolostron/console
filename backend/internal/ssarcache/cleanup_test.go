// Copyright Contributors to the Open Cluster Management project

package ssarcache

import (
	"context"
	"testing"
	"time"
)

func TestEvictOldest(t *testing.T) {
	t.Parallel()
	deleted := []string{}
	items := []Timed[string]{
		{Key: "a", Time: time.Unix(1, 0)},
		{Key: "b", Time: time.Unix(3, 0)},
		{Key: "c", Time: time.Unix(2, 0)},
	}
	EvictOldest(3, 1, items, func(k string) { deleted = append(deleted, k) }, nil)
	if len(deleted) != 2 || deleted[0] != "a" || deleted[1] != "c" {
		t.Fatalf("deleted=%v want [a c]", deleted)
	}
}

func TestEvictOldestSkip(t *testing.T) {
	t.Parallel()
	deleted := []string{}
	items := []Timed[string]{
		{Key: "a", Time: time.Unix(1, 0)},
		{Key: "b", Time: time.Unix(2, 0)},
	}
	EvictOldest(2, 1, items, func(k string) { deleted = append(deleted, k) }, func(k string) bool {
		return k == "a"
	})
	if len(deleted) != 1 || deleted[0] != "b" {
		t.Fatalf("deleted=%v want [b]", deleted)
	}
}

func TestStart(t *testing.T) {
	t.Parallel()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	calls := make(chan struct{}, 2)
	done := Start(ctx, 20*time.Millisecond, func(time.Time) {
		select {
		case calls <- struct{}{}:
		default:
		}
	})
	select {
	case <-calls:
	case <-time.After(500 * time.Millisecond):
		t.Fatal("cleanup never ran")
	}
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("cleanup did not terminate after cancel")
	}
}

func TestStartIfDisabled(t *testing.T) {
	t.Parallel()
	called := false
	done := StartIf(context.Background(), time.Second, func(time.Time) { called = true }, false)
	select {
	case <-done:
	default:
		t.Fatal("expected closed done channel")
	}
	if called {
		t.Fatal("cleanup must not run when disabled")
	}
}

func TestExpireIfAndSweep(t *testing.T) {
	t.Parallel()
	type entry struct{ expiry time.Time }
	type state struct {
		last    time.Time
		entries map[string]entry
		keep    bool
	}
	now := time.Unix(10, 0)
	byToken := map[string]*state{
		"old": {last: time.Unix(1, 0), entries: map[string]entry{"a": {expiry: now.Add(-time.Second)}}},
		"new": {last: time.Unix(5, 0), entries: map[string]entry{"b": {expiry: now.Add(time.Second)}}},
		"fly": {last: time.Unix(2, 0), keep: true, entries: map[string]entry{}},
	}
	Sweep(byToken, 2,
		func(st *state) time.Time { return st.last },
		func(st *state) bool {
			ExpireIf(st.entries, func(e entry) bool { return !e.expiry.After(now) })
			return len(st.entries) == 0 && !st.keep
		},
		func(st *state) bool { return st.keep },
	)
	if _, ok := byToken["old"]; ok {
		t.Fatal("expired empty token should be removed")
	}
	if _, ok := byToken["fly"]; !ok {
		t.Fatal("in-flight token should be kept")
	}
	if _, ok := byToken["new"]; !ok {
		t.Fatal("fresh token should remain under the cap with the kept token")
	}
}

func TestStartNilCleanup(t *testing.T) {
	t.Parallel()
	done := Start(context.Background(), time.Second, nil)
	select {
	case <-done:
	default:
		t.Fatal("expected closed done channel for nil cleanup")
	}
}
