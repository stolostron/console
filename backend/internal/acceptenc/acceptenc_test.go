// Copyright Contributors to the Open Cluster Management project

package acceptenc

import "testing"

func TestParseQMilliTrailingDot(t *testing.T) {
	cases := []struct {
		raw   string
		milli int
		ok    bool
	}{
		{raw: "0.", milli: 0, ok: true},
		{raw: "1.", milli: 1000, ok: true},
		{raw: "0.5", milli: 500, ok: true},
		{raw: "1.0", milli: 1000, ok: true},
		{raw: "1.001", ok: false},
		{raw: ".5", ok: false},
	}
	for _, tc := range cases {
		got, ok := parseQMilli(tc.raw)
		if ok != tc.ok || (ok && got != tc.milli) {
			t.Fatalf("parseQMilli(%q)=(%d,%v) want (%d,%v)", tc.raw, got, ok, tc.milli, tc.ok)
		}
	}
}

func TestParseAcceptsTrailingDotQ(t *testing.T) {
	name, milli, ok := Parse("gzip;q=0.")
	if !ok || name != "gzip" || milli != 0 {
		t.Fatalf("Parse(gzip;q=0.)=(%q,%d,%v)", name, milli, ok)
	}
	name, milli, ok = Parse("deflate;q=1.")
	if !ok || name != "deflate" || milli != 1000 {
		t.Fatalf("Parse(deflate;q=1.)=(%q,%d,%v)", name, milli, ok)
	}
}
