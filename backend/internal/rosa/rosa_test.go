// Copyright Contributors to the Open Cluster Management project

package rosa

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
)

func authOK(_ http.ResponseWriter, _ *http.Request) (string, bool) {
	return "user-token", true
}

func b64(s string) string {
	return base64.StdEncoding.EncodeToString([]byte(s))
}

func testHandler(t *testing.T, api http.Handler) (*Handler, *httptest.Server) {
	t.Helper()
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"mock-ocm-token"}`))
	}))
	t.Cleanup(sso.Close)
	restore := auth.SetOCMTokenURL(sso.URL)
	t.Cleanup(restore)
	upstream := httptest.NewServer(api)
	t.Cleanup(upstream.Close)
	return New(Options{Authn: authOK, Client: http.DefaultClient, APIURL: upstream.URL}), upstream
}

func post(h http.Handler, path string, body any) *httptest.ResponseRecorder {
	raw, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(string(raw)))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestUnauthorized(t *testing.T) {
	h := New(Options{})
	rec := post(h, "/aws-account-ids", map[string]string{})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}
}

func TestAwsAccountIds(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer mock-ocm-token" {
			t.Errorf("auth %q", r.Header.Get("Authorization"))
		}
		switch r.URL.Path {
		case "/api/accounts_mgmt/v1/current_account":
			_, _ = w.Write([]byte(`{"id":"acct-1","organization":{"id":"org-abc"}}`))
		case "/api/accounts_mgmt/v1/organizations/org-abc/labels":
			_, _ = w.Write([]byte(`{"items":[{"id":"1"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	rec := post(h, "/aws-account-ids", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"items"`) {
		t.Fatalf("body %s", rec.Body.String())
	}
}

func TestClusterNameCheckInvalid(t *testing.T) {
	h, _ := testHandler(t, http.NotFoundHandler())
	rec := post(h, "/cluster-name-check", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"cluster_name":           "BAD",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
	if !strings.Contains(rec.Body.String(), "Invalid cluster name format") {
		t.Fatalf("body %s", rec.Body.String())
	}
}

func TestClusterNameCheckWrapsPost(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/api/clusters_mgmt/v1/clusters" {
			http.NotFound(w, r)
			return
		}
		if r.URL.RawQuery != "method=get" {
			t.Errorf("query %q", r.URL.RawQuery)
		}
		b, _ := io.ReadAll(r.Body)
		if !strings.Contains(string(b), "my-rosa-cluster") {
			t.Errorf("body %s", b)
		}
		_, _ = w.Write([]byte(`{"kind":"ClusterList","items":[]}`))
	}))
	rec := post(h, "/cluster-name-check", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"cluster_name":           "my-rosa-cluster",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	var out postResult
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out.StatusCode != 200 {
		t.Fatalf("%+v", out)
	}
}

func TestRegionsErrorObject(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "nope", http.StatusInternalServerError)
	}))
	// 500 with non-JSON body causes decode error → {error: ...}
	rec := post(h, "/regions", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	var out map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Fatalf("%v", out)
	}
}

func TestRouteCount(t *testing.T) {
	if len(Routes) != 11 {
		t.Fatalf("got %d routes", len(Routes))
	}
}

func TestOpenshiftVersionsQuery(t *testing.T) {
	var gotPath, gotQuery string
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		gotQuery = r.URL.RawQuery
		_, _ = w.Write([]byte(`{"items":[]}`))
	}))
	rec := post(h, "/openshift-versions", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	if gotPath != "/api/clusters_mgmt/v1/versions/" {
		t.Fatalf("path %q", gotPath)
	}
	if !strings.Contains(gotQuery, "product=hcp") || !strings.Contains(gotQuery, "rosa_enabled=") {
		t.Fatalf("query %q", gotQuery)
	}
}

func TestOIDCConfigsRejectsBadAccountID(t *testing.T) {
	called := false
	h, _ := testHandler(t, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		called = true
	}))
	rec := post(h, "/oidc-configs", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "a b&c",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	if called {
		t.Fatal("upstream should not be called")
	}
}

func TestOIDCConfigsAcceptsAccountID(t *testing.T) {
	var gotQuery string
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/clusters_mgmt/v1/oidc_configs" {
			gotQuery = r.URL.RawQuery
			_, _ = w.Write([]byte(`{"items":[]}`))
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/oidc-configs", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "123456789012",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	want := url.Values{"search": {"aws.account_id=123456789012 or aws.account_id=''"}}.Encode()
	if gotQuery != want {
		t.Fatalf("query %q want %q", gotQuery, want)
	}
}

func TestMulticloudPath(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	rec := post(h, "/multicloud/openshift-versions", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestAwsBillingAccounts(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/accounts_mgmt/v1/current_account":
			_, _ = w.Write([]byte(`{"id":"acct-1","organization":{"id":"org-abc"}}`))
		case "/api/accounts_mgmt/v1/organizations/org-abc/quota_cost":
			if !strings.Contains(r.URL.RawQuery, "fetchCloudAccounts=true") {
				t.Errorf("query %q", r.URL.RawQuery)
			}
			_, _ = w.Write([]byte(`{"items":[{"id":"bill-1"}]}`))
		default:
			http.NotFound(w, r)
		}
	}))
	rec := post(h, "/aws-billing-accounts", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestVpcs(t *testing.T) {
	var gotBody string
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/api/clusters_mgmt/v1/aws_inquiries/vpcs" {
			b, _ := io.ReadAll(r.Body)
			gotBody = string(b)
			_, _ = w.Write([]byte(`{"items":[]}`))
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/vpcs", map[string]interface{}{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws":                    map[string]string{"account_id": "123456789012"},
		"region":                 "us-east-1",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	if !strings.Contains(gotBody, "us-east-1") {
		t.Fatalf("body %s", gotBody)
	}
}

func TestStsRoleARNs(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/api/clusters_mgmt/v1/aws_inquiries/sts_account_roles" {
			_, _ = w.Write([]byte(`{"account_roles":[]}`))
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/sts-role-arns", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "123456789012",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestStsRoleARNsBadAccount(t *testing.T) {
	h, _ := testHandler(t, http.NotFoundHandler())
	rec := post(h, "/sts-role-arns", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "not-valid",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestStsOCMRole(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && r.URL.Path == "/api/clusters_mgmt/v1/aws_inquiries/sts_ocm_role" {
			_, _ = w.Write([]byte(`{"role_arn":"arn:aws:iam::123456789012:role/ocm"}`))
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/sts-ocm-role", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "123456789012",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestUserRole(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/accounts_mgmt/v1/current_account":
			_, _ = w.Write([]byte(`{"id":"acct-1","organization":{"id":"org-abc"}}`))
		case "/api/accounts_mgmt/v1/accounts/acct-1/labels/sts_user_role":
			_, _ = w.Write([]byte(`{"key":"sts_user_role","value":"arn"}`))
		default:
			http.NotFound(w, r)
		}
	}))
	rec := post(h, "/sts-user-role", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestMachineTypes(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost && strings.Contains(r.URL.Path, "machine_types") {
			_, _ = w.Write([]byte(`{"items":[{"id":"m5.xlarge"}]}`))
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/machine-types", map[string]interface{}{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"role_arn":               "arn:aws:iam::123456789012:role/node",
		"region":                 "us-east-1",
		"availability_zones":     []string{"us-east-1a"},
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestServeHTTP_NotPost(t *testing.T) {
	h := New(Options{Authn: authOK})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/regions", nil))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestServeHTTP_UnknownRoute(t *testing.T) {
	h := New(Options{Authn: authOK})
	rec := post(h, "/no-such-route", map[string]string{})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestInvalidPayloadReturns500(t *testing.T) {
	h := New(Options{Authn: authOK})
	req := httptest.NewRequest(http.MethodPost, "/regions", strings.NewReader(`{`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestAwsAccountIdsLabelsError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/accounts_mgmt/v1/current_account":
			_, _ = w.Write([]byte(`{"id":"acct-1","organization":{"id":"org-abc"}}`))
		case "/api/accounts_mgmt/v1/organizations/org-abc/labels":
			http.Error(w, "fail", http.StatusInternalServerError)
		default:
			http.NotFound(w, r)
		}
	}))
	rec := post(h, "/aws-account-ids", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK || rec.Body.String() != "null\n" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestClusterNameCheckUpstreamError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "fail", http.StatusBadGateway)
	}))
	rec := post(h, "/cluster-name-check", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"cluster_name":           "my-cluster",
	})
	if rec.Code != http.StatusOK || rec.Body.String() != "null\n" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestNewDefaultAPIURL(t *testing.T) {
	h := New(Options{RESTConfig: &rest.Config{Host: "https://example.com"}})
	if h.APIURL != "https://api.openshift.com" {
		t.Fatalf("APIURL %q", h.APIURL)
	}
	if h.Authn == nil {
		t.Fatal("expected default Authn")
	}
}

func TestRegionsSuccess(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/clusters_mgmt/v1/cloud_providers" {
			_, _ = w.Write([]byte(`{"items":[{"id":"aws"}]}`))
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/regions", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestSSOFailureReturns500(t *testing.T) {
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "denied", http.StatusUnauthorized)
	}))
	t.Cleanup(sso.Close)
	restore := auth.SetOCMTokenURL(sso.URL)
	t.Cleanup(restore)
	h := New(Options{Authn: authOK, Client: http.DefaultClient, APIURL: "http://example.com"})
	for _, path := range []string{"/regions", "/aws-billing-accounts", "/sts-user-role", "/machine-types"} {
		rec := post(h, path, map[string]string{
			"service_account_id":     b64("id"),
			"service_account_secret": b64("secret"),
		})
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("%s status %d", path, rec.Code)
		}
	}
}

func TestOrgFailureReturns500(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/accounts_mgmt/v1/current_account" {
			http.Error(w, "fail", http.StatusInternalServerError)
		}
	}))
	rec := post(h, "/aws-account-ids", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestAwsBillingAccountsQuotaError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/accounts_mgmt/v1/current_account":
			_, _ = w.Write([]byte(`{"id":"acct-1","organization":{"id":"org-abc"}}`))
		case "/api/accounts_mgmt/v1/organizations/org-abc/quota_cost":
			http.Error(w, "fail", http.StatusBadGateway)
		default:
			http.NotFound(w, r)
		}
	}))
	rec := post(h, "/aws-billing-accounts", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "null" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestMachineTypesWithoutZones(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "machine_types") {
			_, _ = w.Write([]byte(`{"items":[]}`))
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/machine-types", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"role_arn":               "arn:aws:iam::123456789012:role/node",
		"region":                 "us-east-1",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}

func TestMachineTypesUpstreamError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "machine_types") {
			http.Error(w, "nope", http.StatusBadGateway)
			return
		}
		http.NotFound(w, r)
	}))
	rec := post(h, "/machine-types", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"role_arn":               "arn:aws:iam::123456789012:role/node",
		"region":                 "us-east-1",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	var out map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Fatalf("%v", out)
	}
}

func TestStsRoleARNsPostError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/clusters_mgmt/v1/aws_inquiries/sts_account_roles" {
			http.Error(w, "fail", http.StatusBadGateway)
		}
	}))
	rec := post(h, "/sts-role-arns", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "123456789012",
	})
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "null" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestStsOCMRoleBadAccount(t *testing.T) {
	h, _ := testHandler(t, http.NotFoundHandler())
	rec := post(h, "/sts-ocm-role", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "bad",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestUserRoleUpstreamError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/api/accounts_mgmt/v1/current_account":
			_, _ = w.Write([]byte(`{"id":"acct-1","organization":{"id":"org-abc"}}`))
		case "/api/accounts_mgmt/v1/accounts/acct-1/labels/sts_user_role":
			http.Error(w, "fail", http.StatusBadGateway)
		default:
			http.NotFound(w, r)
		}
	}))
	rec := post(h, "/sts-user-role", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "null" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestVpcsInvalidJSON(t *testing.T) {
	h := New(Options{Authn: authOK})
	req := httptest.NewRequest(http.MethodPost, "/vpcs", strings.NewReader(`{`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestClusterNameCheckEmptyName(t *testing.T) {
	h, _ := testHandler(t, http.NotFoundHandler())
	rec := post(h, "/cluster-name-check", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"cluster_name":           "",
	})
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestStripPathRoot(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/clusters_mgmt/v1/cloud_providers" {
			_, _ = w.Write([]byte(`{"items":[]}`))
		}
	}))
	rec := post(h, "/multicloud", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestBillingAccountsInvalidJSON(t *testing.T) {
	h := New(Options{Authn: authOK})
	req := httptest.NewRequest(http.MethodPost, "/aws-billing-accounts", strings.NewReader(`{`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestOIDCConfigsInvalidJSON(t *testing.T) {
	h := New(Options{Authn: authOK})
	req := httptest.NewRequest(http.MethodPost, "/oidc-configs", strings.NewReader(`{`))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status %d", rec.Code)
	}
}

func TestStsOCMRolePostError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/clusters_mgmt/v1/aws_inquiries/sts_ocm_role" {
			http.Error(w, "fail", http.StatusBadGateway)
		}
	}))
	rec := post(h, "/sts-ocm-role", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "123456789012",
	})
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "null" {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestVersionsUpstreamError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/versions/") {
			http.Error(w, "fail", http.StatusBadGateway)
		}
	}))
	rec := post(h, "/openshift-versions", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	var out map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Fatalf("%v", out)
	}
}

func TestVpcsUpstreamError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "vpcs") {
			http.Error(w, "fail", http.StatusBadGateway)
		}
	}))
	rec := post(h, "/vpcs", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"region":                 "us-east-1",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	var out map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Fatalf("%v", out)
	}
}

func TestOIDCConfigsUpstreamError(t *testing.T) {
	h, _ := testHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/clusters_mgmt/v1/oidc_configs" {
			http.Error(w, "fail", http.StatusBadGateway)
		}
	}))
	rec := post(h, "/oidc-configs", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
		"aws_account_id":         "123456789012",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	var out map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out["error"] == "" {
		t.Fatalf("%v", out)
	}
}

func TestHandlerUsesDefaultClient(t *testing.T) {
	sso := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"access_token":"mock-ocm-token"}`))
	}))
	t.Cleanup(sso.Close)
	restore := auth.SetOCMTokenURL(sso.URL)
	t.Cleanup(restore)
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/clusters_mgmt/v1/cloud_providers" {
			_, _ = w.Write([]byte(`{"items":[]}`))
		}
	}))
	t.Cleanup(upstream.Close)
	h := New(Options{Authn: authOK, APIURL: upstream.URL})
	rec := post(h, "/regions", map[string]string{
		"service_account_id":     b64("id"),
		"service_account_secret": b64("secret"),
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
}
