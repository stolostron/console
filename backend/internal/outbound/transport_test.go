// Copyright Contributors to the Open Cluster Management project

package outbound

import (
	"crypto/tls"
	"testing"
)

func TestTransport(t *testing.T) {
	tr := Transport(nil, false)
	if tr == nil {
		t.Fatal("expected transport")
	}
	if tr.DialContext == nil {
		t.Fatal("expected dialer")
	}
	if tr.ResponseHeaderTimeout != ResponseHeaderTimeout {
		t.Fatalf("header timeout %v", tr.ResponseHeaderTimeout)
	}
	if tr.ForceAttemptHTTP2 {
		t.Fatal("expected ForceAttemptHTTP2 false")
	}
	if tr.TLSClientConfig != nil {
		t.Fatal("expected nil TLS config")
	}

	cfg := &tls.Config{MinVersion: tls.VersionTLS12}
	tr2 := Transport(cfg, true)
	if tr2.TLSClientConfig != cfg {
		t.Fatal("expected TLS config passthrough")
	}
	if !tr2.ForceAttemptHTTP2 {
		t.Fatal("expected ForceAttemptHTTP2 true")
	}
}
