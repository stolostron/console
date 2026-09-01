// Copyright Contributors to the Open Cluster Management project

package auth

import (
	"crypto/tls"
	"crypto/x509"
	"os"
)

// TLSConfigFromCA builds a TLS config from a PEM CA bundle.
// When includeSystemRoots is true, the system pool is used as well (Node non-production service agent).
func TLSConfigFromCA(caCert []byte, includeSystemRoots bool) *tls.Config {
	tlsCfg := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}
	var pool *x509.CertPool
	if includeSystemRoots {
		system, err := x509.SystemCertPool()
		if err != nil {
			pool = x509.NewCertPool()
		} else {
			pool = system
		}
	} else {
		pool = x509.NewCertPool()
	}
	if len(caCert) > 0 {
		pool.AppendCertsFromPEM(caCert)
	} else if !includeSystemRoots {
		tlsCfg.InsecureSkipVerify = true //nolint:gosec // matches RESTConfig when CA missing
	}
	tlsCfg.RootCAs = pool
	return tlsCfg
}

// ServiceTLSConfig trusts SERVICE_CA_CERT / service-ca.crt. Local development also trusts system roots
// so OpenShift Routes verify, matching Node getServiceAgent().
func ServiceTLSConfig(sa ServiceAccount) *tls.Config {
	return TLSConfigFromCA(sa.ServiceCACert, os.Getenv("NODE_ENV") != "production")
}
