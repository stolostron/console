/* Copyright Contributors to the Open Cluster Management project */
import {
  AgentClusterInstallK8sResource,
  AgentK8sResource,
  AgentMachineK8sResource,
  AgentServiceConfigK8sResource,
  BareMetalHostK8sResource,
  ClusterVersionK8sResource,
  HostedClusterK8sResource,
  InfraEnvK8sResource,
  InfrastructureK8sResource,
  NMStateK8sResource,
  NodePoolK8sResource,
  StorageClassK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { atom, useRecoilValue } from 'recoil'
import {
  AnsibleJob,
  Application,
  ApplicationSet,
  ArgoApplication,
  CertificateSigningRequest,
  Channel,
  ClusterClaim,
  ClusterCurator,
  ClusterDeployment,
  ClusterImageSet,
  ClusterManagementAddOn,
  ClusterPool,
  ClusterProvision,
  ConfigMap,
  CustomResourceDefinition,
  DiscoveredCluster,
  DiscoveryConfig,
  GitOpsCluster,
  HelmRelease,
  IResource,
  MachinePool,
  ManagedCluster,
  ManagedClusterAddOn,
  ManagedClusterInfo,
  ManagedClusterSet,
  ManagedClusterSetBinding,
  MultiClusterEngine,
  MultiClusterHub,
  Namespace,
  OCPAppResource,
  Placement,
  PlacementBinding,
  PlacementDecision,
  PlacementRule,
  Policy,
  PolicyAutomation,
  PolicyReport,
  PolicySet,
  Secret,
  SubmarinerConfig,
  Subscription,
  SubscriptionOperator,
  SubscriptionReport,
  UserPreference,
} from './resources'
let atomArrayKey = 0
function AtomArray<T>() {
  return atom<T[]>({ key: (++atomArrayKey).toString(), default: [] })
}

// throttle events delay
export const THROTTLE_EVENTS_DELAY = 500

export const discoveredApplicationsState = AtomArray<ArgoApplication>()
export const discoveredOCPAppResourcesState = AtomArray<OCPAppResource>()

export const agentClusterInstallsState = AtomArray<AgentClusterInstallK8sResource>()
export const agentsState = AtomArray<AgentK8sResource>()
export const agentServiceConfigsState = AtomArray<AgentServiceConfigK8sResource>()
export const ansibleJobState = AtomArray<AnsibleJob>()
export const appProjectsState = AtomArray<IResource>()
export const applicationSetsState = AtomArray<ApplicationSet>()
export const applicationsState = AtomArray<Application>()
export const argoApplicationsState = AtomArray<ArgoApplication>()
export const argoCDsState = AtomArray<IResource>()
export const bareMetalHostsState = AtomArray<BareMetalHostK8sResource>()
export const certificateSigningRequestsState = AtomArray<CertificateSigningRequest>()
export const channelsState = AtomArray<Channel>()
export const clusterClaimsState = AtomArray<ClusterClaim>()
export const clusterCuratorsState = AtomArray<ClusterCurator>()
export const clusterDeploymentsState = AtomArray<ClusterDeployment>()
export const clusterImageSetsState = AtomArray<ClusterImageSet>()
export const clusterManagementAddonsState = AtomArray<ClusterManagementAddOn>()
export const clusterPoolsState = AtomArray<ClusterPool>()
export const clusterProvisionsState = AtomArray<ClusterProvision>()
export const clusterVersionState = AtomArray<ClusterVersionK8sResource>()
export const configMapsState = AtomArray<ConfigMap>()
export const discoveredClusterState = AtomArray<DiscoveredCluster>()
export const discoveryConfigState = AtomArray<DiscoveryConfig>()
export const gitOpsClustersState = AtomArray<GitOpsCluster>()
export const helmReleaseState = AtomArray<HelmRelease>()
export const infraEnvironmentsState = AtomArray<InfraEnvK8sResource>()
export const infrastructuresState = AtomArray<InfrastructureK8sResource>()
export const machinePoolsState = AtomArray<MachinePool>()
export const managedClusterAddonsState = AtomArray<ManagedClusterAddOn>()
export const managedClusterInfosState = AtomArray<ManagedClusterInfo>()
export const managedClusterSetBindingsState = AtomArray<ManagedClusterSetBinding>()
export const managedClusterSetsState = AtomArray<ManagedClusterSet>()
export const managedClustersState = AtomArray<ManagedCluster>()
export const multiClusterEnginesState = AtomArray<MultiClusterEngine>()
export const multiClusterHubState = AtomArray<MultiClusterHub>()
export const namespacesState = AtomArray<Namespace>()
export const nmStateConfigsState = AtomArray<NMStateK8sResource>()
export const policiesState = AtomArray<Policy>()
export const policyAutomationState = AtomArray<PolicyAutomation>()
export const policySetsState = AtomArray<PolicySet>()
export const placementBindingsState = AtomArray<PlacementBinding>()
export const placementsState = AtomArray<Placement>()
export const placementRulesState = AtomArray<PlacementRule>()
export const placementDecisionsState = AtomArray<PlacementDecision>()
export const policyreportState = AtomArray<PolicyReport>()
export const secretsState = AtomArray<Secret>()
export const storageClassState = AtomArray<StorageClassK8sResource>()
export const submarinerConfigsState = AtomArray<SubmarinerConfig>()
export const subscriptionsState = AtomArray<Subscription>()
export const subscriptionOperatorsState = AtomArray<SubscriptionOperator>()
export const subscriptionReportsState = AtomArray<SubscriptionReport>()
export const userPreferencesState = AtomArray<UserPreference>()
export const hostedClustersState = AtomArray<HostedClusterK8sResource>()
export const nodePoolsState = AtomArray<NodePoolK8sResource>()
export const agentMachinesState = AtomArray<AgentMachineK8sResource>()
export const customResourceDefinitionsState = AtomArray<CustomResourceDefinition>()

export const settingsState = atom<Settings>({ key: 'settings', default: {} })

export interface Settings {
  LOG_LEVEL?: string
  SAVED_SEARCH_LIMIT?: string
  SEARCH_RESULT_LIMIT?: string
  SEARCH_AUTOCOMPLETE_LIMIT?: string

  ansibleIntegration?: 'enabled' | 'disabled'
  singleNodeOpenshift?: 'enabled' | 'disabled'
  awsPrivateWizardStep?: 'enabled' | 'disabled'
}

export interface WatchEvent {
  type: 'ADDED' | 'DELETED' | 'MODIFIED'
  object: {
    kind: string
    apiVersion: string
    metadata: {
      name: string
      namespace: string
      resourceVersion: string
    }
  }
}

export interface SettingsEvent {
  type: 'SETTINGS'
  settings: Record<string, string>
}

export type ServerSideEventData = WatchEvent | SettingsEvent | { type: 'START' | 'LOADED' }

export function usePolicies() {
  const policies = useRecoilValue(policiesState)
  return useMemo(
    () => policies.filter((policy) => !policy.metadata.labels?.['policy.open-cluster-management.io/root-policy']),
    [policies]
  )
}

export function useSavedSearchLimit() {
  const settings = useRecoilValue(settingsState)
  return useMemo(() => parseInt(settings.SAVED_SEARCH_LIMIT ?? '10'), [settings])
}

export function useSearchResultLimit() {
  const settings = useRecoilValue(settingsState)
  return useMemo(() => parseInt(settings.SEARCH_RESULT_LIMIT ?? '1000'), [settings])
}

export function useSearchAutocompleteLimit() {
  const settings = useRecoilValue(settingsState)
  return useMemo(() => parseInt(settings.SEARCH_AUTOCOMPLETE_LIMIT ?? '10000'), [settings])
}
