// Copyright Contributors to the Open Cluster Management project

package mcproxy

import (
	"context"
	"crypto/tls"
	"errors"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/clusterproxy"
	applog "github.com/stolostron/console/backend/internal/log"
	"github.com/stolostron/console/backend/internal/server"
)

// Options configure the managed-cluster reverse proxy.
type Options struct {
	Resolver   *clusterproxy.Resolver
	TLSConfig  *tls.Config
	RESTConfig *rest.Config
	// Validate, if set, replaces GET /api token validation (tests).
	Validate func(ctx context.Context, token string) error
}

// New proxies /managedclusterproxy/<cluster>/<apiPath> to the cluster-proxy addon.
func New(opts Options) http.Handler {
	transport := &http.Transport{
		TLSClientConfig:       opts.TLSConfig,
		ForceAttemptHTTP2:     false, // HTTP/1.1 so WebSocket upgrades work
		ResponseHeaderTimeout: 0,
	}
	rp := &httputil.ReverseProxy{
		Rewrite: func(pr *httputil.ProxyRequest) {
			target, err := opts.Resolver.ProxyURL(pr.In.Context())
			if err != nil {
				return
			}
			stripped := server.StripMulticloud(pr.In.URL.Path)
			pr.SetURL(target)
			pr.Out.URL.Path = rewritePath(stripped)
			pr.Out.URL.RawQuery = pr.In.URL.RawQuery
			host := target.Hostname()
			pr.Out.Host = host
			token := auth.TokenFromRequest(pr.In)
			pr.Out.Header.Set("Authorization", "Bearer "+token)
			pr.Out.Header.Set("Origin", "https://"+host)
		},
		ErrorHandler: func(w http.ResponseWriter, _ *http.Request, err error) {
			applog.Logger().Error("managed cluster proxy", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
		},
		Transport:     transport,
		FlushInterval: -1 * time.Millisecond,
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !authorize(opts, w, r) {
			return
		}
		rp.ServeHTTP(w, r)
	})
}

func authorize(opts Options, w http.ResponseWriter, r *http.Request) bool {
	if opts.Validate != nil {
		token, ok := auth.RequireToken(w, r)
		if !ok {
			return false
		}
		if err := opts.Validate(r.Context(), token); err != nil {
			var se *auth.StatusError
			if errors.As(err, &se) && se.Status != 0 {
				w.WriteHeader(se.Status)
				return false
			}
			w.WriteHeader(http.StatusInternalServerError)
			return false
		}
		return true
	}
	_, ok := auth.AuthenticateRequest(r.Context(), opts.RESTConfig, w, r)
	return ok
}

func rewritePath(stripped string) string {
	trimmed := strings.TrimPrefix(stripped, "/")
	parts := strings.Split(trimmed, "/")
	if len(parts) < 2 {
		return "/"
	}
	cluster := parts[1]
	apiPath := strings.Join(parts[2:], "/")
	if apiPath == "" {
		return "/" + cluster + "/"
	}
	return "/" + cluster + "/" + apiPath
}
