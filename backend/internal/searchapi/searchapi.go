// Copyright Contributors to the Open Cluster Management project

package searchapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	defaultSearchPort = "4010"
	graphqlPath       = "/searchapi/graphql"
	federatedPath     = "/federated"
	searchTimeout      = 2 * time.Minute
	pingTimeout        = 4 * time.Minute
)

// Query is the GraphQL search payload used by application aggregation.
type Query struct {
	OperationName string `json:"operationName"`
	Variables     struct {
		Input []Input `json:"input"`
	} `json:"variables"`
	Query string `json:"query"`
}

// Input is one Search API input block.
type Input struct {
	Filters      []Filter `json:"filters"`
	RelatedKinds []string  `json:"relatedKinds,omitempty"`
	Limit        int      `json:"limit"`
}

// Filter is a Search API property filter.
type Filter struct {
	Property string   `json:"property"`
	Values   []string `json:"values"`
}

// Related is a related-kind bucket from searchResult.
type Related struct {
	Kind  string           `json:"kind"`
	Count int              `json:"count,omitempty"`
	Items []map[string]any `json:"items,omitempty"`
}

// ResultBucket is one searchResult entry.
type ResultBucket struct {
	Items   []map[string]any `json:"items,omitempty"`
	Count   int              `json:"count,omitempty"`
	Related []Related        `json:"related,omitempty"`
}

// Response is the GraphQL envelope.
type Response struct {
	Data *struct {
		SearchResult []ResultBucket `json:"searchResult"`
	} `json:"data"`
	Message string `json:"message,omitempty"`
}

const searchQuery = "query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  related {\n    kind\n    items\n  }}\n}"

const pingQuery = "query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}"

// NewQuery returns the aggregator searchResult template.
func NewQuery() Query {
	q := Query{OperationName: "searchResult", Query: searchQuery}
	q.Variables.Input = []Input{}
	return q
}

// Client posts GraphQL search queries with the service-account token.
type Client struct {
	HTTP         *http.Client
	Token        string
	SearchAPIURL string
	Federated    func() bool
	Namespace    string
	MCHNamespace func(context.Context) string
}

// Endpoint is SEARCH_API_URL or the in-cluster search-search-api service.
func (c *Client) Endpoint(ctx context.Context) string {
	base := strings.TrimRight(c.SearchAPIURL, "/")
	if base == "" {
		ns := ""
		if c.MCHNamespace != nil {
			ns = c.MCHNamespace(ctx)
		}
		if ns == "" {
			ns = c.Namespace
		}
		if ns == "" {
			ns = "open-cluster-management"
		}
		base = fmt.Sprintf("https://search-search-api.%s.svc.cluster.local:%s", ns, defaultSearchPort)
	}
	path := graphqlPath
	if c.Federated != nil && c.Federated() {
		path = federatedPath
	}
	return base + path
}

func (c *Client) httpClient(timeout time.Duration) *http.Client {
	if c.HTTP != nil {
		cp := *c.HTTP
		cp.Timeout = timeout
		return &cp
	}
	return &http.Client{Timeout: timeout}
}

func (c *Client) post(ctx context.Context, timeout time.Duration, body any) (*Response, error) {
	raw, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.Endpoint(ctx), bytes.NewReader(raw))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient(timeout).Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var out Response
	if err := json.Unmarshal(data, &out); err != nil {
		return nil, fmt.Errorf("parse search response: %w", err)
	}
	return &out, nil
}

// Search runs the aggregator GraphQL query.
func (c *Client) Search(ctx context.Context, q Query) (*Response, error) {
	out, err := c.post(ctx, searchTimeout, q)
	if err != nil {
		return nil, err
	}
	if out.Message != "" {
		return nil, fmt.Errorf("%s", out.Message)
	}
	return out, nil
}

// Ping returns true when search-api answers with data.
func (c *Client) Ping(ctx context.Context) (bool, error) {
	body := map[string]any{
		"operationName": "searchResult",
		"variables": map[string]any{
			"input": []map[string]any{
				{
					"filters": []map[string]any{
						{"property": "kind", "values": []string{"Pod"}},
						{"property": "name", "values": []string{"search-api*"}},
					},
					"limit": 1,
				},
			},
		},
		"query": pingQuery,
	}
	out, err := c.post(ctx, pingTimeout, body)
	if err != nil {
		return false, err
	}
	if out.Data == nil {
		return false, fmt.Errorf("no data")
	}
	return true, nil
}

// LogSearchError logs a search client failure.
func LogSearchError(op string, err error) {
	if err == nil {
		return
	}
	applog.Logger().Error(op, "error", err)
}
