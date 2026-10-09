// Copyright Contributors to the Open Cluster Management project

package tlsconfig

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
	"testing"
	"time"
)

func writeRSACert(t *testing.T, dir, cn string) (certFile, keyFile string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	return writeCert(t, dir, cn, key)
}

func writeCert(t *testing.T, dir, cn string, key *rsa.PrivateKey) (certFile, keyFile string) {
	t.Helper()
	serial, err := rand.Int(rand.Reader, big.NewInt(1<<62))
	if err != nil {
		t.Fatal(err)
	}
	tmpl := &x509.Certificate{
		SerialNumber: serial,
		Subject:      pkix.Name{CommonName: cn},
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
	certFile = filepath.Join(dir, cn+".crt")
	keyFile = filepath.Join(dir, cn+".key")
	if err := os.WriteFile(certFile, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0o600); err != nil {
		t.Fatal(err)
	}
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	if err := os.WriteFile(keyFile, keyPEM, 0o600); err != nil {
		t.Fatal(err)
	}
	return certFile, keyFile
}

func startTLS(t *testing.T, r *Reloader) (addr string, shutdown func()) {
	t.Helper()
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	srv := &http.Server{
		Handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		}),
		TLSConfig:         r.TLSConfig(),
		ReadHeaderTimeout: time.Second,
	}
	errCh := make(chan error, 1)
	go func() { errCh <- srv.ServeTLS(ln, "", "") }()
	return ln.Addr().String(), func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
		<-errCh
	}
}

func TestApplyUnchanged(t *testing.T) {
	r := NewReloader()
	if r.Apply(IntermediateSettings()) {
		t.Fatal("default Intermediate Apply should be unchanged")
	}
	if !r.Apply(FromProfile(SecurityProfile{Type: "Modern"})) {
		t.Fatal("Modern should change settings")
	}
	if r.Apply(FromProfile(SecurityProfile{Type: "Modern"})) {
		t.Fatal("second Modern Apply should be unchanged")
	}
}

func TestCertificateRotationKeepsOldConn(t *testing.T) {
	dir := t.TempDir()
	certA, keyA := writeRSACert(t, dir, "cert-a")
	certB, keyB := writeRSACert(t, dir, "cert-b")
	r := NewReloader()
	if err := r.LoadCertificate(certA, keyA); err != nil {
		t.Fatal(err)
	}
	addr, stop := startTLS(t, r)
	defer stop()

	connA, err := tls.Dial("tcp", addr, &tls.Config{InsecureSkipVerify: true, MinVersion: tls.VersionTLS12}) //nolint:gosec
	if err != nil {
		t.Fatal(err)
	}
	defer connA.Close()
	if cn := connA.ConnectionState().PeerCertificates[0].Subject.CommonName; cn != "cert-a" {
		t.Fatalf("first handshake CN %q", cn)
	}

	if loadErr := r.LoadCertificate(certB, keyB); loadErr != nil {
		t.Fatal(loadErr)
	}

	buf := make([]byte, 1)
	_ = connA.SetReadDeadline(time.Now().Add(200 * time.Millisecond))
	_, err = connA.Read(buf)
	var ne net.Error
	if err == nil || !errors.As(err, &ne) || !ne.Timeout() {
		t.Fatalf("old connection should still be idle-open after reload, got %v", err)
	}

	connB, dialErr := tls.Dial("tcp", addr, &tls.Config{InsecureSkipVerify: true, MinVersion: tls.VersionTLS12}) //nolint:gosec
	if dialErr != nil {
		t.Fatal(dialErr)
	}
	defer connB.Close()
	if cn := connB.ConnectionState().PeerCertificates[0].Subject.CommonName; cn != "cert-b" {
		t.Fatalf("second handshake CN %q want cert-b", cn)
	}
}

func TestWatchCertsReloads(t *testing.T) {
	dir := t.TempDir()
	certA, keyA := writeRSACert(t, dir, "watch-a")
	servingCert := filepath.Join(dir, "tls.crt")
	servingKey := filepath.Join(dir, "tls.key")
	if err := os.Rename(certA, servingCert); err != nil {
		t.Fatal(err)
	}
	if err := os.Rename(keyA, servingKey); err != nil {
		t.Fatal(err)
	}
	r := NewReloader()
	if err := r.LoadCertificate(servingCert, servingKey); err != nil {
		t.Fatal(err)
	}
	addr, stop := startTLS(t, r)
	defer stop()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go WatchCerts(ctx, r, dir, servingCert, servingKey, 20*time.Millisecond)

	certB, keyB := writeRSACert(t, dir, "watch-b")
	certPEM, readErr := os.ReadFile(certB)
	if readErr != nil {
		t.Fatal(readErr)
	}
	if writeErr := os.WriteFile(servingCert, certPEM, 0o600); writeErr != nil {
		t.Fatal(writeErr)
	}
	keyPEM, keyReadErr := os.ReadFile(keyB)
	if keyReadErr != nil {
		t.Fatal(keyReadErr)
	}
	if writeErr := os.WriteFile(servingKey, keyPEM, 0o600); writeErr != nil {
		t.Fatal(writeErr)
	}

	deadline := time.Now().Add(3 * time.Second)
	for {
		conn, err := tls.Dial("tcp", addr, &tls.Config{InsecureSkipVerify: true, MinVersion: tls.VersionTLS12}) //nolint:gosec
		if err == nil {
			cn := conn.ConnectionState().PeerCertificates[0].Subject.CommonName
			conn.Close()
			if cn == "watch-b" {
				return
			}
		}
		if time.Now().After(deadline) {
			t.Fatalf("cert did not rotate; last err=%v", err)
		}
		time.Sleep(50 * time.Millisecond)
	}
}

func TestRejectTLS12AgainstModern(t *testing.T) {
	dir := t.TempDir()
	cert, key := writeRSACert(t, dir, "modern")
	r := NewReloader()
	if err := r.LoadCertificate(cert, key); err != nil {
		t.Fatal(err)
	}
	r.Apply(FromProfile(SecurityProfile{Type: "Modern"}))
	addr, stop := startTLS(t, r)
	defer stop()

	_, err := tls.Dial("tcp", addr, &tls.Config{
		InsecureSkipVerify: true, //nolint:gosec
		MinVersion:         tls.VersionTLS12,
		MaxVersion:         tls.VersionTLS12,
	})
	if err == nil {
		t.Fatal("TLS 1.2 handshake against Modern should fail")
	}
}

func TestRejectTLS11AgainstIntermediate(t *testing.T) {
	dir := t.TempDir()
	cert, key := writeRSACert(t, dir, "inter")
	r := NewReloader()
	if err := r.LoadCertificate(cert, key); err != nil {
		t.Fatal(err)
	}
	addr, stop := startTLS(t, r)
	defer stop()

	_, err := tls.Dial("tcp", addr, &tls.Config{
		InsecureSkipVerify: true, //nolint:gosec
		MinVersion:         tls.VersionTLS11,
		MaxVersion:         tls.VersionTLS11,
	})
	if err == nil {
		t.Fatal("TLS 1.1 handshake against Intermediate should fail")
	}
}

func TestRejectDisallowedCipher(t *testing.T) {
	dir := t.TempDir()
	cert, key := writeRSACert(t, dir, "cipher")
	r := NewReloader()
	if err := r.LoadCertificate(cert, key); err != nil {
		t.Fatal(err)
	}
	r.Apply(fromProfile(SecurityProfile{
		Type: "Custom",
		Custom: &CustomSpec{
			MinTLSVersion: "VersionTLS12",
			Ciphers:       []string{"ECDHE-RSA-AES128-GCM-SHA256"},
			Groups:        []string{"X25519", "secp256r1"},
		},
	}, false))
	addr, stop := startTLS(t, r)
	defer stop()

	_, err := tls.Dial("tcp", addr, &tls.Config{
		InsecureSkipVerify: true, //nolint:gosec
		MinVersion:         tls.VersionTLS12,
		MaxVersion:         tls.VersionTLS12,
		CipherSuites:       []uint16{tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384},
	})
	if err == nil {
		t.Fatal("disallowed cipher should fail")
	}

	conn, err := tls.Dial("tcp", addr, &tls.Config{
		InsecureSkipVerify: true, //nolint:gosec
		MinVersion:         tls.VersionTLS12,
		MaxVersion:         tls.VersionTLS12,
		CipherSuites:       []uint16{tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256},
	})
	if err != nil {
		t.Fatalf("allowed cipher should succeed: %v", err)
	}
	conn.Close()
}

func TestHTTP2AfterModernToIntermediate(t *testing.T) {
	dir := t.TempDir()
	cert, key := writeRSACert(t, dir, "h2")
	r := NewReloader()
	if err := r.LoadCertificate(cert, key); err != nil {
		t.Fatal(err)
	}
	r.Apply(FromProfile(SecurityProfile{Type: "Modern"}))
	addr, stop := startTLS(t, r)
	defer stop()

	get := func() {
		t.Helper()
		tr := &http.Transport{
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true, //nolint:gosec
				NextProtos:         []string{"h2", "http/1.1"},
			},
			ForceAttemptHTTP2: true,
		}
		client := &http.Client{Transport: tr, Timeout: 3 * time.Second}
		resp, err := client.Get("https://" + addr)
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		if resp.ProtoMajor != 2 {
			t.Fatalf("proto %s want HTTP/2", resp.Proto)
		}
	}

	get()
	if !r.Apply(FromProfile(SecurityProfile{Type: "Intermediate"})) {
		t.Fatal("expected profile change")
	}
	get()
}

func TestLoadCertificateKeepsPreviousOnFailure(t *testing.T) {
	dir := t.TempDir()
	certA, keyA := writeRSACert(t, dir, "keep")
	r := NewReloader()
	if err := r.LoadCertificate(certA, keyA); err != nil {
		t.Fatal(err)
	}
	if err := r.LoadCertificate(filepath.Join(dir, "missing.crt"), filepath.Join(dir, "missing.key")); err == nil {
		t.Fatal("expected error")
	}
	if !r.HasCertificate() {
		t.Fatal("previous cert should remain")
	}
}

func TestGetCertificateWithoutCert(t *testing.T) {
	r := NewReloader()
	if _, err := r.GetCertificate(nil); err == nil {
		t.Fatal("expected errNoCertificate")
	}
}
