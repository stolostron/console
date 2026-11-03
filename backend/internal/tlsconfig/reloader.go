// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"bytes"
	"context"
	"crypto/tls"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"

	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	nextProtoH2     = "h2"
	nextProtoHTTP11 = "http/1.1"
	defaultDebounce = time.Second
)

var (
	errNoCertificate = errors.New("tls certificate not loaded")
)

// Reloader holds the live TLS settings and certificate. Handshakes read via
// GetConfigForClient / GetCertificate so profile and cert changes do not restart
// the HTTP server or drop existing connections.
type Reloader struct {
	mu       sync.RWMutex
	settings Settings
	cert     *tls.Certificate
}

// NewReloader starts at Intermediate (cluster-compliant default before the watch).
func NewReloader() *Reloader {
	return &Reloader{settings: IntermediateSettings()}
}

// TLSConfig is the listener config. ServeTLS with empty cert paths works because
// GetConfigForClient and GetCertificate are set (and NextProtos keep HTTP/2).
func (r *Reloader) TLSConfig() *tls.Config {
	return &tls.Config{
		MinVersion:         tls.VersionTLS12,
		NextProtos:         []string{nextProtoH2, nextProtoHTTP11},
		GetConfigForClient: r.GetConfigForClient,
		GetCertificate:     r.GetCertificate,
	}
}

// GetConfigForClient returns a clone of the current profile + cert for one handshake.
func (r *Reloader) GetConfigForClient(hello *tls.ClientHelloInfo) (*tls.Config, error) {
	r.mu.RLock()
	s := r.settings.clone()
	var certs []tls.Certificate
	if r.cert != nil {
		certs = []tls.Certificate{*r.cert}
	}
	r.mu.RUnlock()
	nextProtos := []string{nextProtoH2, nextProtoHTTP11}
	if s.noUsableCurves {
		if err := restrictToRSAKeyExchange(&s, hello); err != nil {
			return nil, err
		}
		// HTTP/2 disallows the TLS_RSA_* suites used by this fallback.
		nextProtos = []string{nextProtoHTTP11}
	}
	cfg := &tls.Config{
		MinVersion:       s.MinVersion,
		MaxVersion:       s.MaxVersion,
		CipherSuites:     s.CipherSuites,
		CurvePreferences: s.Curves,
		Certificates:     certs,
		NextProtos:       nextProtos,
		GetCertificate:   r.GetCertificate,
	}
	return cfg, nil
}

// restrictToRSAKeyExchange preserves Node's empty ecdhCurve behavior: TLS 1.3
// and ECDHE fail, while explicitly configured RSA key exchange can still work.
// Never downgrade a TLS 1.3 ClientHello or let empty CurvePreferences enable
// Go's default groups for ECDHE. TLS 1.2 RSA does not use a group.
func restrictToRSAKeyExchange(s *Settings, hello *tls.ClientHelloInfo) error {
	if hello == nil || s.MinVersion >= tls.VersionTLS13 {
		return errNoUsableTLSGroups
	}
	if s.MaxVersion == 0 || s.MaxVersion >= tls.VersionTLS13 {
		for _, version := range hello.SupportedVersions {
			if version == tls.VersionTLS13 {
				return errNoUsableTLSGroups
			}
		}
		s.MaxVersion = tls.VersionTLS12
	}
	var rsaCiphers []uint16
	for _, cipher := range s.CipherSuites {
		if strings.HasPrefix(tls.CipherSuiteName(cipher), "TLS_RSA_WITH_") {
			rsaCiphers = append(rsaCiphers, cipher)
		}
	}
	if len(rsaCiphers) == 0 {
		return errNoUsableTLSGroups
	}
	s.CipherSuites = rsaCiphers
	return nil
}

// GetCertificate returns the current certificate (updated on file rotation).
func (r *Reloader) GetCertificate(*tls.ClientHelloInfo) (*tls.Certificate, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if r.cert == nil {
		return nil, errNoCertificate
	}
	c := *r.cert
	return &c, nil
}

// Settings returns a copy of the active profile settings.
func (r *Reloader) Settings() Settings {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.settings.clone()
}

// Apply replaces TLS profile settings. Returns false when unchanged.
func (r *Reloader) Apply(s Settings) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if settingsEqual(r.settings, s) {
		applog.Logger().Debug("TLS security profile unchanged",
			"minVersion", s.MinVersion,
			"maxVersion", s.MaxVersion,
			"ciphers", len(s.CipherSuites),
			"curves", len(s.Curves),
		)
		return false
	}
	if len(s.unknownGroups) > 0 {
		applog.Logger().Warn("TLS security profile contains unknown groups", "groups", s.unknownGroups)
	}
	if len(s.excludedCurves) > 0 {
		applog.Logger().Debug("TLS groups excluded by FIPS policy", "curves", s.excludedCurves)
	}
	if s.noUsableCurves {
		applog.Logger().Error("TLS security profile has no usable groups", "groups", s.rejectedGroups)
	}
	r.settings = s.clone()
	applog.Logger().Info("TLS security profile changed",
		"minVersion", s.MinVersion,
		"maxVersion", s.MaxVersion,
		"ciphers", len(s.CipherSuites),
		"curves", len(s.Curves),
	)
	return true
}

// LoadCertificate replaces the serving cert. On failure the previous cert is kept.
func (r *Reloader) LoadCertificate(certFile, keyFile string) error {
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return err
	}
	r.mu.Lock()
	r.cert = &cert
	r.mu.Unlock()
	return nil
}

// HasCertificate reports whether a cert is loaded for ServeTLS.
func (r *Reloader) HasCertificate() bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.cert != nil
}

// WatchCerts reloads tls.crt/tls.key when dir changes. Blocks until ctx is done.
func WatchCerts(ctx context.Context, r *Reloader, dir, certFile, keyFile string, debounce time.Duration) {
	if debounce <= 0 {
		debounce = defaultDebounce
	}
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		applog.Logger().Warn("TLS cert watch disabled", "error", err)
		return
	}
	defer func() { _ = watcher.Close() }()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		applog.Logger().Warn("TLS cert watch disabled", "error", err)
		return
	}
	if err := watcher.Add(dir); err != nil {
		applog.Logger().Warn("TLS cert watch disabled", "dir", dir, "error", err)
		return
	}

	timer := time.NewTimer(debounce)
	if !timer.Stop() {
		<-timer.C
	}
	pending := false
	reload := func() {
		var prevDER []byte
		if prev, err := r.GetCertificate(nil); err == nil && len(prev.Certificate) > 0 {
			prevDER = prev.Certificate[0]
		}
		if err := r.LoadCertificate(certFile, keyFile); err != nil {
			applog.Logger().Error("TLS certificate reload failed; keeping previous", "error", err)
			return
		}
		next, err := r.GetCertificate(nil)
		if err != nil || len(next.Certificate) == 0 || bytes.Equal(prevDER, next.Certificate[0]) {
			return
		}
		applog.Logger().Info("TLS certificate reloaded",
			"cert", filepath.Base(certFile),
			"key", filepath.Base(keyFile),
		)
	}
	// Pick up a rotation that landed after the startup load and before watcher.Add.
	reload()

	for {
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case ev, ok := <-watcher.Events:
			if !ok {
				return
			}
			if ev.Op&(fsnotify.Write|fsnotify.Create|fsnotify.Remove|fsnotify.Rename) == 0 {
				continue
			}
			if !pending {
				pending = true
				timer.Reset(debounce)
			}
		case <-timer.C:
			pending = false
			reload()
		case <-watcher.Errors:
		}
	}
}
