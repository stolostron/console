// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"context"
	"testing"
)

func TestRetryDelayInRange(t *testing.T) {
	for i := 0; i < 20; i++ {
		d := retryDelay()
		if d < retryBase || d >= retryBase+retryJitter {
			t.Fatalf("retryDelay %v outside [%v,%v)", d, retryBase, retryBase+retryJitter)
		}
	}
}

func TestWaitRetryCancelledContext(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if waitRetry(ctx) {
		t.Fatal("expected false when context already canceled")
	}
}

func TestResyncDisabled(t *testing.T) {
	if resyncPeriod != 0 {
		t.Fatalf("resyncPeriod=%v want 0 (no periodic full relist)", resyncPeriod)
	}
}
