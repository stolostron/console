// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"strings"
)

// OpenSSL / OpenShift cipher names → IANA ids. TLS 1.3 names are mapped but
// omitted from tls.Config.CipherSuites (Go does not allow configuring them).
var opensslCipherID = map[string]uint16{
	"TLS_AES_128_GCM_SHA256":        tls.TLS_AES_128_GCM_SHA256,
	"TLS_AES_256_GCM_SHA384":        tls.TLS_AES_256_GCM_SHA384,
	"TLS_CHACHA20_POLY1305_SHA256":  tls.TLS_CHACHA20_POLY1305_SHA256,
	"ECDHE-ECDSA-AES128-GCM-SHA256": tls.TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256,
	"ECDHE-RSA-AES128-GCM-SHA256":   tls.TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256,
	"ECDHE-ECDSA-AES256-GCM-SHA384": tls.TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384,
	"ECDHE-RSA-AES256-GCM-SHA384":   tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
	"ECDHE-ECDSA-CHACHA20-POLY1305": tls.TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256,
	"ECDHE-RSA-CHACHA20-POLY1305":   tls.TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256,
	"ECDHE-ECDSA-AES128-SHA256":     tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256,
	"ECDHE-RSA-AES128-SHA256":       tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256,
	"ECDHE-ECDSA-AES128-SHA":        tls.TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA,
	"ECDHE-RSA-AES128-SHA":          tls.TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA,
	"ECDHE-ECDSA-AES256-SHA":        tls.TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA,
	"ECDHE-RSA-AES256-SHA":          tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
	"AES128-GCM-SHA256":             tls.TLS_RSA_WITH_AES_128_GCM_SHA256,
	"AES256-GCM-SHA384":             tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
	"AES128-SHA256":                 tls.TLS_RSA_WITH_AES_128_CBC_SHA256,
	"AES128-SHA":                    tls.TLS_RSA_WITH_AES_128_CBC_SHA,
	"AES256-SHA":                    tls.TLS_RSA_WITH_AES_256_CBC_SHA,
	"DES-CBC3-SHA":                  tls.TLS_RSA_WITH_3DES_EDE_CBC_SHA,
}

var ianaCipherID = map[string]uint16{}

func init() {
	for _, s := range tls.CipherSuites() {
		ianaCipherID[s.Name] = s.ID
	}
	for _, s := range tls.InsecureCipherSuites() {
		ianaCipherID[s.Name] = s.ID
	}
}

func lookupCipher(name string) (uint16, bool) {
	if id, ok := opensslCipherID[name]; ok {
		return id, true
	}
	if id, ok := opensslCipherID[strings.ToUpper(name)]; ok {
		return id, true
	}
	if id, ok := ianaCipherID[name]; ok {
		return id, true
	}
	return 0, false
}

func isTLS13Cipher(id uint16) bool {
	switch id {
	case tls.TLS_AES_128_GCM_SHA256, tls.TLS_AES_256_GCM_SHA384, tls.TLS_CHACHA20_POLY1305_SHA256:
		return true
	default:
		return false
	}
}

// mapCiphers converts OpenShift/OpenSSL cipher names to TLS 1.2 ids. Unknown
// names and TLS 1.3 suites are skipped (parity with Node getCiphers() filter
// plus Go's inability to pin TLS 1.3 suites).
func mapCiphers(names []string) []uint16 {
	out := make([]uint16, 0, len(names))
	seen := make(map[uint16]struct{}, len(names))
	for _, name := range names {
		id, ok := lookupCipher(name)
		if !ok || isTLS13Cipher(id) {
			continue
		}
		if _, dup := seen[id]; dup {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}

var curveByName = map[string]tls.CurveID{
	"X25519":             tls.X25519,
	"secp256r1":          tls.CurveP256,
	"secp384r1":          tls.CurveP384,
	"secp521r1":          tls.CurveP521,
	"X25519MLKEM768":     tls.X25519MLKEM768,
	"SecP256r1MLKEM768":  tls.SecP256r1MLKEM768,
	"SecP384r1MLKEM1024": tls.SecP384r1MLKEM1024,
}

// Matches Node ALL_ECDH_CURVES / FIPS_ECDH_CURVES.
var (
	allECDHCurves  = []string{"X25519", "secp256r1", "secp384r1", "secp521r1", "X25519MLKEM768", "SecP256r1MLKEM768", "SecP384r1MLKEM1024"}
	fipsECDHCurves = []string{"secp256r1", "secp384r1", "secp521r1", "SecP256r1MLKEM768", "SecP384r1MLKEM1024"}
)

func allowedCurveSet(fips bool) map[string]struct{} {
	src := allECDHCurves
	if fips {
		src = fipsECDHCurves
	}
	set := make(map[string]struct{}, len(src))
	for _, n := range src {
		set[n] = struct{}{}
	}
	return set
}

func filterCurves(names []string, fips bool) []tls.CurveID {
	allowed := allowedCurveSet(fips)
	out := make([]tls.CurveID, 0, len(names))
	seen := make(map[tls.CurveID]struct{}, len(names))
	for _, name := range names {
		if _, ok := allowed[name]; !ok {
			continue
		}
		id, ok := curveByName[name]
		if !ok {
			continue
		}
		if _, dup := seen[id]; dup {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}
