// Copyright Contributors to the Open Cluster Management project

package health

import (
	"crypto/tls"
	"net/http"
	"net/url"
	"sync/atomic"
	"time"
)

// Probes serves /livenessProbe, /readinessProbe, and /ping.
type Probes struct {
	live       atomic.Bool
	sidecarURL *url.URL
	client     *http.Client
}

func New(sidecarURL *url.URL, sidecarTLS *tls.Config) *Probes {
	p := &Probes{sidecarURL: sidecarURL}
	p.live.Store(true)
	transport := &http.Transport{
		ForceAttemptHTTP2: false,
		TLSClientConfig:   sidecarTLS,
	}
	p.client = &http.Client{Transport: transport, Timeout: 2 * time.Second}
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
	if p.sidecarURL == nil {
		w.WriteHeader(http.StatusOK)
		return
	}
	pingURL := p.sidecarURL.ResolveReference(&url.URL{Path: "/ping"})
	resp, err := p.client.Get(pingURL.String())
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}
