// Copyright Contributors to the Open Cluster Management project

package oauth

import (
	"crypto/sha256"
	"encoding/base64"
	"strings"
)

const sha256Prefix = "sha256~"

// AccessTokenName is the OpenShift OAuthAccessToken object name for a bearer token.
func AccessTokenName(token string) string {
	if !strings.HasPrefix(token, sha256Prefix) {
		return token
	}
	sum := sha256.Sum256([]byte(token[len(sha256Prefix):]))
	return sha256Prefix + base64.RawURLEncoding.EncodeToString(sum[:])
}
