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
		TLSClientConfig:       tlsCfg,
		ResponseHeaderTimeout: ResponseHeaderTimeout,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	}
}
