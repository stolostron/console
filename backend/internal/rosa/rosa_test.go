// Copyright Contributors to the Open Cluster Management project

package rosa

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

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
