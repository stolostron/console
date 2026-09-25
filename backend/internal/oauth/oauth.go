// Copyright Contributors to the Open Cluster Management project

package oauth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"golang.org/x/oauth2"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	connectSIDCookie = "connect.sid"
	oauthProxyCookie = "_oauth_proxy"
)

// Info is the OAuth/OIDC discovery subset used by login and token exchange.
type Info struct {
	AuthorizationEndpoint string `json:"authorization_endpoint"`
	TokenEndpoint         string `json:"token_endpoint"`
}

// Options configure the standalone OAuth/OIDC login handlers.
type Options struct {
	ClientID      string
	ClientSecret  string
	RedirectURL   string
	FrontendURL   string
	ClusterAPIURL string
	OIDCIssuerURL string
	Production    bool
	Client        *http.Client
	RESTConfig    *rest.Config
	// UserDynamic is used with RESTConfig for per-user hub API calls (tests).
	UserDynamic   func(bearer string) (dynamic.Interface, error)
	Discover      func(ctx context.Context) (Info, error)
	Revoke        func(ctx context.Context, bearer, tokenName string) error
}

// Handler serves GET /configure, /login, /login/callback, and /logout.
type Handler struct {
	clientID      string
	clientSecret  string
	redirectURL   string
	frontendURL   string
	clusterAPIURL string
	oidcIssuerURL string
	production    bool
	client        *http.Client
	restConfig    *rest.Config
	userDynamic   func(bearer string) (dynamic.Interface, error)
	discover      func(ctx context.Context) (Info, error)
	revoke        func(ctx context.Context, bearer, tokenName string) error

	mu   sync.Mutex
	info Info
	ok   bool
}

// New builds an OAuth handler. Client should trust the hub CA (auth.HTTPClient).
func New(opts Options) *Handler {
	c := opts.Client
	if c == nil {
		c = http.DefaultClient
	}
	h := &Handler{
		clientID:      opts.ClientID,
		clientSecret:  opts.ClientSecret,
		redirectURL:   opts.RedirectURL,
		frontendURL:   opts.FrontendURL,
		clusterAPIURL: strings.TrimRight(opts.ClusterAPIURL, "/"),
		oidcIssuerURL: strings.TrimRight(opts.OIDCIssuerURL, "/"),
		production:    opts.Production,
		client:        withAcceptJSON(c),
		restConfig:    opts.RESTConfig,
		userDynamic:   opts.UserDynamic,
		discover:      opts.Discover,
		revoke:        opts.Revoke,
	}
	if h.discover == nil {
		h.discover = h.discoverDefault
	}
	if h.revoke == nil {
		h.revoke = h.revokeDefault
	}
	return h
}

type acceptJSON struct {
	base http.RoundTripper
}

func (t acceptJSON) RoundTrip(req *http.Request) (*http.Response, error) {
	r := req.Clone(req.Context())
	if r.Header.Get("Accept") == "" {
		r.Header.Set("Accept", "application/json")
	}
	base := t.base
	if base == nil {
		base = http.DefaultTransport
	}
	return base.RoundTrip(r)
}

func withAcceptJSON(c *http.Client) *http.Client {
	cp := *c
	cp.Transport = acceptJSON{base: c.Transport}
	return &cp
}

func (h *Handler) oauth2Config(info Info) *oauth2.Config {
	scopes := []string{"user:full"}
	if h.oidcIssuerURL != "" {
		scopes = []string{"openid"}
	}
	return &oauth2.Config{
		ClientID:     h.clientID,
		ClientSecret: h.clientSecret,
		RedirectURL:  h.redirectURL,
		Scopes:       scopes,
		Endpoint: oauth2.Endpoint{
			AuthURL:   info.AuthorizationEndpoint,
			TokenURL:  info.TokenEndpoint,
			AuthStyle: oauth2.AuthStyleInParams,
		},
	}
}

func (h *Handler) endpoints(ctx context.Context) (Info, error) {
	info, err := h.discoverCached(ctx)
	if err != nil {
		return Info{}, err
	}
	if info.AuthorizationEndpoint == "" {
		return Info{}, fmt.Errorf("oauth discovery missing authorization_endpoint")
	}
	return info, nil
}

// discoverCached is the Go equivalent of Node getOauthInfoPromise(): one well-known
// fetch, then reuse. Failures are not cached so a later request can retry.
func (h *Handler) discoverCached(ctx context.Context) (Info, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.ok {
		return h.info, nil
	}
	info, err := h.discover(ctx)
	if err != nil {
		return Info{}, err
	}
	h.info = info
	h.ok = true
	return info, nil
}

func (h *Handler) discoverDefault(ctx context.Context) (Info, error) {
	raw, err := DiscoveryURL(h.clusterAPIURL, h.oidcIssuerURL)
	if err != nil {
		return Info{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, raw, nil)
	if err != nil {
		return Info{}, err
	}
	resp, err := h.client.Do(req)
	if err != nil {
		return Info{}, err
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	if resp.StatusCode != http.StatusOK {
		return Info{}, fmt.Errorf("oauth discovery status %d", resp.StatusCode)
	}
	var info Info
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return Info{}, err
	}
	return info, nil
}

// DiscoveryURL is the well-known document Node uses (OIDC vs OpenShift OAuth).
func DiscoveryURL(clusterAPIURL, oidcIssuerURL string) (string, error) {
	base := oidcIssuerURL
	doc := ".well-known/oauth-authorization-server"
	if oidcIssuerURL != "" {
		doc = ".well-known/openid-configuration"
	} else {
		base = clusterAPIURL
	}
	if strings.TrimSpace(base) == "" {
		return "", fmt.Errorf("missing OIDC_ISSUER_URL or CLUSTER_API_URL for OAuth discovery")
	}
	if !strings.HasSuffix(base, "/") {
		base += "/"
	}
	u, err := url.Parse(base)
	if err != nil {
		return "", err
	}
	ref, err := url.Parse(doc)
	if err != nil {
		return "", err
	}
	return u.ResolveReference(ref).String(), nil
}

// Configure is GET /configure: { token_endpoint } for frontend logout and Display Token.
func (h *Handler) Configure(w http.ResponseWriter, r *http.Request) {
	token := ""
	info, err := h.discoverCached(r.Context())
	if err != nil {
		applog.Logger().Error("oauth configure discovery", "error", err)
	} else {
		token = info.TokenEndpoint
	}
	w.Header().Set("Content-Type", "application/json")
	body, err := json.Marshal(struct {
		TokenEndpoint string `json:"token_endpoint"`
	}{TokenEndpoint: token})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}

// Login redirects to the IdP authorization endpoint.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	info, err := h.endpoints(r.Context())
	if err != nil {
		applog.Logger().Error("oauth login discovery", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	loc := h.oauth2Config(info).AuthCodeURL("", oauth2.SetAuthURLParam("state", ""))
	http.Redirect(w, r, loc, http.StatusFound)
}

// Callback exchanges the authorization code and sets acm-access-token-cookie.
func (h *Handler) Callback(w http.ResponseWriter, r *http.Request) {
	if r.URL.RawQuery == "" {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	code := r.URL.Query().Get("code")
	info, err := h.endpoints(r.Context())
	if err != nil {
		applog.Logger().Error("oauth callback discovery", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	token, err := h.exchange(r.Context(), info, code)
	if err != nil || token == "" {
		applog.Logger().Error("oauth token exchange", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Set-Cookie", accessCookie(token, h.production))
	w.Header().Set("Location", h.frontendURL)
	w.WriteHeader(http.StatusFound)
}

func accessCookie(token string, production bool) string {
	secure := ""
	if production {
		secure = " Secure;"
	}
	return auth.AccessTokenCookie + "=" + token + ";" + secure + " HttpOnly; Path=/"
}

func (h *Handler) exchange(ctx context.Context, info Info, code string) (string, error) {
	ctx = context.WithValue(ctx, oauth2.HTTPClient, h.client)
	tok, err := h.oauth2Config(info).Exchange(ctx, code)
	if err != nil {
		return "", err
	}
	if h.oidcIssuerURL != "" {
		if id, ok := tok.Extra("id_token").(string); ok && id != "" {
			return id, nil
		}
		return "", fmt.Errorf("missing id_token")
	}
	if tok.AccessToken == "" {
		return "", fmt.Errorf("missing access_token")
	}
	return tok.AccessToken, nil
}

// Refresh exchanges a refresh_token before access-token expiry (golang.org/x/oauth2 TokenSource).
func (h *Handler) Refresh(ctx context.Context, refreshToken string) (*oauth2.Token, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return nil, fmt.Errorf("refresh_token is required")
	}
	info, err := h.endpoints(ctx)
	if err != nil {
		return nil, err
	}
	ctx = context.WithValue(ctx, oauth2.HTTPClient, h.client)
	src := h.oauth2Config(info).TokenSource(ctx, &oauth2.Token{RefreshToken: refreshToken})
	return src.Token()
}

// Logout revokes the OpenShift OAuth access token and clears session cookies.
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	token := auth.TokenFromRequest(r)
	if token == "" {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if err := h.revoke(r.Context(), token, AccessTokenName(token)); err != nil {
		applog.Logger().Error("oauth logout revoke", "error", err)
		// Still clear cookies so OIDC / already-revoked tokens can sign out locally.
	}
	clearSessionCookies(w, r.Host)
	w.WriteHeader(http.StatusOK)
}

func clearSessionCookies(w http.ResponseWriter, host string) {
	deleteCookie(w, connectSIDCookie, "")
	deleteCookie(w, auth.AccessTokenCookie, "")
	deleteCookie(w, oauthProxyCookie, "."+host)
}

func deleteCookie(w http.ResponseWriter, name, domain string) {
	s := name + "=; Secure; HttpOnly; Path=/; max-age=0"
	if domain != "" {
		s += "; Domain=" + domain
	}
	w.Header().Add("Set-Cookie", s)
}

func (h *Handler) userDynamicClient(bearer string) (dynamic.Interface, error) {
	if h.userDynamic != nil {
		return h.userDynamic(bearer)
	}
	if h.restConfig == nil {
		return nil, fmt.Errorf("kubernetes rest config is required")
	}
	return dynamic.NewForConfig(auth.UserRESTConfig(h.restConfig, bearer))
}

func (h *Handler) revokeDefault(ctx context.Context, bearer, tokenName string) error {
	dc, err := h.userDynamicClient(bearer)
	if err != nil {
		return err
	}
	return RevokeOAuthAccessToken(ctx, dc, tokenName)
}
