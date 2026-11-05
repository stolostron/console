// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"slices"

	configv1 "github.com/openshift/api/config/v1"
	librarycrypto "github.com/openshift/library-go/pkg/crypto"

	applog "github.com/stolostron/console/backend/internal/log"
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

// Settings is the Go tls.Config slice of a profile.
type Settings struct {
	MinVersion   uint16
	MaxVersion   uint16
	CipherSuites []uint16
	Curves       []tls.CurveID
	// noUsableCurves is set when an explicit group list filters to nothing.
	// crypto/tls treats an empty CurvePreferences as its defaults, which would
	// allow groups the profile did not configure.
	noUsableCurves bool
	rejectedGroups []string
	unknownGroups  []string
	excludedGroups []string
}

// IntermediateSettings is the default before the APIServer watch returns and
// when the CR is missing (OpenShift defaults to Intermediate).
func IntermediateSettings() Settings {
	return FromProfile(SecurityProfile{Type: string(configv1.TLSProfileIntermediateType)})
}

// FromProfile maps an OpenShift TLS security profile to Go settings.
func FromProfile(p SecurityProfile) Settings {
	return fromProfile(p, librarycrypto.IsFIPSEnabled())
}

// fromProfile converts a security profile to Settings, applying FIPS group filtering.
func fromProfile(p SecurityProfile, fips bool) Settings {
	spec := resolveSpec(p)
	min := minTLSVersionOrDefault(string(spec.MinTLSVersion))
	ciphers := spec.Ciphers
	// OpenShift: custom + TLS 1.3 cannot set custom ciphers; use Modern.
	if p.Type == string(configv1.TLSProfileCustomType) && min == tls.VersionTLS13 {
		ciphers = configv1.TLSProfiles[configv1.TLSProfileModernType].Ciphers
	}
	candidate, err := groupsForProfile(spec, fips)
	s := Settings{
		MinVersion:     min,
		CipherSuites:   mapCiphers(ciphers),
		Curves:         candidate.Curves,
		excludedGroups: groupNames(candidate.Excluded),
	}
	s.unknownGroups = groupNames(candidate.Unknown)
	if err != nil {
		s.noUsableCurves = true
		s.rejectedGroups = groupNames(spec.Groups)
	}
	if min == tls.VersionTLS13 {
		s.MaxVersion = tls.VersionTLS13
	}
	return s
}

// resolveSpec selects the OpenShift API profile spec for a profile type:
// named profiles resolve from configv1.TLSProfiles, Custom uses its inline
// spec, and anything else falls back to Intermediate. The returned spec is
// shared for named profiles and must not be mutated.
func resolveSpec(p SecurityProfile) *configv1.TLSProfileSpec {
	if p.Type == string(configv1.TLSProfileCustomType) && p.Custom != nil {
		min := p.Custom.MinTLSVersion
		if min == "" {
			min = string(configv1.VersionTLS12)
		}
		return &configv1.TLSProfileSpec{
			MinTLSVersion: configv1.TLSProtocolVersion(min),
			Ciphers:       p.Custom.Ciphers,
			Groups:        toTLSGroups(p.Custom.Groups),
		}
	}
	spec, ok := configv1.TLSProfiles[configv1.TLSProfileType(p.Type)]
	if !ok || spec == nil {
		spec = configv1.TLSProfiles[configv1.TLSProfileIntermediateType]
	}
	return spec
}

// minTLSVersionOrDefault maps an OpenShift VersionTLS* name to a crypto/tls
// version via library-go, falling back to the OpenShift default (TLS 1.2) for
// unrecognized names instead of failing the profile.
func minTLSVersionOrDefault(name string) uint16 {
	version, err := librarycrypto.TLSVersion(name)
	if err != nil {
		applog.Logger().Warn("Unknown minTLSVersion in TLS security profile; using OpenShift default",
			"minTLSVersion", name)
		return librarycrypto.DefaultTLSVersion()
	}
	return version
}

// toTLSGroups converts group names to the OpenShift API TLSGroup type.
func toTLSGroups(names []string) []configv1.TLSGroup {
	groups := make([]configv1.TLSGroup, len(names))
	for i, name := range names {
		groups[i] = configv1.TLSGroup(name)
	}
	return groups
}

// groupNames converts OpenShift API groups back to plain names for logging.
func groupNames(groups []configv1.TLSGroup) []string {
	names := make([]string, len(groups))
	for i, group := range groups {
		names[i] = string(group)
	}
	return names
}

// clone returns a deep copy so callers can mutate slices without racing the reloader.
func (s Settings) clone() Settings {
	out := s
	out.CipherSuites = slices.Clone(s.CipherSuites)
	out.Curves = slices.Clone(s.Curves)
	out.rejectedGroups = slices.Clone(s.rejectedGroups)
	out.unknownGroups = slices.Clone(s.unknownGroups)
	out.excludedGroups = slices.Clone(s.excludedGroups)
	return out
}

// settingsEqual reports whether two Settings are identical for Apply short-circuiting.
func settingsEqual(a, b Settings) bool {
	return a.MinVersion == b.MinVersion &&
		a.MaxVersion == b.MaxVersion &&
		a.noUsableCurves == b.noUsableCurves &&
		slices.Equal(a.CipherSuites, b.CipherSuites) &&
		slices.Equal(a.Curves, b.Curves) &&
		slices.Equal(a.rejectedGroups, b.rejectedGroups) &&
		slices.Equal(a.unknownGroups, b.unknownGroups) &&
		slices.Equal(a.excludedGroups, b.excludedGroups)
}
