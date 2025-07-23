/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useSetRecoilState } from 'recoil'
import {
  // Import all the state atoms
  agentClusterInstallsState,
  agentMachinesState,
  agentServiceConfigsState,
  agentsState,
  ansibleJobState,
  applicationsState,
  argoCDsState,
  bareMetalHostsState,
  certificateSigningRequestsState,
  channelsState,
  clusterClaimsState,
  clusterCuratorsState,
  clusterDeploymentsState,
  clusterImageSetsState,
  clusterManagementAddonsState,
  clusterPoolsState,
  clusterProvisionsState,
  clusterVersionState,
  configMapsState,
  discoveredClusterState,
  discoveryConfigState,
  gitOpsClustersState,
  helmReleaseState,
  hostedClustersState,
  infraEnvironmentsState,
  infrastructuresState,
  machinePoolsState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClusterSetBindingsState,
  managedClusterSetsState,
  managedClustersState,
  multiclusterApplicationSetReportState,
  multiClusterEnginesState,
  namespacesState,
  nmStateConfigsState,
  nodePoolsState,
  placementBindingsState,
  placementDecisionsState,
  placementRulesState,
  placementsState,
  policiesState,
  policyAutomationState,
  policyreportState,
  policySetsState,
  searchOperatorState,
  secretsState,
  storageClassState,
  submarinerConfigsState,
  subscriptionOperatorsState,
  subscriptionReportsState,
  subscriptionsState,
} from '../../atoms'

import {
  // Import all the resource types
  AgentClusterInstallApiVersion,
  AgentClusterInstallKind,
  AgentKind,
  AgentKindVersion,
  AgentMachineApiVersion,
  AgentMachineKind,
  AgentServiceConfigKind,
  AgentServiceConfigKindVersion,
  AnsibleJobApiVersion,
  AnsibleJobKind,
  ApplicationApiVersion,
  ApplicationKind,
  BareMetalHostApiVersion,
  BareMetalHostKind,
  CertificateSigningRequestApiVersion,
  CertificateSigningRequestKind,
  ChannelApiVersion,
  ChannelKind,
  ClusterClaimApiVersion,
  ClusterClaimKind,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  ClusterImageSetApiVersion,
  ClusterImageSetKind,
  ClusterManagementAddOnApiVersion,
  ClusterManagementAddOnKind,
  ClusterPoolApiVersion,
  ClusterPoolKind,
  ClusterProvisionApiVersion,
  ClusterProvisionKind,
  ClusterVersionApiVersion,
  ClusterVersionKind,
  ConfigMapApiVersion,
  ConfigMapKind,
  DiscoveredClusterApiVersion,
  DiscoveredClusterKind,
  DiscoveryConfigApiVersion,
  DiscoveryConfigKind,
  GitOpsClusterApiVersion,
  GitOpsClusterKind,
  HelmReleaseApiVersion,
  HelmReleaseKind,
  HostedClusterApiVersion,
  HostedClusterKind,
  InfraEnvApiVersion,
  InfraEnvKind,
  InfrastructureApiVersion,
  InfrastructureKind,
  IResource,
  MachinePoolApiVersion,
  MachinePoolKind,
  ManagedClusterAddOnApiVersion,
  ManagedClusterAddOnKind,
  ManagedClusterApiVersion,
  ManagedClusterInfoApiVersion,
  ManagedClusterInfoKind,
  ManagedClusterKind,
  ManagedClusterSetApiVersion,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
  ManagedClusterSetKind,
  MulticlusterApplicationSetReportApiVersion,
  MulticlusterApplicationSetReportKind,
  MultiClusterEngineApiVersion,
  MultiClusterEngineKind,
  NamespaceApiVersion,
  NamespaceKind,
  NMStateConfigApiVersion,
  NMStateConfigKind,
  NodePoolApiVersion,
  NodePoolKind,
  PlacementApiVersionAlpha,
  PlacementBindingApiVersion,
  PlacementBindingKind,
  PlacementDecisionApiVersion,
  PlacementDecisionKind,
  PlacementKind,
  PlacementRuleApiVersion,
  PlacementRuleKind,
  PolicyApiVersion,
  PolicyAutomationApiVersion,
  PolicyAutomationKind,
  PolicyKind,
  PolicyReportApiVersion,
  PolicyReportKind,
  PolicySetApiVersion,
  PolicySetKind,
  SearchOperatorApiVersion,
  SearchOperatorKind,
  SecretApiVersion,
  SecretKind,
  StorageClassApiVersion,
  StorageClassKind,
  SubmarinerConfigApiVersion,
  SubmarinerConfigKind,
  SubscriptionApiVersion,
  SubscriptionKind,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
  SubscriptionReportApiVersion,
  SubscriptionReportKind,
} from '../../resources'

import { AccessControlApiVersion, AccessControlKind } from '../../resources/access-control'
import { ResourceMapper, ResourceSetter, ResourceSetterRegistry } from './types'

/**
 * Custom hook that manages the registry of resource state setters and mappers.
 * This centralizes all resource state management configuration in one place.
 */
export function useResourceStateRegistry(): ResourceSetterRegistry {
  // Get all the Recoil state setters
  const setAgentClusterInstalls = useSetRecoilState(agentClusterInstallsState)
  const setAgents = useSetRecoilState(agentsState)
  const setAgentServiceConfigs = useSetRecoilState(agentServiceConfigsState)
  const setAnsibleJobs = useSetRecoilState(ansibleJobState)
  const setApplicationsState = useSetRecoilState(applicationsState)
  const setArgoCDsState = useSetRecoilState(argoCDsState)
  const setBareMetalHosts = useSetRecoilState(bareMetalHostsState)
  const setCertificateSigningRequests = useSetRecoilState(certificateSigningRequestsState)
  const setChannelsState = useSetRecoilState(channelsState)
  const setClusterClaims = useSetRecoilState(clusterClaimsState)
  const setClusterCurators = useSetRecoilState(clusterCuratorsState)
  const setClusterDeployments = useSetRecoilState(clusterDeploymentsState)
  const setClusterImageSets = useSetRecoilState(clusterImageSetsState)
  const setClusterManagementAddons = useSetRecoilState(clusterManagementAddonsState)
  const setClusterVersions = useSetRecoilState(clusterVersionState)
  const setClusterPools = useSetRecoilState(clusterPoolsState)
  const setClusterProvisions = useSetRecoilState(clusterProvisionsState)
  const setConfigMaps = useSetRecoilState(configMapsState)
  const setDiscoveredClusters = useSetRecoilState(discoveredClusterState)
  const setDiscoveryConfigs = useSetRecoilState(discoveryConfigState)
  const setGitOpsClustersState = useSetRecoilState(gitOpsClustersState)
  const setHelmReleases = useSetRecoilState(helmReleaseState)
  const setInfraEnvironments = useSetRecoilState(infraEnvironmentsState)
  const setInfrastructure = useSetRecoilState(infrastructuresState)
  const setMachinePools = useSetRecoilState(machinePoolsState)
  const setManagedClusterAddons = useSetRecoilState(managedClusterAddonsState)
  const setManagedClusterInfos = useSetRecoilState(managedClusterInfosState)
  const setManagedClusterSetBindings = useSetRecoilState(managedClusterSetBindingsState)
  const setManagedClusterSets = useSetRecoilState(managedClusterSetsState)
  const setManagedClusters = useSetRecoilState(managedClustersState)
  const setMultiClusterEngines = useSetRecoilState(multiClusterEnginesState)
  const setMulticlusterApplicationSetReportState = useSetRecoilState(multiclusterApplicationSetReportState)
  const setNamespaces = useSetRecoilState(namespacesState)
  const setNMStateConfigs = useSetRecoilState(nmStateConfigsState)
  const setPoliciesState = useSetRecoilState(policiesState)
  const setPolicyAutomationState = useSetRecoilState(policyAutomationState)
  const setPolicySetsState = useSetRecoilState(policySetsState)
  const setPlacementBindingsState = useSetRecoilState(placementBindingsState)
  const setPlacementsState = useSetRecoilState(placementsState)
  const setPlacementRulesState = useSetRecoilState(placementRulesState)
  const setPlacementDecisionsState = useSetRecoilState(placementDecisionsState)
  const setPolicyReports = useSetRecoilState(policyreportState)
  const setSearchOperator = useSetRecoilState(searchOperatorState)
  const setSecrets = useSetRecoilState(secretsState)
  const setSubmarinerConfigs = useSetRecoilState(submarinerConfigsState)
  const setSubscriptionsState = useSetRecoilState(subscriptionsState)
  const setSubscriptionOperatorsState = useSetRecoilState(subscriptionOperatorsState)
  const setSubscriptionReportsState = useSetRecoilState(subscriptionReportsState)
  const setStorageClassState = useSetRecoilState(storageClassState)
  const setHostedClustersState = useSetRecoilState(hostedClustersState)
  const setNodePoolsState = useSetRecoilState(nodePoolsState)
  const setAgentMachinesState = useSetRecoilState(agentMachinesState)

  return useMemo(() => {
    // Define all resource setters
    const resourceSetters: ResourceSetter[] = [
      { apiVersion: AgentClusterInstallApiVersion, kind: AgentClusterInstallKind, setter: setAgentClusterInstalls },
      { apiVersion: AgentServiceConfigKindVersion, kind: AgentServiceConfigKind, setter: setAgentServiceConfigs },
      { apiVersion: ApplicationApiVersion, kind: ApplicationKind, setter: setApplicationsState },
      { apiVersion: ChannelApiVersion, kind: ChannelKind, setter: setChannelsState },
      { apiVersion: PlacementApiVersionAlpha, kind: PlacementKind, setter: setPlacementsState },
      { apiVersion: PlacementRuleApiVersion, kind: PlacementRuleKind, setter: setPlacementRulesState },
      { apiVersion: PlacementDecisionApiVersion, kind: PlacementDecisionKind, setter: setPlacementDecisionsState },
      { apiVersion: SubscriptionApiVersion, kind: SubscriptionKind, setter: setSubscriptionsState },
      {
        apiVersion: SubscriptionOperatorApiVersion,
        kind: SubscriptionOperatorKind,
        setter: setSubscriptionOperatorsState,
      },
      { apiVersion: SubscriptionReportApiVersion, kind: SubscriptionReportKind, setter: setSubscriptionReportsState },
      { apiVersion: GitOpsClusterApiVersion, kind: GitOpsClusterKind, setter: setGitOpsClustersState },
      { apiVersion: 'argoproj.io/v1alpha1', kind: 'ArgoCD', setter: setArgoCDsState },
      { apiVersion: AgentKindVersion, kind: AgentKind, setter: setAgents },
      { apiVersion: AnsibleJobApiVersion, kind: AnsibleJobKind, setter: setAnsibleJobs },
      { apiVersion: BareMetalHostApiVersion, kind: BareMetalHostKind, setter: setBareMetalHosts },
      {
        apiVersion: CertificateSigningRequestApiVersion,
        kind: CertificateSigningRequestKind,
        setter: setCertificateSigningRequests,
      },
      { apiVersion: ClusterClaimApiVersion, kind: ClusterClaimKind, setter: setClusterClaims },
      { apiVersion: ClusterCuratorApiVersion, kind: ClusterCuratorKind, setter: setClusterCurators },
      { apiVersion: ClusterDeploymentApiVersion, kind: ClusterDeploymentKind, setter: setClusterDeployments },
      { apiVersion: ClusterImageSetApiVersion, kind: ClusterImageSetKind, setter: setClusterImageSets },
      {
        apiVersion: ClusterManagementAddOnApiVersion,
        kind: ClusterManagementAddOnKind,
        setter: setClusterManagementAddons,
      },
      { apiVersion: ClusterPoolApiVersion, kind: ClusterPoolKind, setter: setClusterPools },
      { apiVersion: ClusterProvisionApiVersion, kind: ClusterProvisionKind, setter: setClusterProvisions },
      { apiVersion: ClusterVersionApiVersion, kind: ClusterVersionKind, setter: setClusterVersions },
      { apiVersion: ConfigMapApiVersion, kind: ConfigMapKind, setter: setConfigMaps },
      { apiVersion: DiscoveredClusterApiVersion, kind: DiscoveredClusterKind, setter: setDiscoveredClusters },
      { apiVersion: DiscoveryConfigApiVersion, kind: DiscoveryConfigKind, setter: setDiscoveryConfigs },
      { apiVersion: HelmReleaseApiVersion, kind: HelmReleaseKind, setter: setHelmReleases },
      { apiVersion: InfraEnvApiVersion, kind: InfraEnvKind, setter: setInfraEnvironments },
      { apiVersion: InfrastructureApiVersion, kind: InfrastructureKind, setter: setInfrastructure },
      { apiVersion: MachinePoolApiVersion, kind: MachinePoolKind, setter: setMachinePools },
      { apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind, setter: setManagedClusters },
      { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind, setter: setManagedClusterInfos },
      { apiVersion: ManagedClusterSetApiVersion, kind: ManagedClusterSetKind, setter: setManagedClusterSets },
      {
        apiVersion: ManagedClusterSetBindingApiVersion,
        kind: ManagedClusterSetBindingKind,
        setter: setManagedClusterSetBindings,
      },
      { apiVersion: MultiClusterEngineApiVersion, kind: MultiClusterEngineKind, setter: setMultiClusterEngines },
      {
        apiVersion: MulticlusterApplicationSetReportApiVersion,
        kind: MulticlusterApplicationSetReportKind,
        setter: setMulticlusterApplicationSetReportState,
      },
      { apiVersion: NamespaceApiVersion, kind: NamespaceKind, setter: setNamespaces },
      { apiVersion: NMStateConfigApiVersion, kind: NMStateConfigKind, setter: setNMStateConfigs },
      { apiVersion: PolicyApiVersion, kind: PolicyKind, setter: setPoliciesState },
      { apiVersion: PolicyAutomationApiVersion, kind: PolicyAutomationKind, setter: setPolicyAutomationState },
      { apiVersion: PolicySetApiVersion, kind: PolicySetKind, setter: setPolicySetsState },
      { apiVersion: PlacementBindingApiVersion, kind: PlacementBindingKind, setter: setPlacementBindingsState },
      { apiVersion: PolicyReportApiVersion, kind: PolicyReportKind, setter: setPolicyReports },
      { apiVersion: SearchOperatorApiVersion, kind: SearchOperatorKind, setter: setSearchOperator },
      { apiVersion: SecretApiVersion, kind: SecretKind, setter: setSecrets },
      { apiVersion: StorageClassApiVersion, kind: StorageClassKind, setter: setStorageClassState },
      { apiVersion: SubmarinerConfigApiVersion, kind: SubmarinerConfigKind, setter: setSubmarinerConfigs },
      { apiVersion: HostedClusterApiVersion, kind: HostedClusterKind, setter: setHostedClustersState },
      { apiVersion: NodePoolApiVersion, kind: NodePoolKind, setter: setNodePoolsState },
      { apiVersion: AgentMachineApiVersion, kind: AgentMachineKind, setter: setAgentMachinesState },
    ]

    // Define resource mappers (for resources that need to be keyed by namespace)
    const resourceMappers: ResourceMapper[] = [
      {
        apiVersion: ManagedClusterAddOnApiVersion,
        kind: ManagedClusterAddOnKind,
        setter: setManagedClusterAddons,
        keyBy: ['metadata.namespace'],
      },
    ]

    // Build the registry structure
    const setters: Record<string, Record<string, any>> = {}
    const mappers: Record<string, Record<string, any>> = {}
    const caches: Record<string, Record<string, Record<string, IResource>>> = {}

    // Process setters
    resourceSetters.forEach(({ apiVersion, kind, setter }) => {
      const groupVersion = apiVersion.split('/')[0]
      if (!setters[groupVersion]) setters[groupVersion] = {}
      if (!caches[groupVersion]) caches[groupVersion] = {}

      setters[groupVersion][kind] = setter
      caches[groupVersion][kind] = {}
    })

    // Process mappers
    const mcaches: Record<string, Record<string, Record<string, IResource[]>>> = {}
    resourceMappers.forEach(({ apiVersion, kind, setter, keyBy }) => {
      const groupVersion = apiVersion.split('/')[0]
      if (!mappers[groupVersion]) mappers[groupVersion] = {}
      if (!mcaches[groupVersion]) mcaches[groupVersion] = {}

      mcaches[groupVersion][kind] = {}
      mappers[groupVersion][kind] = { setter, mcaches, keyBy }
    })

    return { setters, mappers, caches }
  }, [
    // Include all setters in dependency array
    setAgentClusterInstalls,
    setAgents,
    setAgentServiceConfigs,
    setAnsibleJobs,
    setApplicationsState,
    setArgoCDsState,
    setBareMetalHosts,
    setCertificateSigningRequests,
    setChannelsState,
    setClusterClaims,
    setClusterCurators,
    setClusterDeployments,
    setClusterImageSets,
    setClusterManagementAddons,
    setClusterPools,
    setClusterProvisions,
    setClusterVersions,
    setConfigMaps,
    setDiscoveredClusters,
    setDiscoveryConfigs,
    setGitOpsClustersState,
    setHelmReleases,
    setInfraEnvironments,
    setInfrastructure,
    setMachinePools,
    setManagedClusterAddons,
    setManagedClusterInfos,
    setManagedClusterSetBindings,
    setManagedClusterSets,
    setManagedClusters,
    setMultiClusterEngines,
    setMulticlusterApplicationSetReportState,
    setNamespaces,
    setNMStateConfigs,
    setPlacementBindingsState,
    setPlacementDecisionsState,
    setPlacementRulesState,
    setPlacementsState,
    setPoliciesState,
    setPolicyAutomationState,
    setPolicyReports,
    setPolicySetsState,
    setSearchOperator,
    setSecrets,
    setStorageClassState,
    setSubmarinerConfigs,
    setSubscriptionReportsState,
    setSubscriptionsState,
    setSubscriptionOperatorsState,
    setHostedClustersState,
    setNodePoolsState,
    setAgentMachinesState,
  ])
}
