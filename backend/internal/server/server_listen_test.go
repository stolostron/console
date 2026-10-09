// Copyright Contributors to the Open Cluster Management project

package server_test

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"errors"
	"math/big"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stolostron/console/backend/internal/config"
	"github.com/stolostron/console/backend/internal/server"
)

func writeListenerCert(t *testing.T, dir string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	serial, err := rand.Int(rand.Reader, big.NewInt(1<<62))
	if err != nil {
		t.Fatal(err)
	}
	tmpl := &x509.Certificate{
		SerialNumber: serial,
		Subject:      pkix.Name{CommonName: "listener-test"},
		NotBefore:    time.Now().Add(-time.Hour),
		NotAfter:     time.Now().Add(24 * time.Hour),
		DNSNames:     []string{"localhost"},
		IPAddresses:  []net.IP{net.ParseIP("127.0.0.1")},
		KeyUsage:     x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	certPath := filepath.Join(dir, "tls.crt")
	keyPath := filepath.Join(dir, "tls.key")
	if writeErr := os.WriteFile(certPath, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0o600); writeErr != nil {
		t.Fatal(writeErr)
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	if writeErr := os.WriteFile(keyPath, keyPEM, 0o600); writeErr != nil {
		t.Fatal(writeErr)
	}
}

func freeTCPPort(t *testing.T) string {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	port := strconv.Itoa(ln.Addr().(*net.TCPAddr).Port)
	_ = ln.Close()
	return port
}

func waitListenReady(t *testing.T, addr string, secure bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		var conn net.Conn
		var dialErr error
		if secure {
			conn, dialErr = tls.Dial("tcp", addr, &tls.Config{InsecureSkipVerify: true, MinVersion: tls.VersionTLS12}) //nolint:gosec
		} else {
			conn, dialErr = net.Dial("tcp", addr)
		}
		if dialErr == nil {
			_ = conn.Close()
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("listener %s (secure=%v) not ready", addr, secure)
}

func TestListenAndServePlainHTTPWithoutCerts(t *testing.T) {
	dir := t.TempDir()
	cfg := &config.Config{Port: freeTCPPort(t), CertsDir: dir}
	handler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	ctx, cancel := context.WithCancel(context.Background())
	var onListen atomic.Bool
	errCh := make(chan error, 1)
	go func() {
		errCh <- server.ListenAndServe(ctx, cfg, handler, nil, func() { onListen.Store(true) })
	}()

	addr := net.JoinHostPort("127.0.0.1", cfg.Port)
	waitListenReady(t, addr, false)
	if !onListen.Load() {
		t.Fatal("onListening hook not called")
	}

	client := &http.Client{Timeout: time.Second}
	resp, err := client.Get("http://" + addr)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status %d", resp.StatusCode)
	}

	cancel()
	if serveErr := <-errCh; !errors.Is(serveErr, context.Canceled) {
		t.Fatalf("ListenAndServe err=%v want context.Canceled", serveErr)
	}
}

func TestListenAndServeSecureWithCerts(t *testing.T) {
	dir := t.TempDir()
	writeListenerCert(t, dir)
	cfg := &config.Config{Port: freeTCPPort(t), CertsDir: dir}
	handler := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	ctx, cancel := context.WithCancel(context.Background())
	errCh := make(chan error, 1)
	go func() {
		errCh <- server.ListenAndServe(ctx, cfg, handler, nil)
	}()

	addr := net.JoinHostPort("127.0.0.1", cfg.Port)
	waitListenReady(t, addr, true)

	conn, err := tls.Dial("tcp", addr, &tls.Config{InsecureSkipVerify: true, MinVersion: tls.VersionTLS12}) //nolint:gosec
	if err != nil {
		t.Fatal(err)
	}
	if conn.ConnectionState().Version != tls.VersionTLS12 && conn.ConnectionState().Version != tls.VersionTLS13 {
		t.Fatalf("tls version 0x%x", conn.ConnectionState().Version)
	}
	_ = conn.Close()

	cancel()
	if serveErr := <-errCh; !errors.Is(serveErr, context.Canceled) {
		t.Fatalf("ListenAndServe err=%v want context.Canceled", serveErr)
	}
}

func TestListenAndServeInvalidCertFailsStartup(t *testing.T) {
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "tls.crt"), []byte("not a cert"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "tls.key"), []byte("not a key"), 0o600); err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{Port: freeTCPPort(t), CertsDir: dir}
	ctx := context.Background()
	err := server.ListenAndServe(ctx, cfg, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}), nil)
	if err == nil {
		t.Fatal("expected certificate load error")
	}
}
