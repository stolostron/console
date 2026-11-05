// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"slices"
	"testing"

	configv1 "github.com/openshift/api/config/v1"
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
	got := mapCiphers(configv1.TLSProfiles[configv1.TLSProfileOldType].Ciphers)
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

func TestIsTLS13Cipher(t *testing.T) {
	t.Parallel()
	if !isTLS13Cipher(tls.TLS_AES_128_GCM_SHA256) {
		t.Fatal("TLS 1.3 cipher not detected")
	}
	if isTLS13Cipher(tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256) {
		t.Fatal("TLS 1.2 cipher misclassified")
	}
}
