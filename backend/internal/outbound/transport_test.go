// Copyright Contributors to the Open Cluster Management project

package outbound_test

import (
	"crypto/tls"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/stolostron/console/backend/internal/outbound"
)

func TestTransportNilConfigStaysNil(t *testing.T) {
	for _, forceHTTP2 := range []bool{false, true} {
		tr := outbound.Transport(nil, forceHTTP2)
		if tr.TLSClientConfig != nil {
			t.Fatalf("forceHTTP2=%v TLSClientConfig=%v want nil", forceHTTP2, tr.TLSClientConfig)
		}
		if tr.ForceAttemptHTTP2 != forceHTTP2 {
			t.Fatalf("forceHTTP2=%v ForceAttemptHTTP2=%v", forceHTTP2, tr.ForceAttemptHTTP2)
		}
	}
}

func TestClientTLSConfig(t *testing.T) {
	if outbound.ClientTLSConfig(nil, false) != nil || outbound.ClientTLSConfig(nil, true) != nil {
		t.Fatal("nil config should stay nil")
	}
	shared := &tls.Config{MinVersion: tls.VersionTLS12, NextProtos: []string{"h2", "http/1.1"}}
	h2 := outbound.ClientTLSConfig(shared, true)
	h1 := outbound.ClientTLSConfig(shared, false)
	if h2 == shared || h1 == shared {
		t.Fatal("ClientTLSConfig must clone")
	}
	if len(h2.NextProtos) != 2 || h2.NextProtos[0] != "h2" {
		t.Fatalf("forceHTTP2 NextProtos %v", h2.NextProtos)
	}
	if len(h1.NextProtos) != 1 || h1.NextProtos[0] != "http/1.1" {
		t.Fatalf("HTTP/1.1 NextProtos %v", h1.NextProtos)
	}
	if len(shared.NextProtos) != 2 || shared.NextProtos[0] != "h2" {
		t.Fatalf("shared NextProtos mutated: %v", shared.NextProtos)
	}
}

func TestSharedTLSConfigSurvivesHTTP2ThenHTTP1(t *testing.T) {
	t.Setenv("HTTP_PROXY", "")
	t.Setenv("HTTPS_PROXY", "")
	t.Setenv("http_proxy", "")
	t.Setenv("https_proxy", "")
	t.Setenv("NO_PROXY", "")

	var mu sync.Mutex
	var negotiated []string
	shared := &tls.Config{
		InsecureSkipVerify: true, //nolint:gosec // test server certificate
		VerifyConnection: func(cs tls.ConnectionState) error {
			mu.Lock()
			negotiated = append(negotiated, cs.NegotiatedProtocol)
			mu.Unlock()
			return nil
		},
	}

	srv := httptest.NewUnstartedServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	// Advertise both protocols. NewTLSServer defaults to HTTP/1.1 only, and
	// EnableHTTP2 alone advertises h2 with no HTTP/1.1 fallback.
	srv.EnableHTTP2 = true
	srv.TLS = &tls.Config{
		NextProtos: []string{"h2", "http/1.1"},
	}
	srv.StartTLS()
	t.Cleanup(srv.Close)

	h2 := outbound.Transport(shared, true)
	h1 := outbound.Transport(shared, false)
	if h2.TLSClientConfig == shared || h1.TLSClientConfig == shared {
		t.Fatal("transports must not retain the caller's tls.Config pointer")
	}
	if got := h1.TLSClientConfig.NextProtos; len(got) != 1 || got[0] != "http/1.1" {
		t.Fatalf("HTTP/1.1 NextProtos %v want [http/1.1]", got)
	}

	client := &http.Client{Timeout: 5 * time.Second}

	client.Transport = h2
	resp, err := client.Get(srv.URL)
	if err != nil {
		t.Fatalf("HTTP/2 GET: %v", err)
	}
	_, _ = io.Copy(io.Discard, resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("HTTP/2 status %d", resp.StatusCode)
	}
	if resp.Proto != "HTTP/2.0" {
		t.Fatalf("HTTP/2 response proto %q", resp.Proto)
	}
	if shared.NextProtos != nil {
		t.Fatalf("shared NextProtos mutated to %v", shared.NextProtos)
	}

	client.Transport = h1
	resp, err = client.Get(srv.URL)
	if err != nil {
		t.Fatalf("HTTP/1.1 GET: %v", err)
	}
	_, _ = io.Copy(io.Discard, resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("HTTP/1.1 status %d", resp.StatusCode)
	}
	if resp.Proto != "HTTP/1.1" {
		t.Fatalf("HTTP/1.1 response proto %q", resp.Proto)
	}
	if shared.NextProtos != nil {
		t.Fatalf("shared NextProtos mutated to %v", shared.NextProtos)
	}

	mu.Lock()
	got := append([]string(nil), negotiated...)
	mu.Unlock()
	if len(got) != 2 || got[0] != "h2" || got[1] != "http/1.1" {
		t.Fatalf("negotiated protocols %v want [h2 http/1.1]", got)
	}
}
