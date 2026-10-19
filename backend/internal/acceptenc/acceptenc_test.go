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

func TestParse(t *testing.T) {
	cases := []struct {
		part  string
		name  string
		milli int
		ok    bool
	}{
		{part: "", ok: false},
		{part: "   ", ok: false},
		{part: "gzip", name: "gzip", milli: 1000, ok: true},
		{part: " GZIP ", name: "gzip", milli: 1000, ok: true},
		{part: "bad name", ok: false},
		{part: ";q=1", ok: false},
		{part: "gzip; charset=utf-8", name: "gzip", milli: 1000, ok: true},
		{part: "gzip;q", ok: false},
		{part: "gzip;q=abc", ok: false},
		{part: "gzip;q=0", name: "gzip", milli: 0, ok: true},
		{part: "gzip;q=1", name: "gzip", milli: 1000, ok: true},
		{part: "br; q=0.8 ; foo=bar", name: "br", milli: 800, ok: true},
		{part: "identity;;q=0.5", name: "identity", milli: 500, ok: true},
	}
	for _, tc := range cases {
		name, milli, ok := Parse(tc.part)
		if ok != tc.ok || (ok && (name != tc.name || milli != tc.milli)) {
			t.Fatalf("Parse(%q)=(%q,%d,%v) want (%q,%d,%v)", tc.part, name, milli, ok, tc.name, tc.milli, tc.ok)
		}
	}
}

func TestParseQMilliBasics(t *testing.T) {
	cases := []struct {
		raw   string
		milli int
		ok    bool
	}{
		{raw: "0", milli: 0, ok: true},
		{raw: "1", milli: 1000, ok: true},
		{raw: "0.a", ok: false},
		{raw: "2.0", ok: false},
		{raw: "0.1234", ok: false},
	}
	for _, tc := range cases {
		got, ok := parseQMilli(tc.raw)
		if ok != tc.ok || (ok && got != tc.milli) {
			t.Fatalf("parseQMilli(%q)=(%d,%v) want (%d,%v)", tc.raw, got, ok, tc.milli, tc.ok)
		}
	}
}
