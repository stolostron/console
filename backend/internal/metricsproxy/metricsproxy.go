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
	"github.com/stolostron/console/backend/internal/outbound"
	"github.com/stolostron/console/backend/internal/server"
)

const (
	DefaultPrometheusURL    = "https://prometheus-k8s.openshift-monitoring.svc.cluster.local:9091"
	DefaultObservabilityURL = "https://rbac-query-proxy.open-cluster-management-observability.svc.cluster.local:8443"
)

// New returns a ReverseProxy that rewrites /prometheus or /observability to /api/v1 on target.
func New(target *url.URL, tlsConfig *tls.Config, prefix string) http.Handler {
	transport := outbound.Transport(tlsConfig, true)
	rp := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			token := auth.TokenFromRequest(pr.In)
			stripped := server.StripMulticloud(pr.In.URL.Path)
			stripped = strings.Replace(stripped, prefix, "/api/v1", 1)
			pr.SetURL(target)
			pr.Out.URL.Path = stripped
			pr.Out.URL.RawQuery = pr.In.URL.RawQuery
			pr.Out.Host = target.Host
			pr.Out.Header = http.Header{}
			outbound.CopyRequestHeaders(pr.Out.Header, pr.In.Header, token, outbound.ProxyRequestHeaders)
		},
		ModifyResponse: func(resp *http.Response) error {
			return outbound.FilterResponseHeaders(resp, outbound.ProxyResponseHeaders)
		},
		ErrorHandler:  outbound.BadGateway,
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

// ParseTarget uses override when set, otherwise the in-cluster default.
func ParseTarget(override, fallback string) (*url.URL, error) {
	if override == "" {
		override = fallback
	}
	return url.Parse(override)
}
