// Copyright Contributors to the Open Cluster Management project

package outbound

import (
	"crypto/tls"
	"net"
	"net/http"
	"time"
)

const (
	// DialTimeout bounds TCP connect to hub services and in-cluster DNS names during local dev.
	DialTimeout = 10 * time.Second
	// ResponseHeaderTimeout bounds time waiting for upstream response headers on reverse proxies.
	ResponseHeaderTimeout = 60 * time.Second
)

// ClientTLSConfig clones tlsCfg for an outbound client.
// When forceHTTP2 is false, ALPN is pinned to http/1.1. net/http appends "h2" to
// TLSClientConfig.NextProtos in place on the first RoundTrip when ForceAttemptHTTP2
// is true; managed-cluster, VM, and search clients share one config with metricsproxy
// and must not advertise h2 when they only speak HTTP/1.1.
func ClientTLSConfig(tlsCfg *tls.Config, forceHTTP2 bool) *tls.Config {
	if tlsCfg == nil {
		return nil
	}
	tlsCfg = tlsCfg.Clone()
	if !forceHTTP2 {
		tlsCfg.NextProtos = []string{"http/1.1"}
	}
	return tlsCfg
}

// Transport builds an http.Transport for outbound reverse-proxy and API clients.
// Dial and response-header timeouts prevent orphaned goroutines when a client
// disconnects while the backend is still connecting to *.svc.cluster.local.
func Transport(tlsCfg *tls.Config, forceHTTP2 bool) *http.Transport {
	return &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   DialTimeout,
			KeepAlive: 30 * time.Second,
		}).DialContext,
		ForceAttemptHTTP2:     forceHTTP2,
		TLSClientConfig:       ClientTLSConfig(tlsCfg, forceHTTP2),
		ResponseHeaderTimeout: ResponseHeaderTimeout,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}
}
