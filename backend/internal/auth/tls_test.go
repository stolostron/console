// Copyright Contributors to the Open Cluster Management project

package auth_test

import (
	"crypto/tls"
	"testing"

	"github.com/stolostron/console/backend/internal/auth"
)

func TestTLSConfigFromCA_NoCAInsecureWithoutSystemRoots(t *testing.T) {
	cfg := auth.TLSConfigFromCA(nil, false)
	if !cfg.InsecureSkipVerify {
		t.Fatal("expected InsecureSkipVerify without CA or system roots")
	}
	if cfg.MinVersion != tls.VersionTLS12 {
		t.Fatalf("MinVersion=%#x", cfg.MinVersion)
	}
	if cfg.RootCAs == nil {
		t.Fatal("expected non-nil cert pool")
	}
}

func TestTLSConfigFromCA_WithCADoesNotSkipVerify(t *testing.T) {
	// Invalid PEM still counts as "CA provided" and must not enable skip-verify.
	cfg := auth.TLSConfigFromCA([]byte("not-a-pem-bundle"), false)
	if cfg.InsecureSkipVerify {
		t.Fatal("expected verify when CA bytes are present")
	}
}

func TestTLSConfigFromCA_SystemRootsWithoutExplicitCA(t *testing.T) {
	cfg := auth.TLSConfigFromCA(nil, true)
	if cfg.InsecureSkipVerify {
		t.Fatal("expected system roots instead of skip-verify")
	}
	if cfg.RootCAs == nil {
		t.Fatal("expected cert pool with system roots")
	}
}

func TestServiceTLSConfig_DevelopmentUsesSystemRoots(t *testing.T) {
	t.Setenv("NODE_ENV", "development")
	cfg := auth.ServiceTLSConfig(auth.ServiceAccount{})
	if cfg.InsecureSkipVerify {
		t.Fatal("development should trust system roots when service CA is empty")
	}
}

func TestServiceTLSConfig_ProductionWithoutCAInsecure(t *testing.T) {
	t.Setenv("NODE_ENV", "production")
	cfg := auth.ServiceTLSConfig(auth.ServiceAccount{})
	if !cfg.InsecureSkipVerify {
		t.Fatal("production without service CA should skip verify")
	}
}

func TestServiceTLSConfig_ProductionWithServiceCA(t *testing.T) {
	t.Setenv("NODE_ENV", "production")
	cfg := auth.ServiceTLSConfig(auth.ServiceAccount{ServiceCACert: []byte("service-ca-pem")})
	if cfg.InsecureSkipVerify {
		t.Fatal("production with service CA should verify")
	}
}
