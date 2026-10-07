// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/fips140"
	"crypto/tls"
	"slices"
)

// SecurityProfile is apiserver.spec.tlsSecurityProfile (config.openshift.io/v1).
type SecurityProfile struct {
	Type   string
	Custom *CustomSpec
}

// CustomSpec is spec.tlsSecurityProfile.custom.
type CustomSpec struct {
	MinTLSVersion string
	Ciphers       []string
	Groups        []string
}

// Settings is the Go tls.Config slice of a profile (Node toNodeTLSOptions).
type Settings struct {
	MinVersion   uint16
	MaxVersion   uint16
	CipherSuites []uint16
	Curves       []tls.CurveID
}

type builtinSpec struct {
	minTLSVersion string
	ciphers       []string
	groups        []string
}

// Built-in OpenShift profiles from oc explain apiserver.spec.tlsSecurityProfile
// (same lists as backend-node/src/lib/tlsProfileWatch.ts).
var builtin = map[string]builtinSpec{
	"Old": {
		minTLSVersion: "VersionTLS10",
		ciphers: []string{
			"TLS_AES_128_GCM_SHA256",
			"TLS_AES_256_GCM_SHA384",
			"TLS_CHACHA20_POLY1305_SHA256",
			"ECDHE-ECDSA-AES128-GCM-SHA256",
			"ECDHE-RSA-AES128-GCM-SHA256",
			"ECDHE-ECDSA-AES256-GCM-SHA384",
			"ECDHE-RSA-AES256-GCM-SHA384",
			"ECDHE-ECDSA-CHACHA20-POLY1305",
			"ECDHE-RSA-CHACHA20-POLY1305",
			"DHE-RSA-AES128-GCM-SHA256",
			"DHE-RSA-AES256-GCM-SHA384",
			"DHE-RSA-CHACHA20-POLY1305",
			"ECDHE-ECDSA-AES128-SHA256",
			"ECDHE-RSA-AES128-SHA256",
			"ECDHE-ECDSA-AES128-SHA",
			"ECDHE-RSA-AES128-SHA",
			"ECDHE-ECDSA-AES256-SHA384",
			"ECDHE-RSA-AES256-SHA384",
			"ECDHE-ECDSA-AES256-SHA",
			"ECDHE-RSA-AES256-SHA",
			"DHE-RSA-AES128-SHA256",
			"DHE-RSA-AES256-SHA256",
			"AES128-GCM-SHA256",
			"AES256-GCM-SHA384",
			"AES128-SHA256",
			"AES256-SHA256",
			"AES128-SHA",
			"AES256-SHA",
			"DES-CBC3-SHA",
		},
		groups: []string{"X25519MLKEM768", "X25519", "secp256r1", "secp384r1"},
	},
	"Intermediate": {
		minTLSVersion: "VersionTLS12",
		ciphers: []string{
			"TLS_AES_128_GCM_SHA256",
			"TLS_AES_256_GCM_SHA384",
			"TLS_CHACHA20_POLY1305_SHA256",
			"ECDHE-ECDSA-AES128-GCM-SHA256",
			"ECDHE-RSA-AES128-GCM-SHA256",
			"ECDHE-ECDSA-AES256-GCM-SHA384",
			"ECDHE-RSA-AES256-GCM-SHA384",
			"ECDHE-ECDSA-CHACHA20-POLY1305",
			"ECDHE-RSA-CHACHA20-POLY1305",
			"DHE-RSA-AES128-GCM-SHA256",
			"DHE-RSA-AES256-GCM-SHA384",
		},
		groups: []string{"X25519MLKEM768", "X25519", "secp256r1", "secp384r1"},
	},
	"Modern": {
		minTLSVersion: "VersionTLS13",
		ciphers:       []string{"TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256"},
		groups:        []string{"X25519MLKEM768", "X25519", "secp256r1", "secp384r1"},
	},
}

func tlsVersion(name string) uint16 {
	switch name {
	case "VersionTLS10":
		return tls.VersionTLS10
	case "VersionTLS11":
		return tls.VersionTLS11
	case "VersionTLS12":
		return tls.VersionTLS12
	case "VersionTLS13":
		return tls.VersionTLS13
	default:
		return tls.VersionTLS12
	}
}

// IntermediateSettings is the default before the APIServer watch returns and
// when the CR is missing (Node: spec?.type ?? 'Intermediate').
func IntermediateSettings() Settings {
	return FromProfile(SecurityProfile{Type: "Intermediate"})
}

// FromProfile maps an OpenShift TLS security profile to Go settings.
func FromProfile(p SecurityProfile) Settings {
	return fromProfile(p, fips140.Enabled())
}

func fromProfile(p SecurityProfile, fips bool) Settings {
	spec, minName := resolveSpec(p)
	min := tlsVersion(minName)
	ciphers := spec.ciphers
	// OpenShift: custom + TLS 1.3 cannot set custom ciphers; use Modern.
	if p.Type == "Custom" && min == tls.VersionTLS13 {
		ciphers = builtin["Modern"].ciphers
	}
	groups := spec.groups
	if len(groups) == 0 {
		groups = builtin["Intermediate"].groups
	}
	s := Settings{
		MinVersion:   min,
		CipherSuites: mapCiphers(ciphers),
		Curves:       filterCurves(groups, fips),
	}
	if min == tls.VersionTLS13 {
		s.MaxVersion = tls.VersionTLS13
	}
	return s
}

func resolveSpec(p SecurityProfile) (builtinSpec, string) {
	if p.Type == "Custom" && p.Custom != nil {
		minName := p.Custom.MinTLSVersion
		if minName == "" {
			minName = "VersionTLS12"
		}
		return builtinSpec{
			minTLSVersion: minName,
			ciphers:       p.Custom.Ciphers,
			groups:        p.Custom.Groups,
		}, minName
	}
	spec, ok := builtin[p.Type]
	if !ok {
		spec = builtin["Intermediate"]
	}
	return spec, spec.minTLSVersion
}

func (s Settings) clone() Settings {
	out := s
	out.CipherSuites = slices.Clone(s.CipherSuites)
	out.Curves = slices.Clone(s.Curves)
	return out
}

func settingsEqual(a, b Settings) bool {
	return a.MinVersion == b.MinVersion &&
		a.MaxVersion == b.MaxVersion &&
		slices.Equal(a.CipherSuites, b.CipherSuites) &&
		slices.Equal(a.Curves, b.Curves)
}
