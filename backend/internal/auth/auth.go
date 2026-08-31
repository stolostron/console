// Copyright Contributors to the Open Cluster Management project

package auth

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	authv1 "k8s.io/api/authentication/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/config"
)

const (
	AccessTokenCookie = "acm-access-token-cookie"

	bearerSchemePrefix    = "Bearer " // RFC 6750 Authorization header scheme prefix
	bearerSchemePrefixLen = len(bearerSchemePrefix)
)

var serviceAccountBaseDir = "/var/run/secrets/kubernetes.io/serviceaccount"

// SetServiceAccountDir overrides the SA mount path (tests).
func SetServiceAccountDir(dir string) func() {
	prev := serviceAccountBaseDir
	serviceAccountBaseDir = dir
	return func() { serviceAccountBaseDir = prev }
}

// ServiceAccount holds the in-cluster (or env-fallback) credentials.
type ServiceAccount struct {
	Token  string
	CACert []byte
}

// LoadServiceAccount reads the projected SA files, falling back to TOKEN / CA_CERT.
// If no token is available, ok is false (callers that require a token should exit).
func LoadServiceAccount(cfg *config.Config) (ServiceAccount, bool) {
	token := readFileOrDefault(filepath.Join(serviceAccountBaseDir, "token"), cfg.Token)
	caPath := filepath.Join(serviceAccountBaseDir, "ca.crt")
	ca, err := os.ReadFile(caPath)
	if err != nil {
		if cfg.CACert != "" {
			decoded, decErr := base64.StdEncoding.DecodeString(cfg.CACert)
			if decErr == nil {
				ca = decoded
			}
		}
	}
	if strings.TrimSpace(token) == "" {
		return ServiceAccount{}, false
	}
	return ServiceAccount{Token: token, CACert: ca}, true
}

func readFileOrDefault(path, fallback string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return fallback
	}
	return string(data)
}

// TokenFromRequest returns the user token: cookie first, then Bearer.
func TokenFromRequest(r *http.Request) string {
	if r == nil {
		return ""
	}
	if c, err := r.Cookie(AccessTokenCookie); err == nil && c.Value != "" {
		return c.Value
	}
	authz := r.Header.Get("Authorization")
	if len(authz) > bearerSchemePrefixLen && strings.EqualFold(authz[:bearerSchemePrefixLen], bearerSchemePrefix) {
		return strings.TrimSpace(authz[bearerSchemePrefixLen:])
	}
	return ""
}

// TokenReviewer validates a bearer token against the hub API.
type TokenReviewer interface {
	Review(ctx context.Context, token string) (bool, error)
}

type kubeReviewer struct {
	client kubernetes.Interface
}

// RESTConfig builds a client-go rest.Config from the service account.
func RESTConfig(cfg *config.Config, sa ServiceAccount) (*rest.Config, error) {
	if cfg.ClusterAPIURL == "" {
		return nil, errors.New("CLUSTER_API_URL is not set")
	}
	restCfg := &rest.Config{
		Host:        cfg.ClusterAPIURL,
		BearerToken: sa.Token,
		TLSClientConfig: rest.TLSClientConfig{
			CAData: sa.CACert,
		},
	}
	if len(sa.CACert) == 0 {
		restCfg.TLSClientConfig.Insecure = true
	}
	return restCfg, nil
}

// UserRESTConfig copies base and impersonates the user via Bearer token.
func UserRESTConfig(base *rest.Config, userToken string) *rest.Config {
	c := rest.CopyConfig(base)
	c.BearerToken = userToken
	c.BearerTokenFile = ""
	return c
}

// ValidateUserToken checks the token the same way the Node sidecar does: GET /api.
// TokenReview is not used here because console-mce can create TokenReviews for some
// identities that still fail Review, while GET /api matches /events auth.
func ValidateUserToken(ctx context.Context, base *rest.Config, token string) error {
	if base == nil {
		return errors.New("rest config is required")
	}
	cfg := UserRESTConfig(base, token)
	httpClient, err := rest.HTTPClientFor(cfg)
	if err != nil {
		return err
	}
	host := strings.TrimRight(cfg.Host, "/")
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, host+"/api", nil)
	if err != nil {
		return err
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("token validation status %d", resp.StatusCode)
	}
	return nil
}

// NewTokenReviewer builds a TokenReview client using the service account.
func NewTokenReviewer(cfg *config.Config, sa ServiceAccount) (TokenReviewer, error) {
	restCfg, err := RESTConfig(cfg, sa)
	if err != nil {
		return nil, err
	}
	client, err := kubernetes.NewForConfig(restCfg)
	if err != nil {
		return nil, err
	}
	return &kubeReviewer{client: client}, nil
}

func (k *kubeReviewer) Review(ctx context.Context, token string) (bool, error) {
	tr, err := k.client.AuthenticationV1().TokenReviews().Create(ctx, &authv1.TokenReview{
		Spec: authv1.TokenReviewSpec{Token: token},
	}, metav1.CreateOptions{})
	if err != nil {
		return false, err
	}
	return tr.Status.Authenticated, nil
}
