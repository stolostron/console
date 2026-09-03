// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"context"
	"math/rand/v2"
	"time"
)

const (
	// resyncPeriod 0 matches Node startWatching: no periodic full relist.
	resyncPeriod    = 0
	retryBase       = 60 * time.Second
	retryJitter     = 10 * time.Second
	syncGiveUpAfter = 45 * time.Second
)

func retryDelay() time.Duration {
	return retryBase + time.Duration(rand.IntN(int(retryJitter/time.Second)))*time.Second
}

func waitRetry(ctx context.Context) bool {
	t := time.NewTimer(retryDelay())
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}
