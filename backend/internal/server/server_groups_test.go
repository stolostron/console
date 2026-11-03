// Copyright Contributors to the Open Cluster Management project

package server_test

import (
	"bufio"
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"sync"
	"testing"
	"time"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	k8swatch "k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/dynamic/fake"
	ktesting "k8s.io/client-go/testing"

	"github.com/stolostron/console/backend/internal/config"
	"github.com/stolostron/console/backend/internal/server"
)

func groupProfile(groups []string) *unstructured.Unstructured {
	custom := map[string]any{
		"minTLSVersion": "VersionTLS12",
		"ciphers":       []any{"ECDHE-RSA-AES128-GCM-SHA256", "AES128-GCM-SHA256", "TLS_AES_128_GCM_SHA256"},
	}
	if groups != nil {
		names := make([]any, len(groups))
		for i, name := range groups {
			names[i] = name
		}
		custom["groups"] = names
	}
	return &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "config.openshift.io/v1",
		"kind":       "APIServer",
		"metadata":   map[string]any{"name": "cluster", "resourceVersion": "1"},
		"spec":       map[string]any{"tlsSecurityProfile": map[string]any{"type": "Custom", "custom": custom}},
	}}
}

type groupListener struct {
	addr  string
	roots *x509.CertPool
	watch *k8swatch.RaceFreeFakeWatcher
}

// Exercise ListenAndServe -> WatchAPIServer -> FromProfile -> GetConfigForClient,
// with trusted localhost certificates and a fresh connection for every probe.
func startGroupListener(t *testing.T, profile *unstructured.Unstructured) *groupListener {
	t.Helper()
	dir := t.TempDir()
	writeListenerCert(t, dir)
	certPEM, err := os.ReadFile(filepath.Join(dir, "tls.crt"))
	if err != nil {
		t.Fatal(err)
	}
	roots := x509.NewCertPool()
	if !roots.AppendCertsFromPEM(certPEM) {
		t.Fatal("invalid test certificate")
	}
	gvr := schema.GroupVersionResource{Group: "config.openshift.io", Version: "v1", Resource: "apiservers"}
	dyn := fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{gvr: "APIServerList"}, profile)
	fw := k8swatch.NewRaceFreeFake()
	watching := make(chan struct{})
	var once sync.Once
	dyn.PrependWatchReactor("apiservers", func(ktesting.Action) (bool, k8swatch.Interface, error) {
		once.Do(func() { close(watching) }) // Initial list has already been applied.
		return true, fw, nil
	})
	cfg := &config.Config{Port: freeTCPPort(t), CertsDir: dir}
	ctx, cancel := context.WithCancel(context.Background())
	errCh := make(chan error, 1)
	go func() {
		errCh <- server.ListenAndServe(ctx, cfg, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}), dyn)
	}()
	t.Cleanup(func() {
		cancel()
		select {
		case serveErr := <-errCh:
			if !errors.Is(serveErr, context.Canceled) {
				t.Errorf("listener stopped: %v", serveErr)
			}
		case <-time.After(12 * time.Second):
			t.Error("listener did not stop")
		}
	})
	select {
	case <-watching:
	case <-time.After(3 * time.Second):
		t.Fatal("TLS profile watch did not start")
	}
	return &groupListener{addr: net.JoinHostPort("127.0.0.1", cfg.Port), roots: roots, watch: fw}
}

func (s *groupListener) clientConfig(version uint16, curve tls.CurveID, cipher uint16) *tls.Config {
	return &tls.Config{
		RootCAs: s.roots, ServerName: "localhost",
		MinVersion: version, MaxVersion: version,
		CurvePreferences: []tls.CurveID{curve}, CipherSuites: []uint16{cipher},
	}
}

func (s *groupListener) dial(cfg *tls.Config) (*tls.Conn, error) {
	return tls.DialWithDialer(&net.Dialer{Timeout: time.Second}, "tcp", s.addr, cfg)
}

func requestOnGroupConnection(conn *tls.Conn) error {
	if err := conn.SetDeadline(time.Now().Add(time.Second)); err != nil {
		return err
	}
	if _, err := io.WriteString(conn, "GET / HTTP/1.1\r\nHost: localhost\r\n\r\n"); err != nil {
		return err
	}
	response, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusNoContent {
		return fmt.Errorf("unexpected status %d", response.StatusCode)
	}
	return nil
}

func (s *groupListener) probe(cfg *tls.Config) error {
	conn, err := s.dial(cfg)
	if err != nil {
		return err
	}
	defer conn.Close()
	return requestOnGroupConnection(conn)
}

func requireGroupProbe(t *testing.T, s *groupListener, cfg *tls.Config, allowed bool) {
	t.Helper()
	if err := s.probe(cfg); (err == nil) != allowed {
		t.Fatalf("TLS %x, group %v, ciphers %v: allowed=%v, error=%v", cfg.MinVersion, cfg.CurvePreferences, cfg.CipherSuites, allowed, err)
	}
}

func waitGroupProbe(t *testing.T, s *groupListener, cfg *tls.Config, allowed bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if err := s.probe(cfg); (err == nil) == allowed {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatal("TLS group update did not reach the listener")
}

func TestListenerNodeGroupParity(t *testing.T) {
	for _, tc := range []struct {
		name    string
		groups  []string
		allowed []tls.CurveID
	}{
		{"omitted", nil, []tls.CurveID{tls.CurveP256, tls.CurveP384}},
		{"empty", []string{}, []tls.CurveID{tls.CurveP256, tls.CurveP384}},
		{"mixed unknown", []string{"future-group", "secp256r1"}, []tls.CurveID{tls.CurveP256}},
		{"all unknown", []string{"future-group"}, nil},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := startGroupListener(t, groupProfile(tc.groups))
			for _, version := range []uint16{tls.VersionTLS12, tls.VersionTLS13} {
				for _, curve := range []tls.CurveID{tls.CurveP256, tls.CurveP384, tls.CurveP521} {
					t.Run(fmt.Sprintf("%x/%s", version, curve), func(t *testing.T) {
						requireGroupProbe(t, s, s.clientConfig(version, curve, tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256), slices.Contains(tc.allowed, curve))
					})
				}
			}
			// RSA key exchange does not use a group, including for empty ecdhCurve.
			requireGroupProbe(t, s, s.clientConfig(tls.VersionTLS12, tls.CurveP521, tls.TLS_RSA_WITH_AES_128_GCM_SHA256), true)
		})
	}
}

func TestListenerGroupUpdates(t *testing.T) {
	s := startGroupListener(t, groupProfile([]string{"secp256r1"}))
	configFor := func(version uint16, curve tls.CurveID) *tls.Config {
		return s.clientConfig(version, curve, tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256)
	}
	p256 := configFor(tls.VersionTLS13, tls.CurveP256)
	p384 := configFor(tls.VersionTLS13, tls.CurveP384)
	established, err := s.dial(p256)
	if err != nil {
		t.Fatal(err)
	}
	defer established.Close()
	if requestErr := requestOnGroupConnection(established); requestErr != nil {
		t.Fatal(requestErr)
	}
	requireGroupProbe(t, s, p384, false)

	s.watch.Modify(groupProfile([]string{"secp384r1"}))
	waitGroupProbe(t, s, p384, true)
	for _, version := range []uint16{tls.VersionTLS12, tls.VersionTLS13} {
		requireGroupProbe(t, s, configFor(version, tls.CurveP256), false)
		requireGroupProbe(t, s, configFor(version, tls.CurveP384), true)
	}
	if requestErr := requestOnGroupConnection(established); requestErr != nil {
		t.Fatalf("existing connection interrupted by group update: %v", requestErr)
	}

	// Verify actual HTTP/2 after the group-only update.
	transport := &http.Transport{TLSClientConfig: p384.Clone(), ForceAttemptHTTP2: true}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, Timeout: 2 * time.Second}
	response, err := client.Get("https://" + s.addr)
	if err != nil {
		t.Fatal(err)
	}
	response.Body.Close()
	if response.ProtoMajor != 2 || response.StatusCode != http.StatusNoContent {
		t.Fatalf("HTTP/2 after group update: %s, %d", response.Proto, response.StatusCode)
	}

	// An unusable update must replace the previous group policy.
	s.watch.Modify(groupProfile([]string{"future-group"}))
	waitGroupProbe(t, s, p384, false)
	requireGroupProbe(t, s, p256, false)
	requireGroupProbe(t, s, s.clientConfig(tls.VersionTLS12, tls.CurveP256, tls.TLS_RSA_WITH_AES_128_GCM_SHA256), true)

	// Omitting groups restores the fixed fallback while preserving custom ciphers.
	s.watch.Modify(groupProfile(nil))
	waitGroupProbe(t, s, p256, true)
	requireGroupProbe(t, s, p384, true)
	requireGroupProbe(t, s, configFor(tls.VersionTLS13, tls.CurveP521), false)
	requireGroupProbe(t, s, s.clientConfig(tls.VersionTLS12, tls.CurveP256, tls.TLS_RSA_WITH_AES_128_GCM_SHA256), true)

	// Removing the whole profile restores Intermediate, which excludes RSA.
	removed := groupProfile(nil)
	unstructured.RemoveNestedField(removed.Object, "spec", "tlsSecurityProfile")
	s.watch.Modify(removed)
	waitGroupProbe(t, s, s.clientConfig(tls.VersionTLS12, tls.CurveP256, tls.TLS_RSA_WITH_AES_128_GCM_SHA256), false)
	requireGroupProbe(t, s, p256, true)
	requireGroupProbe(t, s, p384, true)
	requireGroupProbe(t, s, configFor(tls.VersionTLS13, tls.CurveP521), false)
}

func TestListenerHybridGroups(t *testing.T) {
	for _, tc := range []struct {
		name  string
		curve tls.CurveID
	}{
		{"X25519MLKEM768", tls.X25519MLKEM768},
		{"SecP256r1MLKEM768", tls.SecP256r1MLKEM768},
		{"SecP384r1MLKEM1024", tls.SecP384r1MLKEM1024},
	} {
		t.Run(tc.name, func(t *testing.T) {
			s := startGroupListener(t, groupProfile([]string{tc.name}))
			requireGroupProbe(t, s, s.clientConfig(tls.VersionTLS13, tc.curve, 0), true)
			requireGroupProbe(t, s, s.clientConfig(tls.VersionTLS13, tls.CurveP256, 0), false)
		})
	}
}
