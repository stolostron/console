// Copyright Contributors to the Open Cluster Management project

package metricsproxy

import (
	"crypto/tls"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/server"
)

var requestHeaders = []string{
	"Accept",
	"Accept-Encoding",
	"Content-Encoding",
	"Content-Length",
	"Content-Type",
}

var responseHeaders = []string{
	"Cache-Control",
	"Content-Type",
	"Content-Length",
	"Content-Encoding",
	"Etag",
}

const (
	DefaultPrometheusURL    = "https://prometheus-k8s.openshift-monitoring.svc.cluster.local:9091"
	DefaultObservabilityURL = "https://rbac-query-proxy.open-cluster-management-observability.svc.cluster.local:8443"
)

// New returns a ReverseProxy that rewrites /prometheus or /observability to /api/v1 on target.
func New(target *url.URL, tlsConfig *tls.Config, prefix string) http.Handler {
	transport := &http.Transport{
		TLSClientConfig:       tlsConfig,
		ForceAttemptHTTP2:     true,
		ResponseHeaderTimeout: 0,
	}
	rp := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			token := auth.TokenFromRequest(pr.In)
			stripped := server.StripMulticloud(pr.In.URL.Path)
			stripped = strings.ReplaceAll(stripped, prefix, "/api/v1")
			pr.SetURL(target)
			pr.Out.URL.Path = stripped
			pr.Out.URL.RawQuery = pr.In.URL.RawQuery
			pr.Out.Host = target.Host
			pr.Out.Header = http.Header{}
			for _, name := range requestHeaders {
				if v := pr.In.Header.Get(name); v != "" {
					pr.Out.Header.Set(name, v)
				}
			}
			pr.Out.Header.Set("Authorization", "Bearer "+token)
		},
		ModifyResponse: filterResponseHeaders,
		ErrorHandler: func(w http.ResponseWriter, _ *http.Request, _ error) {
			w.WriteHeader(http.StatusBadGateway)
		},
		Transport:     transport,
		FlushInterval: -1 * time.Millisecond,
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := auth.RequireToken(w, r); !ok {
			return
		}
		rp.ServeHTTP(w, r)
	})
}

func filterResponseHeaders(resp *http.Response) error {
	filtered := http.Header{}
	for _, name := range responseHeaders {
		for _, v := range resp.Header.Values(name) {
			filtered.Add(name, v)
		}
	}
	resp.Header = filtered
	return nil
}

// ParseTarget uses override when set, otherwise the in-cluster default.
func ParseTarget(override, fallback string) (*url.URL, error) {
	if override == "" {
		override = fallback
	}
	return url.Parse(override)
}
