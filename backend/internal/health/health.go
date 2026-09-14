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

func New() *Probes {
	p := &Probes{}
	p.live.Store(true)
	return p
}

func (p *Probes) SetLive(v bool) { p.live.Store(v) }

func (p *Probes) Ping(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func (p *Probes) Liveness(w http.ResponseWriter, _ *http.Request) {
	if !p.live.Load() {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (p *Probes) Readiness(w http.ResponseWriter, _ *http.Request) {
	if !p.live.Load() {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
