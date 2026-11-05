// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import (
	"crypto/tls"
	"errors"
	"slices"
	"testing"

	configv1 "github.com/openshift/api/config/v1"
)

func TestGroupsForProfileDefaults(t *testing.T) {
	t.Parallel()
	profiles := []struct {
		name    string
		profile SecurityProfile
	}{
		{"absent profile", SecurityProfile{}},
		{"Old", SecurityProfile{Type: "Old"}},
		{"Intermediate", SecurityProfile{Type: "Intermediate"}},
		{"Modern", SecurityProfile{Type: "Modern"}},
		{"unknown profile", SecurityProfile{Type: "unknown"}},
		{"absent Custom payload", SecurityProfile{Type: "Custom"}},
		{"nil Custom groups", SecurityProfile{Type: "Custom", Custom: &CustomSpec{}}},
		{"empty Custom groups", SecurityProfile{Type: "Custom", Custom: &CustomSpec{Groups: []string{}}}},
	}
	for _, profile := range profiles {
		for _, fips := range []bool{false, true} {
			mode := "non-FIPS"
			want := []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256, tls.CurveP384}
			var excluded []configv1.TLSGroup
			if fips {
				mode = "FIPS"
				want = []tls.CurveID{tls.CurveP256, tls.CurveP384}
				excluded = []configv1.TLSGroup{"X25519MLKEM768", "X25519"}
			}
			t.Run(profile.name+"/"+mode, func(t *testing.T) {
				t.Parallel()
				got, err := groupsForProfile(resolveSpec(profile.profile), fips)
				if err != nil {
					t.Fatal(err)
				}
				if !slices.Equal(got.Curves, want) || !slices.Equal(got.Excluded, excluded) || len(got.Unknown) != 0 {
					t.Fatalf("got %+v; want curves %v, excluded %v, no unknowns", got, want, excluded)
				}
			})
		}
	}
}

func TestGroupsForProfileExplicit(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name     string
		groups   []string
		fips     bool
		curves   []tls.CurveID
		unknown  []configv1.TLSGroup
		excluded []configv1.TLSGroup
		wantErr  bool
	}{
		{
			name:   "explicit subset does not receive defaults",
			groups: []string{"secp384r1"},
			curves: []tls.CurveID{tls.CurveP384},
		},
		{
			name: "all supported names",
			groups: []string{
				"X25519", "secp256r1", "secp384r1", "secp521r1",
				"X25519MLKEM768", "SecP256r1MLKEM768", "SecP384r1MLKEM1024",
			},
			curves: []tls.CurveID{
				tls.X25519, tls.CurveP256, tls.CurveP384, tls.CurveP521,
				tls.X25519MLKEM768, tls.SecP256r1MLKEM768, tls.SecP384r1MLKEM1024,
			},
		},
		{
			// library-go's FIPS allowlist keeps only the NIST curves; the
			// ML-KEM hybrids are excluded alongside X25519.
			name: "FIPS policy keeps only NIST curves",
			groups: []string{
				"X25519", "secp256r1", "secp384r1", "secp521r1",
				"X25519MLKEM768", "SecP256r1MLKEM768", "SecP384r1MLKEM1024",
			},
			fips:   true,
			curves: []tls.CurveID{tls.CurveP256, tls.CurveP384, tls.CurveP521},
			excluded: []configv1.TLSGroup{
				"X25519", "X25519MLKEM768", "SecP256r1MLKEM768", "SecP384r1MLKEM1024",
			},
		},
		{
			name:    "unknown names remain visible alongside recognized IDs",
			groups:  []string{"future-group", "secp256r1", "not-a-group", "secp384r1"},
			curves:  []tls.CurveID{tls.CurveP256, tls.CurveP384},
			unknown: []configv1.TLSGroup{"future-group", "not-a-group"},
		},
		{
			name:     "FIPS preserves unknown diagnostics before filtering",
			groups:   []string{"X25519", "future-group", "secp384r1"},
			fips:     true,
			curves:   []tls.CurveID{tls.CurveP384},
			unknown:  []configv1.TLSGroup{"future-group"},
			excluded: []configv1.TLSGroup{"X25519"},
		},
		{
			name:    "all unknown does not receive unset fallback",
			groups:  []string{"future-group", "not-a-group"},
			unknown: []configv1.TLSGroup{"future-group", "not-a-group"},
			wantErr: true,
		},
		{
			name:     "all excluded does not receive unset fallback",
			groups:   []string{"X25519MLKEM768", "X25519"},
			fips:     true,
			excluded: []configv1.TLSGroup{"X25519MLKEM768", "X25519"},
			wantErr:  true,
		},
		{
			name:     "unknown and excluded is still unusable",
			groups:   []string{"future-group", "X25519"},
			fips:     true,
			unknown:  []configv1.TLSGroup{"future-group"},
			excluded: []configv1.TLSGroup{"X25519"},
			wantErr:  true,
		},
		{
			name:   "duplicate synthetic input retains a single ID",
			groups: []string{"secp384r1", "secp256r1", "secp384r1"},
			curves: []tls.CurveID{tls.CurveP384, tls.CurveP256},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			profile := SecurityProfile{Type: "Custom", Custom: &CustomSpec{Groups: tc.groups}}
			got, err := groupsForProfile(resolveSpec(profile), tc.fips)
			if tc.wantErr {
				if !errors.Is(err, errNoUsableTLSGroups) {
					t.Fatalf("error %v; want %v", err, errNoUsableTLSGroups)
				}
			} else if err != nil {
				t.Fatal(err)
			}
			if !slices.Equal(got.Curves, tc.curves) || !slices.Equal(got.Unknown, tc.unknown) || !slices.Equal(got.Excluded, tc.excluded) {
				t.Fatalf("got %+v; want curves %v, unknown %v, excluded %v", got, tc.curves, tc.unknown, tc.excluded)
			}
		})
	}
}

func TestGroupsForProfileOwnsSlices(t *testing.T) {
	t.Parallel()
	input := []string{"secp256r1", "future-group", "X25519"}
	profile := SecurityProfile{Type: "Custom", Custom: &CustomSpec{Groups: input}}
	first, err := groupsForProfile(resolveSpec(profile), true)
	if err != nil {
		t.Fatal(err)
	}
	second, err := groupsForProfile(resolveSpec(profile), true)
	if err != nil {
		t.Fatal(err)
	}
	first.Curves[0] = tls.CurveP521
	first.Unknown[0] = "changed"
	first.Excluded[0] = "changed"
	if !slices.Equal(input, []string{"secp256r1", "future-group", "X25519"}) {
		t.Fatalf("conversion mutated caller input: %v", input)
	}
	input[0], input[1], input[2] = "secp384r1", "changed", "secp521r1"
	if !slices.Equal(second.Curves, []tls.CurveID{tls.CurveP256}) ||
		!slices.Equal(second.Unknown, []configv1.TLSGroup{"future-group"}) ||
		!slices.Equal(second.Excluded, []configv1.TLSGroup{"X25519"}) {
		t.Fatalf("candidate changed through another owner: %+v", second)
	}
}

func TestGroupsForProfileDoesNotMutateDefaults(t *testing.T) {
	t.Parallel()
	first, err := groupsForProfile(resolveSpec(SecurityProfile{}), false)
	if err != nil {
		t.Fatal(err)
	}
	first.Curves[0] = tls.CurveP521
	second, err := groupsForProfile(resolveSpec(SecurityProfile{}), false)
	if err != nil {
		t.Fatal(err)
	}
	want := []tls.CurveID{tls.X25519MLKEM768, tls.X25519, tls.CurveP256, tls.CurveP384}
	if !slices.Equal(second.Curves, want) {
		t.Fatalf("default curves %v; want %v", second.Curves, want)
	}
}
