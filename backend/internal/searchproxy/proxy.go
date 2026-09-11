// Copyright Contributors to the Open Cluster Management project

package searchproxy

import (
	"context"
	"crypto/tls"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/websocket"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

var requestHeaders = []string{
	"Accept",
	"Accept-Encoding",
	"Content-Encoding",
	"Content-Length",
	"Content-Type",
}

const defaultDialTimeout = 60 * time.Second

type tokenCtxKey struct{}

// Options configure the user-token Search GraphQL proxy and WebSocket relay.
type Options struct {
	RESTConfig  *rest.Config
	TLSConfig   *tls.Config
	Endpoint    func(ctx context.Context) string
	Authn       func(w http.ResponseWriter, r *http.Request) (string, bool)
	DialTimeout time.Duration
	Dialer      *websocket.Dialer
}

// Handler proxies POST /proxy/search and graphql-ws upgrades to search-api.
type Handler struct {
	TLSConfig   *tls.Config
	Endpoint    func(ctx context.Context) string
	Authn       func(w http.ResponseWriter, r *http.Request) (string, bool)
	DialTimeout time.Duration
	Dialer      *websocket.Dialer
	proxy       *httputil.ReverseProxy
}

// New returns a handler for POST GraphQL and WebSocket search-api relay.
func New(opts Options) *Handler {
	h := &Handler{
		TLSConfig:   opts.TLSConfig,
		Endpoint:    opts.Endpoint,
		Authn:       opts.Authn,
		DialTimeout: opts.DialTimeout,
		Dialer:      opts.Dialer,
	}
	if h.DialTimeout <= 0 {
		h.DialTimeout = defaultDialTimeout
	}
	if h.Authn == nil && opts.RESTConfig != nil {
		h.Authn = func(w http.ResponseWriter, r *http.Request) (string, bool) {
			return auth.AuthenticateRequest(r.Context(), opts.RESTConfig, w, r)
		}
	}
	h.proxy = &httputil.ReverseProxy{
		Rewrite:       h.rewrite,
		ErrorHandler:  proxyError,
		Transport:     h.transport(),
		FlushInterval: -1 * time.Millisecond,
	}
	return h
}

func (h *Handler) transport() http.RoundTripper {
	return &http.Transport{
		TLSClientConfig:       h.TLSConfig,
		ForceAttemptHTTP2:     false,
		ResponseHeaderTimeout: 0,
	}
}

func proxyError(w http.ResponseWriter, _ *http.Request, err error) {
	applog.Logger().Error("search proxy", "error", err)
	w.WriteHeader(http.StatusBadGateway)
}

func (h *Handler) rewrite(pr *httputil.ProxyRequest) {
	token, _ := pr.In.Context().Value(tokenCtxKey{}).(string)
	if token == "" {
		token = auth.TokenFromRequest(pr.In)
	}
	endpoint := ""
	if h.Endpoint != nil {
		endpoint = h.Endpoint(pr.In.Context())
	}
	target, err := url.Parse(endpoint)
	if err != nil || target.Scheme == "" || target.Host == "" {
		return
	}
	pr.SetURL(target)
	pr.Out.URL.Path = target.Path
	pr.Out.URL.RawPath = target.RawPath
	pr.Out.URL.RawQuery = pr.In.URL.RawQuery
	pr.Out.Host = target.Host
	pr.Out.Header = http.Header{}
	for _, name := range requestHeaders {
		if v := pr.In.Header.Get(name); v != "" {
			pr.Out.Header.Set(name, v)
		}
	}
	pr.Out.Header.Set("Authorization", "Bearer "+token)
}

func (h *Handler) authenticate(w http.ResponseWriter, r *http.Request) (string, bool) {
	if h.Authn != nil {
		return h.Authn(w, r)
	}
	w.WriteHeader(http.StatusUnauthorized)
	return "", false
}

// ServeHTTP authenticates, then ReverseProxy POST or relays a WebSocket upgrade.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token, ok := h.authenticate(w, r)
	if !ok {
		return
	}
	r = r.WithContext(context.WithValue(r.Context(), tokenCtxKey{}, token))
	if websocket.IsWebSocketUpgrade(r) {
		h.serveWebSocket(w, r, token)
		return
	}
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	h.proxy.ServeHTTP(w, r)
}

func httpToWebSocketURL(endpoint string) string {
	switch {
	case strings.HasPrefix(endpoint, "https://"):
		return "wss://" + strings.TrimPrefix(endpoint, "https://")
	case strings.HasPrefix(endpoint, "http://"):
		return "ws://" + strings.TrimPrefix(endpoint, "http://")
	default:
		return endpoint
	}
}
