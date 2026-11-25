// Copyright Contributors to the Open Cluster Management project

package tlsconfig

import librarycrypto "github.com/openshift/library-go/pkg/crypto"

// FIPSModeStatus reports the Go-native and Red Hat OpenSSL FIPS signals.
type FIPSModeStatus struct {
	Enabled                bool
	NativeGo               bool
	RedHatOpenSSLRequested bool
}

// CurrentFIPSMode combines Go's native FIPS state with the system FIPS signal
// used by the Red Hat Go 1.26 OpenSSL backend.
func CurrentFIPSMode() FIPSModeStatus {
	nativeGo := librarycrypto.IsFIPSEnabled()
	redHatOpenSSL := redHatOpenSSLFIPSEnabled()
	return FIPSModeStatus{
		Enabled:                nativeGo || redHatOpenSSL,
		NativeGo:               nativeGo,
		RedHatOpenSSLRequested: redHatOpenSSL,
	}
}

// IsFIPSEnabled reports whether TLS settings should apply the FIPS group policy.
func IsFIPSEnabled() bool {
	return CurrentFIPSMode().Enabled
}
