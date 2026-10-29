// Copyright Contributors to the Open Cluster Management project

package health

import (
	"net/http"
	"sync/atomic"
)

// Probes serves /ping, /livenessProbe, and /readinessProbe.
type Probes struct {
	live atomic.Bool
}

// New returns probes that start live (ready for traffic).
func New() *Probes {
	p := &Probes{}
	p.live.Store(true)
	return p
}

// SetLive toggles process liveness/readiness (false fails both probes).
func (p *Probes) SetLive(v bool) { p.live.Store(v) }

// Ping always responds 200 for simple reachability checks.
func (p *Probes) Ping(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
}

// Liveness responds 200 while live, otherwise 500.
func (p *Probes) Liveness(w http.ResponseWriter, _ *http.Request) {
	if !p.live.Load() {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

// Readiness responds 200 while live, otherwise 500.
func (p *Probes) Readiness(w http.ResponseWriter, _ *http.Request) {
	if !p.live.Load() {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
