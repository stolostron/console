// Copyright Contributors to the Open Cluster Management project

// Package informers watches hub resources with client-go (ACM-42597).
// GET /events remains on the Node sidecar until ACM-42598.
package informers

import (
	"sort"
	"strings"
)

// WatchSpec is one events.ts definition (selectors included).
type WatchSpec struct {
	APIVersion             string
	Kind                   string
	LabelSelector          map[string]string
	FieldSelector          map[string]string
	Polled                 bool
	ForwardEventsToClients bool
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

func pairsToMap(pairs []string) map[string]string {
	m := make(map[string]string, len(pairs)/2)
	for i := 0; i+1 < len(pairs); i += 2 {
		m[pairs[i]] = pairs[i+1]
	}
	return m
}

// DefaultWatchSpecs is the port of backend-node/src/routes/events.ts `definitions`.
func DefaultWatchSpecs() []WatchSpec {
	return []WatchSpec{
		watch("ClusterManagementAddOn", "addon.open-cluster-management.io/v1alpha1"),
		watch("ManagedClusterAddOn", "addon.open-cluster-management.io/v1alpha1"),
		watch("Agent", "agent-install.openshift.io/v1beta1"),
		watch("AgentServiceConfig", "agent-install.openshift.io/v1beta1"),
		watch("InfraEnv", "agent-install.openshift.io/v1beta1"),
		watch("NMStateConfig", "agent-install.openshift.io/v1beta1"),
		watch("Application", "app.k8s.io/v1beta1"),
		watch("Channel", "apps.open-cluster-management.io/v1"),
		watch("GitOpsCluster", "apps.open-cluster-management.io/v1beta1"),
		watch("HelmRelease", "apps.open-cluster-management.io/v1"),
		watch("Subscription", "apps.open-cluster-management.io/v1"),
		watch("SubscriptionReport", "apps.open-cluster-management.io/v1alpha1"),
		watch("Application", "argoproj.io/v1alpha1").polled(),
		watch("ApplicationSet", "argoproj.io/v1alpha1").polled(),
		watch("ArgoCD", "argoproj.io/v1alpha1"),
		watch("Authentication", "config.openshift.io/v1").cacheOnly(),
		watch("Infrastructure", "config.openshift.io/v1"),
		watch("CertificateSigningRequest", "certificates.k8s.io/v1").labels("open-cluster-management.io/cluster-name", ""),
		watch("ManagedCluster", "cluster.open-cluster-management.io/v1"),
		watch("Placement", "cluster.open-cluster-management.io/v1beta1"),
		watch("PlacementDecision", "cluster.open-cluster-management.io/v1beta1"),
		watch("ManagedClusterSetBinding", "cluster.open-cluster-management.io/v1beta2"),
		watch("ManagedClusterSet", "cluster.open-cluster-management.io/v1beta2"),
		watch("ClusterCurator", "cluster.open-cluster-management.io/v1beta1"),
		watch("Subscription", "operators.coreos.com/v1alpha1"),
		watch("ClusterExtension", "olm.operatorframework.io/v1"),
		watch("DiscoveredCluster", "discovery.open-cluster-management.io/v1"),
		watch("DiscoveryConfig", "discovery.open-cluster-management.io/v1"),
		watch("AgentClusterInstall", "extensions.hive.openshift.io/v1beta1"),
		watch("ClusterClaim", "hive.openshift.io/v1"),
		watch("ClusterDeployment", "hive.openshift.io/v1"),
		watch("ClusterImageSet", "hive.openshift.io/v1"),
		watch("ClusterPool", "hive.openshift.io/v1"),
		watch("ClusterProvision", "hive.openshift.io/v1"),
		watch("MachinePool", "hive.openshift.io/v1"),
		watch("ManagedClusterInfo", "internal.open-cluster-management.io/v1beta1"),
		watch("BareMetalHost", "metal3.io/v1alpha1"),
		watch("MultiClusterEngine", "multicluster.openshift.io/v1"),
		watch("ClusterVersion", "config.openshift.io/v1"),
		watch("StorageClass", "storage.k8s.io/v1"),
		watch("PlacementBinding", "policy.open-cluster-management.io/v1"),
		watch("Policy", "policy.open-cluster-management.io/v1"),
		watch("PolicyAutomation", "policy.open-cluster-management.io/v1beta1"),
		watch("PolicySet", "policy.open-cluster-management.io/v1beta1"),
		watch("SubmarinerConfig", "submarineraddon.open-cluster-management.io/v1alpha1"),
		watch("AnsibleJob", "tower.ansible.com/v1alpha1"),
		watch("AnsibleWorkflow", "tower.ansible.com/v1alpha1"),
		watch("ConfigMap", "v1").fields("metadata.name", "assisted-service"),
		watch("ConfigMap", "v1").fields("metadata.namespace", "openshift-config-managed", "metadata.name", "console-public"),
		watch("ConfigMap", "v1").fields("metadata.name", "console-search-config"),
		watch("Namespace", "v1"),
		watch("Secret", "v1").labels("cluster.open-cluster-management.io/credentials", ""),
		watch("Secret", "v1").labels("cluster.open-cluster-management.io/type", "ans"),
		watch("Secret", "v1").fields("metadata.name", "auto-import-secret"),
		watch("Secret", "v1").labels("argocd.argoproj.io/secret-type", "repository"),
		watch("PolicyReport", "wgpolicyk8s.io/v1alpha2"),
		watch("HostedCluster", "hypershift.openshift.io/v1beta1"),
		watch("NodePool", "hypershift.openshift.io/v1beta1"),
		watch("AgentMachine", "capi-provider.agent-install.openshift.io/v1alpha1"),
		watch("ConfigMap", "v1").labels("hypershift.openshift.io/supported-versions", "true"),
		watch("Search", "search.open-cluster-management.io/v1alpha1"),
		watch("ConfigMap", "v1").fields("metadata.name", "grafana-dashboard-acm-openshift-virtualization-clusters-overview"),
		watch("ConfigMap", "v1").fields("metadata.name", "grafana-dashboard-acm-openshift-virtualization-single-vm-view"),
		watch("MulticlusterRoleAssignment", "rbac.open-cluster-management.io/v1beta1"),
		watch("User", "user.openshift.io/v1"),
		watch("Group", "user.openshift.io/v1"),
		watch("Service", "v1").fields("metadata.name", "cluster-proxy-addon-user", "metadata.namespace", "multicluster-engine"),
	}
}
