// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http/httptest"
	"testing"
)

func TestNegotiateEncoding(t *testing.T) {
	cases := []struct {
		accept   string
		disabled bool
		want     string
	}{
		{accept: "gzip, deflate, br", want: "gzip"},
		{accept: "deflate, gzip", want: "gzip"},
		{accept: "deflate", want: "deflate"},
		{accept: "gzip", disabled: true, want: "identity"},
		{accept: "", want: "identity"},
		{accept: "gzip;q=0", want: "identity"},
		{accept: "gzip;q=0, deflate", want: "deflate"},
		{accept: "gzip;q=0.5, deflate;q=0.8", want: "deflate"},
		{accept: "deflate;q=0.2, gzip; q=0.8", want: "gzip"},
		{accept: "gzip;q=1, deflate;q=1", want: "gzip"},
		{accept: "gzip;q=0, *", want: "deflate"},
		{accept: "gzip;q=0, deflate;q=0, *", want: "identity"},
		{accept: "notgzip", want: "identity"},
		{accept: "gzip;q=abc", want: "identity"},
		{accept: "gzip;q=abc, deflate", want: "deflate"},
	}
	for _, tc := range cases {
		if got := negotiateEncoding(tc.accept, tc.disabled); got != tc.want {
			t.Fatalf("negotiateEncoding(%q, %v)=%q want %q", tc.accept, tc.disabled, got, tc.want)
		}
	}
}

func TestGzipFlushRoundTrip(t *testing.T) {
	rec := httptest.NewRecorder()
	enc := newStreamEncoder(rec, rec, "gzip")
	if _, err := enc.Write(FormatSSE("1", []byte(`{"type":"START"}`))); err != nil {
		t.Fatal(err)
	}
	if err := enc.Flush(); err != nil {
		t.Fatal(err)
	}
	enc.Close()
	r, err := gzip.NewReader(bytes.NewReader(rec.Body.Bytes()))
	if err != nil {
		t.Fatal(err)
	}
	plain, err := io.ReadAll(r)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Contains(plain, []byte(`{"type":"START"}`)) {
		t.Fatalf("%s", plain)
	}
}
