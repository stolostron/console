// Copyright Contributors to the Open Cluster Management project

package auth

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

const defaultOCMTokenURL = "https://sso.redhat.com/auth/realms/redhat-external/protocol/openid-connect/token"

var ocmTokenURL = defaultOCMTokenURL

// SetOCMTokenURL overrides the Red Hat SSO token endpoint (tests).
func SetOCMTokenURL(raw string) func() {
	prev := ocmTokenURL
	ocmTokenURL = raw
	return func() { ocmTokenURL = prev }
}

// OCMServiceToken exchanges base64-encoded OCM client credentials for an SSO access token.
func OCMServiceToken(ctx context.Context, client *http.Client, clientID, clientSecret string) (string, error) {
	if client == nil {
		client = http.DefaultClient
	}
	id := base64DecodeASCII(clientID)
	secret := base64DecodeASCII(clientSecret)
	form := url.Values{
		"grant_type":    {"client_credentials"},
		"client_id":     {id},
		"client_secret": {secret},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ocmTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("token exchange failed (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	var tok struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(body, &tok); err != nil {
		return "", err
	}
	if tok.AccessToken == "" {
		return "", fmt.Errorf("token exchange failed (%d): missing access_token", resp.StatusCode)
	}
	return tok.AccessToken, nil
}

func base64DecodeASCII(value string) string {
	if value == "" {
		return ""
	}
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil {
		decoded, err = base64.RawStdEncoding.DecodeString(value)
		if err != nil {
			return value
		}
	}
	return string(decoded)
}
