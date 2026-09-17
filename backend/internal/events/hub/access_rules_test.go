// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"testing"

	authzv1 "k8s.io/api/authorization/v1"
)

func TestEvaluateKindGetAccess(t *testing.T) {
	empty := subjectRulesStatus{}
	secretRule := authzv1.ResourceRule{Verbs: []string{"get"}, APIGroups: []string{""}, Resources: []string{"secrets"}}
	named := authzv1.ResourceRule{
		Verbs:         []string{"get"},
		APIGroups:     []string{"cluster.open-cluster-management.io"},
		Resources:     []string{"managedclusters"},
		ResourceNames: []string{"allowed-cluster"},
	}
	star := authzv1.ResourceRule{Verbs: []string{"*"}, APIGroups: []string{"*"}, Resources: []string{"*"}}

	cases := []struct {
		name     string
		rules    subjectRulesStatus
		group    string
		resource string
		want     kindAccessType
		wantName string
	}{
		{name: "empty deny-all", rules: empty, group: "", resource: "secrets", want: kindAccessDenyAll},
		{name: "empty incomplete deny-all", rules: subjectRulesStatus{incomplete: true}, group: "", resource: "secrets", want: kindAccessDenyAll},
		{name: "unavailable incomplete", rules: subjectRulesStatus{unavailable: true}, group: "", resource: "secrets", want: kindAccessIncomplete},
		{name: "evaluationError empty deny-all", rules: subjectRulesStatus{evaluationError: "webhook"}, group: "", resource: "secrets", want: kindAccessDenyAll},
		{
			name:     "evaluationError non-empty incomplete",
			rules:    subjectRulesStatus{evaluationError: "webhook", resourceRules: []authzv1.ResourceRule{secretRule}},
			group:    "",
			resource: "secrets",
			want:     kindAccessIncomplete,
		},
		{name: "allow-all secrets", rules: subjectRulesStatus{resourceRules: []authzv1.ResourceRule{secretRule}}, group: "", resource: "secrets", want: kindAccessAllowAll},
		{name: "star allow-all", rules: subjectRulesStatus{resourceRules: []authzv1.ResourceRule{star}}, group: "cluster.open-cluster-management.io", resource: "managedclusters", want: kindAccessAllowAll},
		{
			name:     "allow-names",
			rules:    subjectRulesStatus{resourceRules: []authzv1.ResourceRule{named}},
			group:    "cluster.open-cluster-management.io",
			resource: "managedclusters",
			want:     kindAccessAllowNames,
			wantName: "allowed-cluster",
		},
		{
			name:     "incomplete non-empty unmatched",
			rules:    subjectRulesStatus{incomplete: true, resourceRules: []authzv1.ResourceRule{secretRule}},
			group:    "cluster.open-cluster-management.io",
			resource: "managedclusters",
			want:     kindAccessIncomplete,
		},
		{
			name:     "complete unmatched deny-all",
			rules:    subjectRulesStatus{resourceRules: []authzv1.ResourceRule{secretRule}},
			group:    "cluster.open-cluster-management.io",
			resource: "managedclusters",
			want:     kindAccessDenyAll,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := evaluateKindGetAccess(tc.rules, tc.group, tc.resource)
			if got.typ != tc.want {
				t.Fatalf("typ %v want %v", got.typ, tc.want)
			}
			if tc.want == kindAccessAllowNames {
				if _, ok := got.names[tc.wantName]; !ok {
					t.Fatalf("missing name %q in %v", tc.wantName, got.names)
				}
			}
		})
	}
}

func TestRulesNamespaceFor(t *testing.T) {
	if got := rulesNamespaceFor("ManagedCluster", "other", true); got != clusterScopedRulesNamespace {
		t.Fatalf("cluster-scoped %q", got)
	}
	if got := rulesNamespaceFor("Secret", "ns-a", false); got != "ns-a" {
		t.Fatalf("namespaced %q", got)
	}
	if got := rulesNamespaceFor("Secret", "", false); got != clusterScopedRulesNamespace {
		t.Fatalf("missing ns %q", got)
	}
}
