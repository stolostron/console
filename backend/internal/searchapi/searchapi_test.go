// Copyright Contributors to the Open Cluster Management project

package searchapi_test

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/httpx"
	"github.com/stolostron/console/backend/internal/searchapi"
)

func TestEndpointDefaultAndFederated(t *testing.T) {
	c := &searchapi.Client{Namespace: "acm"}
	got := c.Endpoint(context.Background())
	want := "https://search-search-api.acm.svc.cluster.local:4010/searchapi/graphql"
	if got != want {
		t.Fatalf("endpoint %q", got)
	}
	c.Federated = func() bool { return true }
	got = c.Endpoint(context.Background())
	if !contains(got, "/federated") {
		t.Fatalf("federated %q", got)
	}
	c.SearchAPIURL = "https://search.example:4010"
	c.Federated = func() bool { return false }
	got = c.Endpoint(context.Background())
	if got != "https://search.example:4010/searchapi/graphql" {
		t.Fatalf("override %q", got)
	}
}

func TestDiscoveryMCHNamespaceAndDefault(t *testing.T) {
	d := searchapi.Discovery{
		MCHNamespace: func(context.Context) string { return "ocm" },
	}
	got := d.Endpoint(context.Background())
	if got != "https://search-search-api.ocm.svc.cluster.local:4010/searchapi/graphql" {
		t.Fatalf("mch %q", got)
	}
	d.MCHNamespace = func(context.Context) string { return "" }
	got = d.Endpoint(context.Background())
	if got != "https://search-search-api.open-cluster-management.svc.cluster.local:4010/searchapi/graphql" {
		t.Fatalf("default ns %q", got)
	}
}

func TestSearchAndPing(t *testing.T) {
	var lastPath string
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		lastPath = r.URL.Path
		body, _ := io.ReadAll(r.Body)
		var payload map[string]any
		_ = json.Unmarshal(body, &payload)
		w.Header().Set(httpx.HeaderContentType, httpx.MIMEJSON)
		if q, _ := payload["query"].(string); q == searchapi.NewQuery().Query {
			_, _ = w.Write([]byte(`{"data":{"searchResult":[{"items":[{"name":"a"}],"related":[]}]}}`))
			return
		}
		_, _ = w.Write([]byte(`{"data":{"searchResult":[]}}`))
	}))
	defer ts.Close()

	c := &searchapi.Client{HTTP: ts.Client(), SearchAPIURL: ts.URL, Token: "tok"}
	q := searchapi.NewQuery()
	q.Variables.Input = append(q.Variables.Input, searchapi.Input{
		Filters: []searchapi.Filter{{Property: "kind", Values: []string{"Application"}}},
		Limit:   10,
	})
	resp, err := c.Search(context.Background(), q)
	if err != nil {
		t.Fatal(err)
	}
	if resp.Data == nil || len(resp.Data.SearchResult) != 1 {
		t.Fatalf("result %+v", resp)
	}
	ok, err := c.Ping(context.Background())
	if err != nil || !ok {
		t.Fatalf("ping %v %v", ok, err)
	}
	if lastPath == "" {
		t.Fatal("no request")
	}
}

func TestSearchMessageError(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"message":"boom"}`))
	}))
	defer ts.Close()
	c := &searchapi.Client{HTTP: ts.Client(), SearchAPIURL: ts.URL}
	_, err := c.Search(context.Background(), searchapi.NewQuery())
	if err == nil || err.Error() != "boom" {
		t.Fatalf("err %v", err)
	}
}

func TestClientDiscovery(t *testing.T) {
	c := &searchapi.Client{
		SearchAPIURL: "https://search.example",
		Namespace:    "ns",
		Federated:    func() bool { return true },
	}
	d := c.Discovery()
	if d.SearchAPIURL != c.SearchAPIURL || d.Namespace != "ns" {
		t.Fatalf("discovery %+v", d)
	}
}

func TestSearchUsesDefaultHTTPClient(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"data":{"searchResult":[]}}`))
	}))
	defer ts.Close()
	c := &searchapi.Client{SearchAPIURL: ts.URL, Token: "tok"}
	if _, err := c.Search(context.Background(), searchapi.NewQuery()); err != nil {
		t.Fatal(err)
	}
}

func TestPostInvalidJSONResponse(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`not-json`))
	}))
	defer ts.Close()
	c := &searchapi.Client{HTTP: ts.Client(), SearchAPIURL: ts.URL}
	_, err := c.Search(context.Background(), searchapi.NewQuery())
	if err == nil || !strings.Contains(err.Error(), "parse search response") {
		t.Fatalf("err %v", err)
	}
}

func TestPingNoData(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"data":null}`))
	}))
	defer ts.Close()
	c := &searchapi.Client{HTTP: ts.Client(), SearchAPIURL: ts.URL}
	ok, err := c.Ping(context.Background())
	if err == nil || ok {
		t.Fatalf("ok=%v err=%v", ok, err)
	}
}

func TestLogSearchError(t *testing.T) {
	searchapi.LogSearchError("op", nil)
	searchapi.LogSearchError("op", fmt.Errorf("boom"))
}

func TestSearchNon2xx(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(`{"data":{"searchResult":[{"items":[{"name":"a"}]}]}}`))
	}))
	defer ts.Close()
	c := &searchapi.Client{HTTP: ts.Client(), SearchAPIURL: ts.URL}
	_, err := c.Search(context.Background(), searchapi.NewQuery())
	if err == nil || err.Error() != "upstream returned status 500" {
		t.Fatalf("err %v", err)
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 || (len(s) > 0 && (func() bool {
		for i := 0; i+len(sub) <= len(s); i++ {
			if s[i:i+len(sub)] == sub {
				return true
			}
		}
		return false
	}())))
}
