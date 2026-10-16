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
	"github.com/stolostron/console/backend/internal/outbound"
	"github.com/stolostron/console/backend/internal/server"
)

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
	transport := outbound.Transport(tlsConfig, true)
	rp := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			token := auth.TokenFromRequest(pr.In)
			stripped := server.StripMulticloud(pr.In.URL.Path)
			pr.SetURL(clusterURL)
			pr.Out.URL.Path = stripped
			pr.Out.URL.RawQuery = pr.In.URL.RawQuery
			pr.Out.Host = clusterURL.Host
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
		if auth.TokenFromRequest(r) == "" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		rp.ServeHTTP(w, r)
	})
}
