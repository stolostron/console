// Copyright Contributors to the Open Cluster Management project

package oauth_test

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/oauth"
)

func TestDiscoveryURL(t *testing.T) {
	got, err := oauth.DiscoveryURL("https://api.example.com:6443", "")
	if err != nil {
		t.Fatal(err)
	}
	if got != "https://api.example.com:6443/.well-known/oauth-authorization-server" {
		t.Fatalf("got %q", got)
	}
	got, err = oauth.DiscoveryURL("https://api.example.com:6443/", "https://sso.example.com/auth/realms/foo")
	if err != nil {
		t.Fatal(err)
	}
	if got != "https://sso.example.com/auth/realms/foo/.well-known/openid-configuration" {
		t.Fatalf("oidc got %q", got)
	}
	if _, err := oauth.DiscoveryURL("", ""); err == nil {
		t.Fatal("expected error")
	}
}

func TestAccessTokenName(t *testing.T) {
	if got := oauth.AccessTokenName("plain-token"); got != "plain-token" {
		t.Fatalf("got %q", got)
	}
	raw := "abcdefghijklmnopqrstuvwxyz012345"
	token := "sha256~" + raw
	sum := sha256.Sum256([]byte(raw))
	want := "sha256~" + base64.RawURLEncoding.EncodeToString(sum[:])
	if got := oauth.AccessTokenName(token); got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestLoginRedirect_OpenShift(t *testing.T) {
	h := oauth.New(oauth.Options{
		ClientID:    "console-dev",
		RedirectURL: "https://localhost:3000/multicloud/login/callback",
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{
				AuthorizationEndpoint: "https://oauth.example.com/oauth/authorize",
				TokenEndpoint:         "https://oauth.example.com/oauth/token",
			}, nil
		},
	})
	rec := httptest.NewRecorder()
	h.Login(rec, httptest.NewRequest(http.MethodGet, "/login", nil))
	if rec.Code != http.StatusFound {
		t.Fatalf("status %d", rec.Code)
	}
	loc := rec.Header().Get("Location")
	u, err := url.Parse(loc)
	if err != nil {
		t.Fatal(err)
	}
	if u.Scheme+"://"+u.Host+u.Path != "https://oauth.example.com/oauth/authorize" {
		t.Fatalf("location host/path %q", loc)
	}
	q := u.Query()
	if q.Get("response_type") != "code" || q.Get("client_id") != "console-dev" {
		t.Fatalf("query %v", q)
	}
	if q.Get("redirect_uri") != "https://localhost:3000/multicloud/login/callback" {
		t.Fatalf("redirect_uri %q", q.Get("redirect_uri"))
	}
	if q.Get("scope") != "user:full" {
		t.Fatalf("scope %q", q.Get("scope"))
	}
	if _, ok := q["state"]; !ok {
		t.Fatal("expected empty state param")
	}
}

func TestLoginRedirect_OIDCScope(t *testing.T) {
	h := oauth.New(oauth.Options{
		ClientID:      "oidc-client",
		RedirectURL:   "https://localhost:3000/multicloud/login/callback",
		OIDCIssuerURL: "https://sso.example.com/auth/realms/foo",
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{
				AuthorizationEndpoint: "https://sso.example.com/auth",
				TokenEndpoint:         "https://sso.example.com/token",
			}, nil
		},
	})
	rec := httptest.NewRecorder()
	h.Login(rec, httptest.NewRequest(http.MethodGet, "/login", nil))
	if rec.Code != http.StatusFound {
		t.Fatalf("status %d", rec.Code)
	}
	u, _ := url.Parse(rec.Header().Get("Location"))
	if u.Query().Get("scope") != "openid" {
		t.Fatalf("scope %q", u.Query().Get("scope"))
	}
}

func TestCallback_SetsCookieAndRedirects(t *testing.T) {
	var posted url.Values
	idp := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/token" {
			http.NotFound(w, r)
			return
		}
		b, _ := io.ReadAll(r.Body)
		posted, _ = url.ParseQuery(string(b))
		if r.Header.Get("Content-Type") != "application/x-www-form-urlencoded" {
			t.Errorf("content-type %q", r.Header.Get("Content-Type"))
		}
		if r.Header.Get("Accept") != "application/json" {
			t.Errorf("accept %q", r.Header.Get("Accept"))
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"sha256~user-token","token_type":"Bearer"}`))
	}))
	defer idp.Close()

	h := oauth.New(oauth.Options{
		ClientID:     "cid",
		ClientSecret: "csecret",
		RedirectURL:  "https://localhost:3000/multicloud/login/callback",
		FrontendURL:  "https://localhost:3000",
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{AuthorizationEndpoint: idp.URL + "/auth", TokenEndpoint: idp.URL + "/token"}, nil
		},
	})
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/login/callback?code=the-code", nil)
	h.Callback(rec, req)
	if rec.Code != http.StatusFound {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.Bytes())
	}
	if rec.Header().Get("Location") != "https://localhost:3000" {
		t.Fatalf("location %q", rec.Header().Get("Location"))
	}
	cookie := rec.Header().Get("Set-Cookie")
	if !strings.HasPrefix(cookie, auth.AccessTokenCookie+"=sha256~user-token;") {
		t.Fatalf("cookie %q", cookie)
	}
	if strings.Contains(cookie, "Secure") {
		t.Fatalf("dev cookie must not be Secure: %q", cookie)
	}
	if !strings.Contains(cookie, "HttpOnly") || !strings.Contains(cookie, "Path=/") {
		t.Fatalf("cookie attrs %q", cookie)
	}
	if strings.Contains(strings.ToLower(cookie), "samesite") {
		t.Fatalf("Node does not set SameSite: %q", cookie)
	}
	if posted.Get("grant_type") != "authorization_code" || posted.Get("code") != "the-code" {
		t.Fatalf("form %v", posted)
	}
	if posted.Get("client_id") != "cid" || posted.Get("client_secret") != "csecret" {
		t.Fatalf("client fields %v", posted)
	}
}

func TestCallback_ProductionSecureCookieAndIDToken(t *testing.T) {
	idp := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"not-this","id_token":"header.payload.sig","token_type":"Bearer"}`))
	}))
	defer idp.Close()
	h := oauth.New(oauth.Options{
		ClientID:      "cid",
		ClientSecret:  "sec",
		RedirectURL:   "https://localhost:3000/multicloud/login/callback",
		FrontendURL:   "https://localhost:3000",
		OIDCIssuerURL: "https://sso.example.com",
		Production:    true,
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{AuthorizationEndpoint: idp.URL + "/a", TokenEndpoint: idp.URL + "/t"}, nil
		},
	})
	rec := httptest.NewRecorder()
	h.Callback(rec, httptest.NewRequest(http.MethodGet, "/login/callback?code=x", nil))
	if rec.Code != http.StatusFound {
		t.Fatalf("status %d", rec.Code)
	}
	cookie := rec.Header().Get("Set-Cookie")
	if !strings.Contains(cookie, auth.AccessTokenCookie+"=header.payload.sig;") {
		t.Fatalf("cookie %q", cookie)
	}
	if !strings.Contains(cookie, " Secure;") {
		t.Fatalf("production cookie must be Secure: %q", cookie)
	}
}

func TestCallback_Errors(t *testing.T) {
	h := oauth.New(oauth.Options{
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{AuthorizationEndpoint: "https://x/a", TokenEndpoint: "https://x/t"}, nil
		},
	})
	rec := httptest.NewRecorder()
	h.Callback(rec, httptest.NewRequest(http.MethodGet, "/login/callback", nil))
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("no query status %d", rec.Code)
	}

	idp := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"token_type":"Bearer"}`))
	}))
	defer idp.Close()
	h = oauth.New(oauth.Options{
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{AuthorizationEndpoint: idp.URL, TokenEndpoint: idp.URL}, nil
		},
	})
	rec = httptest.NewRecorder()
	h.Callback(rec, httptest.NewRequest(http.MethodGet, "/login/callback?code=z", nil))
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("missing token status %d", rec.Code)
	}
}

func TestRefresh_UsesRefreshTokenGrant(t *testing.T) {
	var posted url.Values
	idp := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		b, _ := io.ReadAll(r.Body)
		posted, _ = url.ParseQuery(string(b))
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"rotated","token_type":"Bearer","expires_in":3600}`))
	}))
	defer idp.Close()
	h := oauth.New(oauth.Options{
		ClientID:     "cid",
		ClientSecret: "sec",
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{AuthorizationEndpoint: idp.URL + "/a", TokenEndpoint: idp.URL + "/t"}, nil
		},
	})
	tok, err := h.Refresh(context.Background(), "rt-1")
	if err != nil {
		t.Fatal(err)
	}
	if tok.AccessToken != "rotated" {
		t.Fatalf("access %q", tok.AccessToken)
	}
	if posted.Get("grant_type") != "refresh_token" || posted.Get("refresh_token") != "rt-1" {
		t.Fatalf("form %v", posted)
	}
}

func TestLogout_RevokesAndClearsCookies(t *testing.T) {
	raw := "abcdefghijklmnopqrstuvwxyz012345"
	bearer := "sha256~" + raw
	wantName := oauth.AccessTokenName(bearer)
	client := oauthAccessTokenClient(oauthAccessTokenObject(wantName))

	h := oauth.New(oauth.Options{
		UserDynamic: func(string) (dynamic.Interface, error) { return client, nil },
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{AuthorizationEndpoint: "https://x/a", TokenEndpoint: "https://x/t"}, nil
		},
	})
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/logout", nil)
	req.Host = "localhost:4000"
	req.AddCookie(&http.Cookie{Name: auth.AccessTokenCookie, Value: bearer})
	h.Logout(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	_, err := client.Resource(oauthAccessTokenGVR).Get(context.Background(), wantName, metav1.GetOptions{})
	if !apierrors.IsNotFound(err) {
		t.Fatalf("expected token deleted, got %v", err)
	}
	cookies := rec.Header().Values("Set-Cookie")
	joined := strings.Join(cookies, "\n")
	for _, name := range []string{"connect.sid", auth.AccessTokenCookie, "_oauth_proxy"} {
		if !strings.Contains(joined, name+"=") {
			t.Fatalf("missing delete cookie %s in %v", name, cookies)
		}
	}
	if !strings.Contains(joined, "Domain=.localhost:4000") {
		t.Fatalf("oauth_proxy domain %v", cookies)
	}
	if !strings.Contains(joined, "max-age=0") {
		t.Fatalf("expected max-age=0 %v", cookies)
	}
}

func TestLogout_UnauthorizedWithoutToken(t *testing.T) {
	h := oauth.New(oauth.Options{})
	rec := httptest.NewRecorder()
	h.Logout(rec, httptest.NewRequest(http.MethodGet, "/logout", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.Bytes())
	}
}

func TestDiscover_FromWellKnown(t *testing.T) {
	api := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/.well-known/oauth-authorization-server" {
			http.NotFound(w, r)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]string{
			"authorization_endpoint": "https://oauth.example.com/auth",
			"token_endpoint":         "https://oauth.example.com/token",
		})
	}))
	defer api.Close()
	h := oauth.New(oauth.Options{ClusterAPIURL: api.URL})
	rec := httptest.NewRecorder()
	h.Login(rec, httptest.NewRequest(http.MethodGet, "/login", nil))
	if rec.Code != http.StatusFound {
		t.Fatalf("status %d", rec.Code)
	}
	if !strings.Contains(rec.Header().Get("Location"), "https://oauth.example.com/auth") {
		t.Fatalf("location %q", rec.Header().Get("Location"))
	}
}

func TestConfigure_TokenEndpoint(t *testing.T) {
	h := oauth.New(oauth.Options{
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{
				TokenEndpoint: "https://oauth-openshift.apps.example.com/oauth/token",
			}, nil
		},
	})
	rec := httptest.NewRecorder()
	h.Configure(rec, httptest.NewRequest(http.MethodGet, "/configure", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Header().Get("Content-Type") != "application/json" {
		t.Fatalf("content-type %q", rec.Header().Get("Content-Type"))
	}
	var body struct {
		TokenEndpoint string `json:"token_endpoint"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.TokenEndpoint != "https://oauth-openshift.apps.example.com/oauth/token" {
		t.Fatalf("token_endpoint %q", body.TokenEndpoint)
	}
}

func TestConfigure_DiscoveryErrorEmptyEndpoint(t *testing.T) {
	h := oauth.New(oauth.Options{
		Discover: func(context.Context) (oauth.Info, error) {
			return oauth.Info{}, fmt.Errorf("oauth-authorization-server error")
		},
	})
	rec := httptest.NewRecorder()
	h.Configure(rec, httptest.NewRequest(http.MethodGet, "/configure", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.String() != `{"token_endpoint":""}` {
		t.Fatalf("body %s", rec.Body.Bytes())
	}
}
