// Copyright Contributors to the Open Cluster Management project

package outbound

import "net/http"

// ProxyRequestHeaders are hop-safe request headers forwarded to hub upstreams.
var ProxyRequestHeaders = []string{
	"Accept",
	"Accept-Encoding",
	"Content-Encoding",
	"Content-Length",
	"Content-Type",
}

// ProxyResponseHeaders are hop-safe response headers returned to the browser.
var ProxyResponseHeaders = []string{
	"Cache-Control",
	"Content-Type",
	"Content-Length",
	"Content-Encoding",
	"Etag",
}

// CopyRequestHeaders copies allowlisted headers from src onto a fresh dst map
// and sets Authorization: Bearer <token>.
func CopyRequestHeaders(dst, src http.Header, token string, names []string) {
	if dst == nil {
		return
	}
	for _, name := range names {
		if v := src.Get(name); v != "" {
			dst.Set(name, v)
		}
	}
	if token != "" {
		dst.Set("Authorization", "Bearer "+token)
	}
}

// FilterResponseHeaders keeps only allowlisted response headers.
func FilterResponseHeaders(resp *http.Response, names []string) error {
	if resp == nil {
		return nil
	}
	filtered := http.Header{}
	for _, name := range names {
		for _, v := range resp.Header.Values(name) {
			filtered.Add(name, v)
		}
	}
	resp.Header = filtered
	return nil
}

// BadGateway writes StatusBadGateway (reverse-proxy ErrorHandler).
func BadGateway(w http.ResponseWriter, _ *http.Request, _ error) {
	w.WriteHeader(http.StatusBadGateway)
}
