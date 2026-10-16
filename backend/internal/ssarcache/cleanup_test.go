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
	Start(ctx, 20*time.Millisecond, func(time.Time) {
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
}

func TestStartNilCleanup(t *testing.T) {
	t.Parallel()
	Start(context.Background(), time.Second, nil)
}
