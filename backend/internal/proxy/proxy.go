// Copyright Contributors to the Open Cluster Management project

package proxy

import (
	"crypto/tls"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"
)

// New returns a reverse proxy to the Node sidecar. HTTP/1.1 only so WebSocket
// upgrades succeed. Original request paths (including /multicloud) are kept.
func New(target *url.URL, tlsConfig *tls.Config) http.Handler {
	transport := &http.Transport{
		ForceAttemptHTTP2:     false,
		TLSClientConfig:       tlsConfig,
		ResponseHeaderTimeout: 0,
	}
	rp := &httputil.ReverseProxy{
		Rewrite: func(r *httputil.ProxyRequest) {
			r.SetURL(target)
			r.Out.Host = target.Host
		},
		Transport:     transport,
		FlushInterval: -1 * time.Millisecond,
	}
	return rp
}
