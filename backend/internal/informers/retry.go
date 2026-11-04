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
	// discoveryRefreshInterval caps how often a failed GVR lookup may force a
	// discovery refetch. Keep it below retryBase so every retry round still
	// gets one fresh look at the API server.
	discoveryRefreshInterval = 30 * time.Second
)

// retryDelay returns the base GVR/sync retry wait plus up to retryJitter seconds.
func retryDelay() time.Duration {
	return retryBase + time.Duration(rand.IntN(int(retryJitter/time.Second)))*time.Second
}

// waitRetry sleeps retryDelay or returns false immediately when ctx is canceled.
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
