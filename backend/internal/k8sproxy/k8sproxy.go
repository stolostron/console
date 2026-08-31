// Copyright Contributors to the Open Cluster Management project

package k8sproxy

import (
	"crypto/tls"
	"crypto/x509"
	"net/http"
	"net/http/httputil"
	"net/url"
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

// TLSConfigFromCA builds TLS config matching Node getDefaultAgent (cluster CA + system roots).
func TLSConfigFromCA(caCert []byte) *tls.Config {
	tlsCfg := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}
	pool, err := x509.SystemCertPool()
	if err != nil {
		pool = x509.NewCertPool()
	}
	if len(caCert) > 0 {
		pool.AppendCertsFromPEM(caCert)
	} else {
		tlsCfg.InsecureSkipVerify = true //nolint:gosec // matches auth.RESTConfig when CA missing
	}
	tlsCfg.RootCAs = pool
	return tlsCfg
}

// New returns a handler that proxies hub K8s API requests (/api, /apis, /version) with the user's token.
func New(clusterURL *url.URL, tlsConfig *tls.Config) http.Handler {
	transport := &http.Transport{
		TLSClientConfig:       tlsConfig,
		ForceAttemptHTTP2:     true,
		ResponseHeaderTimeout: 0,
	}
	rp := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			token := auth.TokenFromRequest(pr.In)
			stripped := server.StripMulticloud(pr.In.URL.Path)
			pr.SetURL(clusterURL)
			pr.Out.URL.Path = stripped
			pr.Out.URL.RawQuery = pr.In.URL.RawQuery
			pr.Out.Host = clusterURL.Host

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
		if auth.TokenFromRequest(r) == "" {
			w.WriteHeader(http.StatusUnauthorized)
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
