// Copyright Contributors to the Open Cluster Management project

// Package informers watches hub resources with client-go (ACM-42597).
// GET /events SSE is served by internal/events/hub (ACM-42598).
// POST /aggregate/* reads this cache (ACM-42600).
package informers

import (
	"sort"
	"strings"
	"sync"
)

// WatchSpec is one events.ts definition (selectors included).
type WatchSpec struct {
	APIVersion             string
	Kind                   string
	LabelSelector          map[string]string
	FieldSelector          map[string]string
	Polled                 bool
	ForwardEventsToClients bool
	ClusterScoped          bool
}

func (s WatchSpec) SpecKey() string {
	return s.APIVersion + "|" + s.Kind + "|" + SelectorQuery(s.LabelSelector) + "|" + SelectorQuery(s.FieldSelector)
}

// SelectorQuery encodes a Kubernetes label or field selector (k=v,k2=v2).
func SelectorQuery(m map[string]string) string {
	if len(m) == 0 {
		return ""
	}
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, k+"="+m[k])
	}
	return strings.Join(parts, ",")
}

func watch(kind, apiVersion string) WatchSpec {
	return WatchSpec{Kind: kind, APIVersion: apiVersion, ForwardEventsToClients: true}
}

func (s WatchSpec) labels(pairs ...string) WatchSpec {
	s.LabelSelector = pairsToMap(pairs)
	return s
}

func (s WatchSpec) fields(pairs ...string) WatchSpec {
	s.FieldSelector = pairsToMap(pairs)
	return s
}

func (s WatchSpec) polled() WatchSpec {
	s.Polled = true
	return s
}

func (s WatchSpec) cacheOnly() WatchSpec {
	s.ForwardEventsToClients = false
	return s
}

func (s WatchSpec) cluster() WatchSpec {
	s.ClusterScoped = true
	return s
}

// ShouldForward is true when watch events should be fanned out to GET /events clients.
func (s WatchSpec) ShouldForward() bool {
	return s.ForwardEventsToClients && !s.Polled
}

func pairsToMap(pairs []string) map[string]string {
	m := make(map[string]string, len(pairs)/2)
	for i := 0; i+1 < len(pairs); i += 2 {
		m[pairs[i]] = pairs[i+1]
	}
	return m
}

var (
	clusterScopedOnce  sync.Once
	clusterScopedKinds map[string]struct{}
)

func initClusterScopedKinds() {
	clusterScopedOnce.Do(func() {
		clusterScopedKinds = map[string]struct{}{}
		for _, spec := range DefaultWatchSpecs() {
			if spec.ClusterScoped {
				clusterScopedKinds[spec.Kind] = struct{}{}
			}
		}
	})
}

// ClusterScopedKinds is the set of watch kinds marked cluster-scoped (Node CLUSTER_SCOPED_KINDS).
func ClusterScopedKinds() map[string]struct{} {
	initClusterScopedKinds()
	out := make(map[string]struct{}, len(clusterScopedKinds))
	for k, v := range clusterScopedKinds {
		out[k] = v
	}
	return out
}

// IsClusterScopedKind reports whether kind is cluster-scoped in DefaultWatchSpecs.
func IsClusterScopedKind(kind string) bool {
	initClusterScopedKinds()
	_, ok := clusterScopedKinds[kind]
	return ok
}

// watchDef is one row in DefaultWatchSpecs (kind + apiVersion + optional flags/selectors).
type watchDef struct {
	kind, apiVersion       string
	cluster, polled, cache bool
	labels, fields         []string
}

func (d watchDef) spec() WatchSpec {
	s := watch(d.kind, d.apiVersion)
	if d.cluster {
		s = s.cluster()
	}
	if d.polled {
		s = s.polled()
	}
	if d.cache {
		s = s.cacheOnly()
	}
	if len(d.labels) > 0 {
		s = s.labels(d.labels...)
	}
	if len(d.fields) > 0 {
		s = s.fields(d.fields...)
	}
	return s
}

// DefaultWatchSpecs is the source of truth for hub list/watch specs (GET /events, POST /aggregate).
func DefaultWatchSpecs() []WatchSpec {
	defs := []watchDef{
		{kind: "ClusterManagementAddOn", apiVersion: "addon.open-cluster-management.io/v1alpha1", cluster: true},
		{kind: "ManagedClusterAddOn", apiVersion: "addon.open-cluster-management.io/v1alpha1"},
		{kind: "Agent", apiVersion: "agent-install.openshift.io/v1beta1"},
		{kind: "AgentServiceConfig", apiVersion: "agent-install.openshift.io/v1beta1", cluster: true},
		{kind: "InfraEnv", apiVersion: "agent-install.openshift.io/v1beta1"},
		{kind: "NMStateConfig", apiVersion: "agent-install.openshift.io/v1beta1"},
		{kind: "Application", apiVersion: "app.k8s.io/v1beta1"},
		{kind: "Channel", apiVersion: "apps.open-cluster-management.io/v1"},
		{kind: "GitOpsCluster", apiVersion: "apps.open-cluster-management.io/v1beta1"},
		{kind: "HelmRelease", apiVersion: "apps.open-cluster-management.io/v1"},
		{kind: "Subscription", apiVersion: "apps.open-cluster-management.io/v1"},
		{kind: "SubscriptionReport", apiVersion: "apps.open-cluster-management.io/v1alpha1"},
		{kind: "Application", apiVersion: "argoproj.io/v1alpha1", polled: true},
		{kind: "ApplicationSet", apiVersion: "argoproj.io/v1alpha1", polled: true},
		{kind: "ArgoCD", apiVersion: "argoproj.io/v1alpha1"},
		{kind: "Authentication", apiVersion: "config.openshift.io/v1", cache: true, cluster: true},
		{kind: "MultiClusterHub", apiVersion: "operator.open-cluster-management.io/v1", cache: true},
		{kind: "Infrastructure", apiVersion: "config.openshift.io/v1", cluster: true},
		{kind: "CertificateSigningRequest", apiVersion: "certificates.k8s.io/v1", cluster: true, labels: []string{"open-cluster-management.io/cluster-name", ""}},
		{kind: "ManagedCluster", apiVersion: "cluster.open-cluster-management.io/v1", cluster: true},
		{kind: "Placement", apiVersion: "cluster.open-cluster-management.io/v1beta1"},
		{kind: "PlacementDecision", apiVersion: "cluster.open-cluster-management.io/v1beta1"},
		{kind: "ManagedClusterSetBinding", apiVersion: "cluster.open-cluster-management.io/v1beta2"},
		{kind: "ManagedClusterSet", apiVersion: "cluster.open-cluster-management.io/v1beta2", cluster: true},
		{kind: "ClusterCurator", apiVersion: "cluster.open-cluster-management.io/v1beta1"},
		{kind: "Subscription", apiVersion: "operators.coreos.com/v1alpha1"},
		{kind: "ClusterExtension", apiVersion: "olm.operatorframework.io/v1", cluster: true},
		{kind: "DiscoveredCluster", apiVersion: "discovery.open-cluster-management.io/v1"},
		{kind: "DiscoveryConfig", apiVersion: "discovery.open-cluster-management.io/v1"},
		{kind: "AgentClusterInstall", apiVersion: "extensions.hive.openshift.io/v1beta1"},
		{kind: "ClusterClaim", apiVersion: "hive.openshift.io/v1"},
		{kind: "ClusterDeployment", apiVersion: "hive.openshift.io/v1"},
		{kind: "ClusterImageSet", apiVersion: "hive.openshift.io/v1", cluster: true},
		{kind: "ClusterPool", apiVersion: "hive.openshift.io/v1"},
		{kind: "ClusterProvision", apiVersion: "hive.openshift.io/v1"},
		{kind: "MachinePool", apiVersion: "hive.openshift.io/v1"},
		{kind: "ManagedClusterInfo", apiVersion: "internal.open-cluster-management.io/v1beta1"},
		{kind: "BareMetalHost", apiVersion: "metal3.io/v1alpha1"},
		{kind: "MultiClusterEngine", apiVersion: "multicluster.openshift.io/v1", cluster: true},
		{kind: "ClusterVersion", apiVersion: "config.openshift.io/v1", cluster: true},
		{kind: "StorageClass", apiVersion: "storage.k8s.io/v1", cluster: true},
		{kind: "PlacementBinding", apiVersion: "policy.open-cluster-management.io/v1"},
		{kind: "Policy", apiVersion: "policy.open-cluster-management.io/v1"},
		{kind: "PolicyAutomation", apiVersion: "policy.open-cluster-management.io/v1beta1"},
		{kind: "PolicySet", apiVersion: "policy.open-cluster-management.io/v1beta1"},
		{kind: "SubmarinerConfig", apiVersion: "submarineraddon.open-cluster-management.io/v1alpha1"},
		{kind: "AnsibleJob", apiVersion: "tower.ansible.com/v1alpha1"},
		{kind: "AnsibleWorkflow", apiVersion: "tower.ansible.com/v1alpha1"},
		{kind: "ConfigMap", apiVersion: "v1", fields: []string{"metadata.name", "assisted-service"}},
		{kind: "ConfigMap", apiVersion: "v1", fields: []string{"metadata.namespace", "openshift-config-managed", "metadata.name", "console-public"}},
		{kind: "ConfigMap", apiVersion: "v1", fields: []string{"metadata.name", "console-search-config"}},
		{kind: "Namespace", apiVersion: "v1", cluster: true},
		{kind: "Secret", apiVersion: "v1", labels: []string{"cluster.open-cluster-management.io/credentials", ""}},
		{kind: "Secret", apiVersion: "v1", labels: []string{"cluster.open-cluster-management.io/type", "ans"}},
		{kind: "Secret", apiVersion: "v1", fields: []string{"metadata.name", "auto-import-secret"}},
		{kind: "Secret", apiVersion: "v1", labels: []string{"argocd.argoproj.io/secret-type", "repository"}},
		{kind: "PolicyReport", apiVersion: "wgpolicyk8s.io/v1alpha2"},
		{kind: "ClusterRole", apiVersion: "rbac.authorization.k8s.io/v1", cluster: true, labels: []string{"rbac.open-cluster-management.io/filter", "vm-clusterroles"}},
		{kind: "HostedCluster", apiVersion: "hypershift.openshift.io/v1beta1"},
		{kind: "NodePool", apiVersion: "hypershift.openshift.io/v1beta1"},
		{kind: "AgentMachine", apiVersion: "capi-provider.agent-install.openshift.io/v1alpha1"},
		{kind: "ConfigMap", apiVersion: "v1", labels: []string{"hypershift.openshift.io/supported-versions", "true"}},
		{kind: "Search", apiVersion: "search.open-cluster-management.io/v1alpha1"},
		{kind: "ConfigMap", apiVersion: "v1", fields: []string{"metadata.name", "grafana-dashboard-acm-openshift-virtualization-clusters-overview"}},
		{kind: "ConfigMap", apiVersion: "v1", fields: []string{"metadata.name", "grafana-dashboard-acm-openshift-virtualization-single-vm-view"}},
		{kind: "MulticlusterRoleAssignment", apiVersion: "rbac.open-cluster-management.io/v1beta1"},
		{kind: "User", apiVersion: "user.openshift.io/v1", cluster: true},
		{kind: "Group", apiVersion: "user.openshift.io/v1", cluster: true},
		{kind: "Service", apiVersion: "v1", fields: []string{"metadata.name", "cluster-proxy-addon-user", "metadata.namespace", "multicluster-engine"}},
	}
	out := make([]WatchSpec, 0, len(defs))
	for _, d := range defs {
		out = append(out, d.spec())
	}
	return out
}
