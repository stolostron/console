// Copyright Contributors to the Open Cluster Management project

package searchapi

import (
	"context"
	"fmt"
	"strings"
)

const (
	defaultSearchPort = "4010"
	graphqlPath       = "/searchapi/graphql"
	federatedPath     = "/federated"
	defaultNamespace  = "open-cluster-management"
)

// Discovery resolves the Search GraphQL HTTP(S) URL (user proxy and SA client).
type Discovery struct {
	SearchAPIURL string
	Federated    func() bool
	Namespace    string
	MCHNamespace func(context.Context) string
}

// Endpoint is SEARCH_API_URL or https://search-search-api.<ns>.svc.cluster.local:4010
// plus /searchapi/graphql, or /federated when globalSearchFeatureFlag is enabled.
func (d Discovery) Endpoint(ctx context.Context) string {
	base := strings.TrimRight(d.SearchAPIURL, "/")
	if base == "" {
		ns := ""
		if d.MCHNamespace != nil {
			ns = d.MCHNamespace(ctx)
		}
		if ns == "" {
			ns = d.Namespace
		}
		if ns == "" {
			ns = defaultNamespace
		}
		base = fmt.Sprintf("https://search-search-api.%s.svc.cluster.local:%s", ns, defaultSearchPort)
	}
	path := graphqlPath
	if d.Federated != nil && d.Federated() {
		path = federatedPath
	}
	return base + path
}
