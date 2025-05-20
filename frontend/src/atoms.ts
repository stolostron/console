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
} from '@openshift-assisted/ui-lib/cim'
import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { atom, useRecoilValue } from 'recoil'
import {
  AnsibleJob,
  Application,
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
  MulticlusterApplicationSetReport,
  MultiClusterEngine,
  Namespace,
  Placement,
  PlacementBinding,
  PlacementDecision,
  PlacementRule,
  Policy,
  PolicyAutomation,
  PolicyReport,
  PolicySet,
  SearchOperator,
  Secret,
  SubmarinerConfig,
  Subscription,
  SubscriptionOperator,
  SubscriptionReport,
} from './resources'
let atomArrayKey = 0
function AtomArray<T>() {
  return atom<T[]>({ key: (++atomArrayKey).toString(), default: [] })
}
function AtomMap<T>() {
  return atom<Record<string, T[]>>({ key: (++atomArrayKey).toString(), default: {} })
}

// throttle events delay
export const THROTTLE_EVENTS_DELAY = 500

export const managedClusterAddonsState = AtomMap<ManagedClusterAddOn>()

export const agentClusterInstallsState = AtomArray<AgentClusterInstallK8sResource>()
export const agentsState = AtomArray<AgentK8sResource>()
export const agentServiceConfigsState = AtomArray<AgentServiceConfigK8sResource>()
export const ansibleJobState = AtomArray<AnsibleJob>()
export const applicationsState = AtomArray<Application>()
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
export const managedClusterInfosState = AtomArray<ManagedClusterInfo>()
export const managedClusterSetBindingsState = AtomArray<ManagedClusterSetBinding>()
export const managedClusterSetsState = AtomArray<ManagedClusterSet>()
export const managedClustersState = AtomArray<ManagedCluster>()
export const multiClusterEnginesState = AtomArray<MultiClusterEngine>()
export const multiclusterApplicationSetReportState = AtomArray<MulticlusterApplicationSetReport>()
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
export const searchOperatorState = AtomArray<SearchOperator>()
export const secretsState = AtomArray<Secret>()
export const storageClassState = AtomArray<StorageClassK8sResource>()
export const submarinerConfigsState = AtomArray<SubmarinerConfig>()
export const subscriptionsState = AtomArray<Subscription>()
export const subscriptionOperatorsState = AtomArray<SubscriptionOperator>()
export const subscriptionReportsState = AtomArray<SubscriptionReport>()
export const hostedClustersState = AtomArray<HostedClusterK8sResource>()
export const nodePoolsState = AtomArray<NodePoolK8sResource>()
export const agentMachinesState = AtomArray<AgentMachineK8sResource>()

export const settingsState = atom<Settings>({ key: 'settings', default: {} })

export const isGlobalHubState = atom<boolean>({
  key: 'isGlobalHub',
  default: false,
})

export const localHubNameState = atom<string>({
  key: 'localHubName',
  default: 'local-cluster',
})

export const isHubSelfManagedState = atom<boolean | undefined>({
  key: 'isHubSelfManaged',
  default: undefined,
})

export interface Settings {
  LOG_LEVEL?: string
  SAVED_SEARCH_LIMIT?: string
  SEARCH_RESULT_LIMIT?: string
  SEARCH_AUTOCOMPLETE_LIMIT?: string
  VIRTUAL_MACHINE_ACTIONS?: 'enabled' | 'disabled'

  ansibleIntegration?: 'enabled' | 'disabled'
  singleNodeOpenshift?: 'enabled' | 'disabled'
  awsPrivateWizardStep?: 'enabled' | 'disabled'
  globalSearchFeatureFlag?: 'enabled' | 'disabled'

  APP_ARGO_SEARCH_RESULT_LIMIT?: string
  APP_OCP_SEARCH_RESULT_LIMIT?: string

  VM_RESULT_LIMIT?: string
}

export interface WatchEvent {
  type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'EOP'
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

export function useIsObservabilityInstalled() {
  const clusterManagementAddons = useRecoilValue(clusterManagementAddonsState)
  return useMemo(() => {
    return clusterManagementAddons.filter((cma) => cma.metadata.name === 'observability-controller').length > 0
  }, [clusterManagementAddons])
}

// Search is available if api, collector, indexer & postgres are in ready state
export function useIsSearchAvailable() {
  const searchOperator = useRecoilValue(searchOperatorState)
  return useMemo(() => {
    const isReady = (type: string) =>
      searchOperator[0]?.status?.conditions.some((c) => c.type.toLowerCase() === type && c.status === 'True')
    const searchServices = [
      'ready--search-api',
      'ready--search-collector',
      'ready--search-indexer',
      'ready--search-postgres',
    ]
    return searchOperator.length > 0 && searchServices.every(isReady)
  }, [searchOperator])
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

export function useAppArgoSearchResultLimit() {
  const settings = useRecoilValue(settingsState)
  return useMemo(() => parseInt(settings.APP_ARGO_SEARCH_RESULT_LIMIT ?? '1000'), [settings])
}

export function useAppOCPSearchResultLimit() {
  const settings = useRecoilValue(settingsState)
  return useMemo(() => parseInt(settings.APP_OCP_SEARCH_RESULT_LIMIT ?? '1000'), [settings])
}

export function useVitualMachineSearchResultLimit() {
  const settings = useRecoilValue(settingsState)
  return useMemo(() => parseInt(settings.VM_RESULT_LIMIT ?? '-1'), [settings])
}
