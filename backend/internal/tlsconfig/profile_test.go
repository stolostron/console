// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"slices"
	"testing"
)

func TestFromProfileBuiltins(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name       string
		profile    SecurityProfile
		min, max   uint16
		wantCurves []tls.CurveID
	}{
		{
			name:       "empty type is Intermediate",
			profile:    SecurityProfile{},
			min:        tls.VersionTLS12,
			wantCurves: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256, tls.CurveP384},
		},
		{
			name:       "Intermediate",
			profile:    SecurityProfile{Type: "Intermediate"},
			min:        tls.VersionTLS12,
			wantCurves: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256, tls.CurveP384},
		},
		{
			name:       "unknown type is Intermediate",
			profile:    SecurityProfile{Type: "NotAProfile"},
			min:        tls.VersionTLS12,
			wantCurves: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256, tls.CurveP384},
		},
		{
			name:       "Old",
			profile:    SecurityProfile{Type: "Old"},
			min:        tls.VersionTLS10,
			wantCurves: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256, tls.CurveP384},
		},
		{
			name:       "Modern",
			profile:    SecurityProfile{Type: "Modern"},
			min:        tls.VersionTLS13,
			max:        tls.VersionTLS13,
			wantCurves: []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256, tls.CurveP384},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			s := fromProfile(tc.profile, false)
			if s.MinVersion != tc.min {
				t.Fatalf("MinVersion 0x%x want 0x%x", s.MinVersion, tc.min)
			}
			if s.MaxVersion != tc.max {
				t.Fatalf("MaxVersion 0x%x want 0x%x", s.MaxVersion, tc.max)
			}
			if !slices.Equal(s.Curves, tc.wantCurves) {
				t.Fatalf("Curves %v want %v", s.Curves, tc.wantCurves)
			}
		})
	}
}

func TestIntermediateOmitsTLS13AndDHECiphers(t *testing.T) {
	t.Parallel()
	s := fromProfile(SecurityProfile{Type: "Intermediate"}, false)
	want := []uint16{
		tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
		tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
		tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
		tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
		tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
		tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
	}
	if !slices.Equal(s.CipherSuites, want) {
		t.Fatalf("CipherSuites %v want %v", s.CipherSuites, want)
	}
}

func TestModernHasNoTLS12CipherSuites(t *testing.T) {
	t.Parallel()
	s := fromProfile(SecurityProfile{Type: "Modern"}, false)
	if len(s.CipherSuites) != 0 {
		t.Fatalf("Modern CipherSuites %v want empty (TLS 1.3 only)", s.CipherSuites)
	}
}

func TestCustomTLS13IgnoresCiphersUsesModern(t *testing.T) {
	t.Parallel()
	s := fromProfile(SecurityProfile{
		Type: "Custom",
		Custom: &CustomSpec{
			MinTLSVersion: "VersionTLS13",
			Ciphers:       []string{"ECDHE-RSA-AES128-GCM-SHA256"},
		},
	}, false)
	if s.MinVersion != tls.VersionTLS13 || s.MaxVersion != tls.VersionTLS13 {
		t.Fatalf("versions min=0x%x max=0x%x want TLS1.3", s.MinVersion, s.MaxVersion)
	}
	if len(s.CipherSuites) != 0 {
		t.Fatalf("custom TLS1.3 CipherSuites %v want empty", s.CipherSuites)
	}
}

func TestCustomTLS12MapsCiphers(t *testing.T) {
	t.Parallel()
	s := fromProfile(SecurityProfile{
		Type: "Custom",
		Custom: &CustomSpec{
			MinTLSVersion: "VersionTLS12",
			Ciphers:       []string{"ECDHE-RSA-AES128-GCM-SHA256", "TLS_AES_128_GCM_SHA256"},
			Groups:        []string{"X25519", "secp256r1"},
		},
	}, false)
	if s.MinVersion != tls.VersionTLS12 {
		t.Fatalf("MinVersion 0x%x", s.MinVersion)
	}
	if s.MaxVersion != 0 {
		t.Fatalf("MaxVersion %d want 0 (TLS 1.3 still allowed)", s.MaxVersion)
	}
	want := []uint16{tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256}
	if !slices.Equal(s.CipherSuites, want) {
		t.Fatalf("CipherSuites %v want %v", s.CipherSuites, want)
	}
	if !slices.Equal(s.Curves, []tls.CurveID{tls.X25519, tls.CurveP256}) {
		t.Fatalf("Curves %v", s.Curves)
	}
}

func TestCustomEmptyMinDefaultsTLS12(t *testing.T) {
	t.Parallel()
	s := fromProfile(SecurityProfile{Type: "Custom", Custom: &CustomSpec{}}, false)
	if s.MinVersion != tls.VersionTLS12 {
		t.Fatalf("MinVersion 0x%x want TLS1.2", s.MinVersion)
	}
}

func TestFIPSFiltersCurves(t *testing.T) {
	t.Parallel()
	s := fromProfile(SecurityProfile{Type: "Intermediate"}, true)
	want := []tls.CurveID{tls.CurveP256, tls.CurveP384}
	if !slices.Equal(s.Curves, want) {
		t.Fatalf("FIPS curves %v want %v", s.Curves, want)
	}
}

func TestFIPSCustomDropsX25519(t *testing.T) {
	t.Parallel()
	s := fromProfile(SecurityProfile{
		Type: "Custom",
		Custom: &CustomSpec{
			MinTLSVersion: "VersionTLS12",
			Groups:        []string{"X25519", "X25519MLKEM768", "secp521r1"},
		},
	}, true)
	if !slices.Equal(s.Curves, []tls.CurveID{tls.CurveP521}) {
		t.Fatalf("Curves %v want P521 only", s.Curves)
	}
}

func TestSettingsEqual(t *testing.T) {
	t.Parallel()
	a := fromProfile(SecurityProfile{Type: "Intermediate"}, false)
	b := fromProfile(SecurityProfile{Type: "Intermediate"}, false)
	if !settingsEqual(a, b) {
		t.Fatal("expected equal")
	}
	b.MinVersion = tls.VersionTLS13
	if settingsEqual(a, b) {
		t.Fatal("expected unequal after MinVersion change")
	}
}

func TestNodeParityMinVersions(t *testing.T) {
	t.Parallel()
	// Contract vs Node TLS_VERSION_MAP / BUILTIN_SPECS.
	if got := tlsVersion("VersionTLS10"); got != tls.VersionTLS10 {
		t.Fatalf("TLS10 0x%x", got)
	}
	if got := tlsVersion("VersionTLS11"); got != tls.VersionTLS11 {
		t.Fatalf("TLS11 0x%x", got)
	}
	if got := tlsVersion("VersionTLS12"); got != tls.VersionTLS12 {
		t.Fatalf("TLS12 0x%x", got)
	}
	if got := tlsVersion("VersionTLS13"); got != tls.VersionTLS13 {
		t.Fatalf("TLS13 0x%x", got)
	}
	if got := tlsVersion(""); got != tls.VersionTLS12 {
		t.Fatalf("empty 0x%x want TLS1.2", got)
	}
}
