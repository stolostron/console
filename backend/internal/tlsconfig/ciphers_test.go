// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"slices"
	"testing"
)

func TestLookupCipherOpenSSLAndIANA(t *testing.T) {
	t.Parallel()
	if id, ok := lookupCipher("ECDHE-RSA-AES128-GCM-SHA256"); !ok || id != tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 {
		t.Fatalf("openssl name id=0x%x ok=%v", id, ok)
	}
	if id, ok := lookupCipher("ecdhe-rsa-aes128-gcm-sha256"); !ok || id != tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 {
		t.Fatalf("lowercase openssl id=0x%x ok=%v", id, ok)
	}
	if id, ok := lookupCipher("TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"); !ok || id != tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256 {
		t.Fatalf("iana name id=0x%x ok=%v", id, ok)
	}
	if _, ok := lookupCipher("NOT-A-CIPHER"); ok {
		t.Fatal("unknown cipher should not resolve")
	}
}

func TestMapCiphersSkipsTLS13AndUnknown(t *testing.T) {
	t.Parallel()
	got := mapCiphers([]string{
		"TLS_AES_128_GCM_SHA256",
		"ECDHE-RSA-AES128-GCM-SHA256",
		"NOT-A-CIPHER",
		"DHE-RSA-AES128-GCM-SHA256",
		"ECDHE-RSA-AES128-GCM-SHA256",
	})
	want := []uint16{tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256}
	if !slices.Equal(got, want) {
		t.Fatalf("mapCiphers %v want %v", got, want)
	}
}

func TestMapCiphersOldProfileIncludesLegacyRSA(t *testing.T) {
	t.Parallel()
	got := mapCiphers(builtin["Old"].ciphers)
	if len(got) == 0 {
		t.Fatal("Old profile should map at least one TLS 1.2 cipher")
	}
	foundRSA := false
	for _, id := range got {
		if id == tls.TLS_RSA_WITH_AES_128_GCM_SHA256 {
			foundRSA = true
			break
		}
	}
	if !foundRSA {
		t.Fatalf("Old profile ciphers %v missing RSA GCM", got)
	}
}

func TestFilterCurvesNonFIPS(t *testing.T) {
	t.Parallel()
	got := filterCurves([]string{"X25519MLKEM768", "X25519", "secp256r1", "bogus"}, false)
	want := []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256}
	if !slices.Equal(got, want) {
		t.Fatalf("curves %v want %v", got, want)
	}
}

func TestFilterCurvesFIPSExcludesX25519(t *testing.T) {
	t.Parallel()
	got := filterCurves([]string{"X25519MLKEM768", "X25519", "secp521r1"}, true)
	want := []tls.CurveID{tls.CurveP521}
	if !slices.Equal(got, want) {
		t.Fatalf("FIPS curves %v want %v", got, want)
	}
}

func TestFilterCurvesDeduplicates(t *testing.T) {
	t.Parallel()
	got := filterCurves([]string{"secp256r1", "secp256r1"}, false)
	if len(got) != 1 || got[0] != tls.CurveP256 {
		t.Fatalf("dedup curves %v", got)
	}
}

func TestIsTLS13Cipher(t *testing.T) {
	t.Parallel()
	if !isTLS13Cipher(tls.TLS_AES_128_GCM_SHA256) {
		t.Fatal("TLS 1.3 cipher not detected")
	}
	if isTLS13Cipher(tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256) {
		t.Fatal("TLS 1.2 cipher misclassified")
	}
}
