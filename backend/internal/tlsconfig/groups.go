// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"errors"
	"slices"

	configv1 "github.com/openshift/api/config/v1"
	librarycrypto "github.com/openshift/library-go/pkg/crypto"
)

var errNoUsableTLSGroups = errors.New("TLS profile has no usable groups")

// groupCandidate separates conversion from the decision to publish a profile.
// Unknown names and FIPS exclusions remain visible to the caller. A successful
// conversion with unknown names does not decide whether to accept that subset.
type groupCandidate struct {
	Curves   []tls.CurveID
	Unknown  []configv1.TLSGroup
	Excluded []configv1.TLSGroup
}

// groupsForProfile resolves unset groups to the Intermediate default before
// conversion and FIPS filtering. Callers must handle diagnostics and errors
// before publishing: an empty tls.Config.CurvePreferences would select Go
// defaults, widening policy.
func groupsForProfile(spec *configv1.TLSProfileSpec, fips bool) (groupCandidate, error) {
	groups := spec.Groups
	if len(groups) == 0 {
		groups = configv1.TLSProfiles[configv1.TLSProfileIntermediateType].Groups
	}
	candidate := groupCandidate{}
	// Diagnose unknown names against the administrator's full list; FIPS
	// filtering below must not hide them.
	curves, unknown := librarycrypto.TLSGroupsToCurveIDs(groups)
	candidate.Unknown = unknown
	if fips {
		// library-go keeps only FIPS-approved groups (the NIST curves).
		// Report recognized groups it dropped; unknown names stay in Unknown.
		approved := librarycrypto.FIPSApprovedTLSGroups(groups)
		for _, group := range groups {
			if _, recognized := librarycrypto.TLSGroupToCurveID(group); recognized && !slices.Contains(approved, group) {
				candidate.Excluded = append(candidate.Excluded, group)
			}
		}
		curves, _ = librarycrypto.TLSGroupsToCurveIDs(approved)
	}
	for _, curve := range curves {
		if !slices.Contains(candidate.Curves, curve) {
			candidate.Curves = append(candidate.Curves, curve)
		}
	}
	if len(candidate.Curves) == 0 {
		return candidate, errNoUsableTLSGroups
	}
	return candidate, nil
}
