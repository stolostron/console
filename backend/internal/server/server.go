// Copyright Contributors to the Open Cluster Management project

package server

import (
	"bufio"
	"context"
	"crypto/tls"
	"errors"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/stolostron/console/backend/internal/config"
	"github.com/stolostron/console/backend/internal/health"
	applog "github.com/stolostron/console/backend/internal/log"
	"github.com/stolostron/console/backend/internal/proxy"
)

const multicloudPrefix = "/multicloud"

type handlerOptions struct {
	rbacEvents http.Handler
}

// Option configures Handler.
type Option func(*handlerOptions)

// WithRBACEvents registers GET /events/rbac (and /multicloud/events/rbac).
func WithRBACEvents(h http.Handler) Option {
	return func(o *handlerOptions) {
		o.rbacEvents = h
	}
}

// StripMulticloud returns the path used for Go-owned route matching.
func StripMulticloud(path string) string {
	if path == multicloudPrefix {
		return "/"
	}
	if strings.HasPrefix(path, multicloudPrefix+"/") || path == multicloudPrefix {
		return path[len(multicloudPrefix):]
	}
	if strings.HasPrefix(path, multicloudPrefix) {
		return path[len(multicloudPrefix):]
	}
	return path
}

func isProbe(path string) bool {
	switch path {
	case "/livenessProbe", "/readinessProbe", "/ping":
		return true
	default:
		return false
	}
}

func isEventStream(path string) bool {
	return path == "/events/rbac"
}

// TLSConfigForSidecar is for the loopback Node sidecar. Local generate-certs
// writes a self-signed cert with no SAN, so hostname verification cannot succeed.
func TLSConfigForSidecar(_ *config.Config) *tls.Config {
	return &tls.Config{
		InsecureSkipVerify: true, //nolint:gosec // loopback sidecar; cert has no SAN
		MinVersion:         tls.VersionTLS12,
	}
}

// Handler builds the public mux: probes and migrated routes on Go, everything else to the sidecar.
func Handler(cfg *config.Config, opts ...Option) (http.Handler, error) {
	o := &handlerOptions{}
	for _, opt := range opts {
		opt(o)
	}
	target, err := url.Parse(cfg.NodeBackendURL)
	if err != nil {
		return nil, err
	}
	sidecarTLS := TLSConfigForSidecar(cfg)
	probes := health.New(target, sidecarTLS)
	sidecar := proxy.New(target, sidecarTLS)

	r := chi.NewRouter()
	r.Use(requestLogger)
	r.Get("/livenessProbe", probes.Liveness)
	r.Get("/readinessProbe", probes.Readiness)
	r.Get("/ping", probes.Ping)
	r.Get(multicloudPrefix+"/livenessProbe", probes.Liveness)
	r.Get(multicloudPrefix+"/readinessProbe", probes.Readiness)
	r.Get(multicloudPrefix+"/ping", probes.Ping)
	if o.rbacEvents != nil {
		r.Get("/events/rbac", o.rbacEvents.ServeHTTP)
		r.Get(multicloudPrefix+"/events/rbac", o.rbacEvents.ServeHTTP)
	}
	r.NotFound(sidecar.ServeHTTP)
	r.MethodNotAllowed(sidecar.ServeHTTP)
	return r, nil
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		stripped := StripMulticloud(r.URL.Path)
		// Do not wrap SSE: the wrapper can prevent HTTP/2 from flushing events to EventSource.
		if isProbe(stripped) || isEventStream(stripped) {
			next.ServeHTTP(w, r)
			return
		}
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		start := time.Now()
		next.ServeHTTP(rec, r)
		ms := time.Since(start).Milliseconds()
		applog.Logger().Info("request",
			"msg", strings.ToLower(r.Method),
			"path", r.URL.Path,
			"status", rec.status,
			"duration", ms,
		)
	})
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

func (s *statusRecorder) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	h, ok := s.ResponseWriter.(http.Hijacker)
	if !ok {
		return nil, nil, errors.New("hijacker not supported")
	}
	return h.Hijack()
}

func (s *statusRecorder) Flush() {
	if f, ok := s.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func (s *statusRecorder) Unwrap() http.ResponseWriter { return s.ResponseWriter }

// ListenAndServe starts TLS when certs exist (net/http enables HTTP/2 automatically), otherwise cleartext HTTP/1.1.
func ListenAndServe(ctx context.Context, cfg *config.Config, handler http.Handler) error {
	addr := net.JoinHostPort("", cfg.Port)
	srv := &http.Server{
		Addr:              addr,
		Handler:           handler,
		ReadHeaderTimeout: 10 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		certFile := filepath.Join(cfg.CertsDir, "tls.crt")
		keyFile := filepath.Join(cfg.CertsDir, "tls.key")
		if _, err := os.Stat(certFile); err == nil {
			if _, err := os.Stat(keyFile); err == nil {
				applog.Logger().Info("server start", "secure", true, "addr", addr)
				errCh <- srv.ListenAndServeTLS(certFile, keyFile)
				return
			}
		}
		applog.Logger().Info("server start", "secure", false, "addr", addr)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
		return ctx.Err()
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}
