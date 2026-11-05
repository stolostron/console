// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"crypto/x509"
	"net"
	"os"
	"testing"
	"time"
)

// A group list that filters to nothing (unknown names or FIPS exclusions) must
// reject every handshake, including TLS 1.2 RSA key exchange. This deliberately
// diverges from the Node backend, which kept serving RSA ciphers with an empty
// ecdhCurve; the OpenShift TLS curves enhancement expects handshakes to fail
// rather than fall back to unrequested key exchange.
func TestNoUsableGroupsRejectsHandshakes(t *testing.T) {
	dir := t.TempDir()
	cert, key := writeRSACert(t, dir, "no-groups")
	pem, err := os.ReadFile(cert)
	if err != nil {
		t.Fatal(err)
	}
	roots := x509.NewCertPool()
	if !roots.AppendCertsFromPEM(pem) {
		t.Fatal("invalid test root")
	}
	for _, input := range []struct {
		name   string
		groups []string
		fips   bool
	}{
		{"unknown", []string{"future-group"}, false},
		{"excluded by FIPS", []string{"X25519", "X25519MLKEM768"}, true},
	} {
		t.Run(input.name, func(t *testing.T) {
			r := NewReloader()
			if err := r.LoadCertificate(cert, key); err != nil {
				t.Fatal(err)
			}
			r.Apply(fromProfile(SecurityProfile{Type: "Custom", Custom: &CustomSpec{
				MinTLSVersion: "VersionTLS12",
				// RSA key exchange is offered; it must still be rejected.
				Ciphers: []string{"ECDHE-RSA-AES128-GCM-SHA256", "AES128-GCM-SHA256", "TLS_AES_128_GCM_SHA256"},
				Groups:  input.groups,
			}}, input.fips))
			addr, stop := startTLS(t, r)
			defer stop()
			for _, tc := range []struct {
				name     string
				min, max uint16
				cipher   uint16
			}{
				{"TLS13", tls.VersionTLS13, tls.VersionTLS13, 0},
				{"TLS12 ECDHE", tls.VersionTLS12, tls.VersionTLS12, tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256},
				{"TLS12 RSA", tls.VersionTLS12, tls.VersionTLS12, tls.TLS_RSA_WITH_AES_128_GCM_SHA256},
			} {
				t.Run(tc.name, func(t *testing.T) {
					cfg := &tls.Config{RootCAs: roots, ServerName: "localhost", MinVersion: tc.min, MaxVersion: tc.max, CurvePreferences: []tls.CurveID{tls.CurveP256}}
					if tc.cipher != 0 {
						cfg.CipherSuites = []uint16{tc.cipher}
					}
					conn, err := tls.DialWithDialer(&net.Dialer{Timeout: time.Second}, "tcp", addr, cfg)
					if conn != nil {
						conn.Close()
					}
					if err == nil {
						t.Fatal("handshake should be rejected when no usable groups remain")
					}
				})
			}
		})
	}
}
