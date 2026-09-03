// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"strings"
	"testing"
)

func TestFormatSSE(t *testing.T) {
	got := string(FormatSSE("7", []byte(`{"type":"START"}`)))
	want := "id:7\ndata:{\"type\":\"START\"}\n\n"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
	if strings.Contains(got, "id: ") || strings.Contains(got, "data: ") {
		t.Fatal("Node /events has no space after id:/data:")
	}
}

func TestPingFrame(t *testing.T) {
	if string(pingFrame()) != ":\n\n" {
		t.Fatalf("%q", pingFrame())
	}
}
