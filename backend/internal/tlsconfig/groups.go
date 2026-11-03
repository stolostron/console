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
	Excluded []tls.CurveID
}

// groupsForProfile resolves Node-compatible defaults before conversion and FIPS
// filtering. Callers must handle diagnostics and errors before publishing: an
// empty tls.Config.CurvePreferences would select Go defaults, widening policy.
func groupsForProfile(p SecurityProfile, fips bool) (groupCandidate, error) {
	spec, _ := resolveSpec(p)
	names := spec.groups
	if len(names) == 0 {
		names = builtin["Intermediate"].groups
	}
	groups := make([]configv1.TLSGroup, len(names))
	for i, name := range names {
		groups[i] = configv1.TLSGroup(name)
	}

	curves, unknown := librarycrypto.TLSGroupsToCurveIDs(groups)
	candidate := groupCandidate{Unknown: unknown}
	for _, curve := range curves {
		if fips && !fipsPermitsCurve(curve) {
			if !slices.Contains(candidate.Excluded, curve) {
				candidate.Excluded = append(candidate.Excluded, curve)
			}
			continue
		}
		if !slices.Contains(candidate.Curves, curve) {
			candidate.Curves = append(candidate.Curves, curve)
		}
	}
	if len(candidate.Curves) == 0 {
		return candidate, errNoUsableTLSGroups
	}
	return candidate, nil
}

// fipsPermitsCurve preserves the Node policy allowlist. This is a policy check;
// conversion alone does not establish runtime support or FIPS approval.
func fipsPermitsCurve(curve tls.CurveID) bool {
	switch curve {
	case tls.CurveP256, tls.CurveP384, tls.CurveP521, tls.SecP256r1MLKEM768, tls.SecP384r1MLKEM1024:
		return true
	default:
		return false
	}
}
