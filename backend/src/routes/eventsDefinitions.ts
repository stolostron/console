/* Copyright Contributors to the Open Cluster Management project */

export interface IWatchOptions {
  apiVersion: string
  kind: string
  labelSelector?: Record<string, string>
  fieldSelector?: Record<string, string>
  /**
   * True when the Kubernetes resource is cluster-scoped.
   * Used by SSE RBAC to decide whether SelfSubjectRulesReview should probe `default`
   * (cluster-scoped) or the resource namespace (namespaced).
   */
  clusterScoped?: boolean
}

export const definitions: IWatchOptions[] = [
  { kind: 'ClusterManagementAddOn', apiVersion: 'addon.open-cluster-management.io/v1alpha1', clusterScoped: true },
  { kind: 'ManagedClusterAddOn', apiVersion: 'addon.open-cluster-management.io/v1alpha1' },
  { kind: 'Agent', apiVersion: 'agent-install.openshift.io/v1beta1' },
  { kind: 'AgentServiceConfig', apiVersion: 'agent-install.openshift.io/v1beta1', clusterScoped: true },
  { kind: 'InfraEnv', apiVersion: 'agent-install.openshift.io/v1beta1' },
  { kind: 'NMStateConfig', apiVersion: 'agent-install.openshift.io/v1beta1' },
  { kind: 'Application', apiVersion: 'app.k8s.io/v1beta1' },
  { kind: 'Channel', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'GitOpsCluster', apiVersion: 'apps.open-cluster-management.io/v1beta1' },
  { kind: 'HelmRelease', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'PlacementRule', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'Subscription', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'SubscriptionReport', apiVersion: 'apps.open-cluster-management.io/v1alpha1' },
  { kind: 'Application', apiVersion: 'argoproj.io/v1alpha1' },
  { kind: 'ApplicationSet', apiVersion: 'argoproj.io/v1alpha1' },
  { kind: 'ArgoCD', apiVersion: 'argoproj.io/v1alpha1' },
  { kind: 'MulticlusterApplicationSetReport', apiVersion: 'apps.open-cluster-management.io/v1alpha1' },
  { kind: 'Infrastructure', apiVersion: 'config.openshift.io/v1', clusterScoped: true },
  {
    kind: 'CertificateSigningRequest',
    apiVersion: 'certificates.k8s.io/v1',
    labelSelector: { 'open-cluster-management.io/cluster-name': '' },
    clusterScoped: true,
  },
  { kind: 'ManagedCluster', apiVersion: 'cluster.open-cluster-management.io/v1', clusterScoped: true },
  { kind: 'Placement', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
  { kind: 'Placement', apiVersion: 'cluster.open-cluster-management.io/v1alpha1' },
  { kind: 'PlacementDecision', apiVersion: 'cluster.open-cluster-management.io/v1alpha1' },
  { kind: 'PlacementDecision', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
  { kind: 'ManagedClusterSetBinding', apiVersion: 'cluster.open-cluster-management.io/v1beta2' },
  { kind: 'ManagedClusterSet', apiVersion: 'cluster.open-cluster-management.io/v1beta2', clusterScoped: true },
  { kind: 'ClusterCurator', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
  { kind: 'Subscription', apiVersion: 'operators.coreos.com/v1alpha1' },
  { kind: 'DiscoveredCluster', apiVersion: 'discovery.open-cluster-management.io/v1' },
  { kind: 'DiscoveryConfig', apiVersion: 'discovery.open-cluster-management.io/v1' },
  { kind: 'AgentClusterInstall', apiVersion: 'extensions.hive.openshift.io/v1beta1' },
  { kind: 'ClusterClaim', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ClusterDeployment', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ClusterImageSet', apiVersion: 'hive.openshift.io/v1', clusterScoped: true },
  { kind: 'ClusterPool', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ClusterProvision', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'MachinePool', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ManagedClusterInfo', apiVersion: 'internal.open-cluster-management.io/v1beta1' },
  { kind: 'BareMetalHost', apiVersion: 'metal3.io/v1alpha1' },
  { kind: 'MultiClusterEngine', apiVersion: 'multicluster.openshift.io/v1', clusterScoped: true },
  { kind: 'ClusterVersion', apiVersion: 'config.openshift.io/v1', clusterScoped: true },
  { kind: 'StorageClass', apiVersion: 'storage.k8s.io/v1', clusterScoped: true },
  { kind: 'PlacementBinding', apiVersion: 'policy.open-cluster-management.io/v1' },
  { kind: 'Policy', apiVersion: 'policy.open-cluster-management.io/v1' },
  { kind: 'PolicyAutomation', apiVersion: 'policy.open-cluster-management.io/v1beta1' },
  { kind: 'PolicySet', apiVersion: 'policy.open-cluster-management.io/v1beta1' },
  { kind: 'SubmarinerConfig', apiVersion: 'submarineraddon.open-cluster-management.io/v1alpha1' },
  { kind: 'AnsibleJob', apiVersion: 'tower.ansible.com/v1alpha1' },
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.name': 'assisted-service' },
  },
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.namespace': 'openshift-config-managed', 'metadata.name': 'console-public' },
  },
  { kind: 'ConfigMap', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'console-search-config' } },
  { kind: 'Namespace', apiVersion: 'v1', clusterScoped: true },
  { kind: 'Secret', apiVersion: 'v1', labelSelector: { 'cluster.open-cluster-management.io/credentials': '' } },
  // **Need to look for creds with: 'cluster.open-cluster-management.io/type': 'ans', for edit scenarios
  { kind: 'Secret', apiVersion: 'v1', labelSelector: { 'cluster.open-cluster-management.io/type': 'ans' } },
  { kind: 'Secret', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'auto-import-secret' } },
  { kind: 'PolicyReport', apiVersion: 'wgpolicyk8s.io/v1alpha2' },
  { kind: 'HostedCluster', apiVersion: 'hypershift.openshift.io/v1beta1' },
  { kind: 'NodePool', apiVersion: 'hypershift.openshift.io/v1beta1' },
  { kind: 'AgentMachine', apiVersion: 'capi-provider.agent-install.openshift.io/v1alpha1' },
  { kind: 'ConfigMap', apiVersion: 'v1', labelSelector: { 'hypershift.openshift.io/supported-versions': 'true' } },
  { kind: 'Search', apiVersion: 'search.open-cluster-management.io/v1alpha1' },
  // Configmaps that contain Grafana dashboard IDs
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.name': 'grafana-dashboard-acm-openshift-virtualization-clusters-overview' },
  },
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.name': 'grafana-dashboard-acm-openshift-virtualization-single-vm-view' },
  },
]

export const CLUSTER_SCOPED_KINDS = new Set(
  definitions.filter((definition) => definition.clusterScoped).map((definition) => definition.kind)
)
