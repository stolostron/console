// Copyright Contributors to the Open Cluster Management project

//go:build redhatopenssl && linux

package tlsconfig

import (
	"os"
	"strings"
)

// redHatOpenSSLFIPSEnabled reports the switches that activate FIPS in the
// Red Hat OpenSSL backend. strictfipsruntime validates that the backend is
// available when FIPS is requested.
func redHatOpenSSLFIPSEnabled() bool {
	if _, forced := os.LookupEnv("OPENSSL_FORCE_FIPS_MODE"); forced {
		return true
	}
	data, err := os.ReadFile("/proc/sys/crypto/fips_enabled")
	return err == nil && strings.TrimSpace(string(data)) == "1"
}
