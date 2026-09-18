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
	if got := negotiateEncoding("gzip, deflate, br", false); got != "gzip" {
		t.Fatalf("gzip preferred, got %s", got)
	}
	if got := negotiateEncoding("deflate", false); got != "deflate" {
		t.Fatalf("got %s", got)
	}
	if got := negotiateEncoding("gzip", true); got != "identity" {
		t.Fatalf("disabled got %s", got)
	}
	if got := negotiateEncoding("", false); got != "identity" {
		t.Fatalf("empty got %s", got)
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
