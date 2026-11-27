// Copyright Contributors to the Open Cluster Management project

//go:build !redhatopenssl || !linux

package tlsconfig

// redHatOpenSSLFIPSEnabled is only used for the Red Hat Go OpenSSL build on Linux.
func redHatOpenSSLFIPSEnabled() bool {
	return false
}
