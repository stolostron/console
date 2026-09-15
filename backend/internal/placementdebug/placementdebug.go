// Copyright Contributors to the Open Cluster Management project

package placementdebug

import (
	"crypto/tls"
	"encoding/json"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"sync"
	"time"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/outbound"
	applog "github.com/stolostron/console/backend/internal/log"
)

const defaultPlacementDebugURL = "https://cluster-manager-placement.open-cluster-management-hub.svc.cluster.local:9443/debug/placements/"

var requestHeaders = []string{
	"Accept",
	"Accept-Encoding",
	"Content-Encoding",
	"Content-Length",
	"Content-Type",
}

var responseHeaders = []string{
	"Cache-Control",
	"Content-Length",
	"Content-Encoding",
	"Etag",
}

// Options configure the placement-debug reverse proxy.
type Options struct {
	RESTConfig *rest.Config
	Authn      func(w http.ResponseWriter, r *http.Request) (string, bool)
	GetCA      func() []byte
	Endpoint   func() string
}

// Handler proxies POST /placement-debug.
type Handler struct {
	RESTConfig *rest.Config
	Authn      func(w http.ResponseWriter, r *http.Request) (string, bool)
	GetCA      func() []byte
	Endpoint   func() string

	mu    sync.Mutex
	proxy *httputil.ReverseProxy
	ca    string
}

// New returns a placement-debug proxy handler.
func New(opts Options) *Handler {
	h := &Handler{
		RESTConfig: opts.RESTConfig,
		Authn:      opts.Authn,
		GetCA:      opts.GetCA,
		Endpoint:   opts.Endpoint,
	}
	if h.Authn == nil && opts.RESTConfig != nil {
		h.Authn = func(w http.ResponseWriter, r *http.Request) (string, bool) {
			return auth.AuthenticateRequest(r.Context(), opts.RESTConfig, w, r)
		}
	}
	if h.Endpoint == nil {
		h.Endpoint = func() string {
			if v := os.Getenv("PLACEMENT_DEBUG_URL"); v != "" {
				return v
			}
			return defaultPlacementDebugURL
		}
	}
	return h
}

func (h *Handler) authenticate(w http.ResponseWriter, r *http.Request) (string, bool) {
	if h.Authn != nil {
		return h.Authn(w, r)
	}
	w.WriteHeader(http.StatusUnauthorized)
	return "", false
}

func (h *Handler) caPEM() []byte {
	if h.GetCA != nil {
		return h.GetCA()
	}
	return nil
}

func (h *Handler) reverseProxy(target *url.URL, ca []byte) *httputil.ReverseProxy {
	pem := string(ca)
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.proxy != nil && h.ca == pem {
		return h.proxy
	}
	tlsCfg := &tls.Config{MinVersion: tls.VersionTLS12, RootCAs: nil}
	if len(ca) > 0 {
		tlsCfg = auth.TLSConfigFromCA(ca, false)
	}
	rp := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			token := auth.TokenFromRequest(pr.In)
			pr.SetURL(target)
			pr.Out.URL.Path = target.Path
			pr.Out.URL.RawPath = target.RawPath
			pr.Out.URL.RawQuery = pr.In.URL.RawQuery
			pr.Out.Host = target.Hostname()
			pr.Out.Header = http.Header{}
			for _, name := range requestHeaders {
				if v := pr.In.Header.Get(name); v != "" {
					pr.Out.Header.Set(name, v)
				}
			}
			pr.Out.Header.Set("Content-Type", "application/json")
			pr.Out.Header.Set("Authorization", "Bearer "+token)
			pr.Out.Header.Set("Host", target.Hostname())
		},
		ModifyResponse: func(resp *http.Response) error {
			filtered := http.Header{"Content-Type": []string{"application/json"}}
			for _, name := range responseHeaders {
				for _, v := range resp.Header.Values(name) {
					filtered.Add(name, v)
				}
			}
			resp.Header = filtered
			return nil
		},
		ErrorHandler: func(w http.ResponseWriter, _ *http.Request, err error) {
			applog.Logger().Error("placement debug upstream error", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
		},
		Transport: outbound.Transport(tlsCfg, false),
		FlushInterval: -1 * time.Millisecond,
	}
	h.proxy = rp
	h.ca = pem
	return rp
}

// ServeHTTP authenticates and reverse-proxies to the placement debug service.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if _, ok := h.authenticate(w, r); !ok {
		return
	}
	ca := h.caPEM()
	if len(ca) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error": "Placement debug service unavailable — OCM CA bundle not configured",
		})
		return
	}
	endpoint := ""
	if h.Endpoint != nil {
		endpoint = h.Endpoint()
	}
	target, err := url.Parse(endpoint)
	if err != nil || target.Scheme == "" || target.Host == "" {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	h.reverseProxy(target, ca).ServeHTTP(w, r)
}
