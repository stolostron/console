/* Copyright Contributors to the Open Cluster Management project */
import get from 'lodash/get'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { SetterOrUpdater, useRecoilValue, useSetRecoilState } from 'recoil'
import { tokenExpired } from '../logout'
import {
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
  AnsibleWorkflowKind,
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
  GroupKind,
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
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
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
  ClusterExtensionApiVersion,
  ClusterExtensionKind,
  SubscriptionReportApiVersion,
  SubscriptionReportKind,
  UserApiVersion,
  UserKind,
  ServiceApiVersion,
  ServiceKind,
} from '../resources'
import { getBackendUrl, getRequest } from '../resources/utils'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  agentClusterInstallsState,
  agentMachinesState,
  agentServiceConfigsState,
  agentsState,
  ansibleJobState,
  ansibleWorkflowState,
  applicationsState,
  argoCDsState,
  bareMetalHostsState,
  certificateSigningRequestsState,
  channelsState,
  claimMappingsState,
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
  groupsState,
  helmReleaseState,
  hostedClustersState,
  infraEnvironmentsState,
  infrastructuresState,
  isDirectAuthenticationEnabledState,
  isFineGrainedRbacEnabledState,
  isGlobalHubState,
  isHubSelfManagedState,
  localHubNameState,
  machinePoolsState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClusterSetBindingsState,
  managedClusterSetsState,
  managedClustersState,
  multiClusterEnginesState,
  multiclusterRoleAssignmentState,
  namespacesState,
  nmStateConfigsState,
  nodePoolsState,
  placementBindingsState,
  placementDecisionsState,
  placementsState,
  policiesState,
  policyAutomationState,
  policyreportState,
  policySetsState,
  searchOperatorState,
  secretsState,
  settingsState,
  servicesState,
  storageClassState,
  submarinerConfigsState,
  subscriptionOperatorsState,
  clusterExtensionsState,
  subscriptionReportsState,
  subscriptionsState,
  usersState,
  WatchEvent,
} from '../atoms'
import { applyWatchEventsToCache, groupWatchEventsByKind } from '../hooks/applyWatchEventsToCache'
import { PluginDataContext } from '../lib/PluginDataContext'
import { useQuery } from '../lib/useQuery'
import { MultiClusterHubComponent } from '../resources/multi-cluster-hub-component'
import { ClaimMappings } from '~/resources/authentication'
import { LoadDataAbstract } from './LoadDataAbstract'

export function LoadEventsData() {
  const { loadCompleted, setLoadStarted, setLoadCompleted } = useContext(PluginDataContext)
  const [eventsLoaded, setEventsLoaded] = useState(false)
  const isReconnectingRef = useRef(false)

  const setAgentClusterInstalls = useSetRecoilState(agentClusterInstallsState)
  const setAgentMachinesState = useSetRecoilState(agentMachinesState)
  const setAgents = useSetRecoilState(agentsState)
  const setAgentServiceConfigs = useSetRecoilState(agentServiceConfigsState)
  const setAnsibleJobs = useSetRecoilState(ansibleJobState)
  const setAnsibleWorkflows = useSetRecoilState(ansibleWorkflowState)
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
  const setClusterPools = useSetRecoilState(clusterPoolsState)
  const setClusterProvisions = useSetRecoilState(clusterProvisionsState)
  const setClusterVerions = useSetRecoilState(clusterVersionState)
  const setConfigMaps = useSetRecoilState(configMapsState)
  const setDiscoveredClusters = useSetRecoilState(discoveredClusterState)
  const setDiscoveryConfigs = useSetRecoilState(discoveryConfigState)
  const setGitOpsClustersState = useSetRecoilState(gitOpsClustersState)
  const setGroups = useSetRecoilState(groupsState)
  const setHelmReleases = useSetRecoilState(helmReleaseState)
  const setHostedClustersState = useSetRecoilState(hostedClustersState)
  const setInfraEnvironments = useSetRecoilState(infraEnvironmentsState)
  const setInfrastructure = useSetRecoilState(infrastructuresState)
  const setClaimMappings = useSetRecoilState(claimMappingsState)
  const setIsDirectAuthenticationEnabled = useSetRecoilState(isDirectAuthenticationEnabledState)
  const setIsFineGrainedRbacEnabled = useSetRecoilState(isFineGrainedRbacEnabledState)
  const setIsGlobalHub = useSetRecoilState(isGlobalHubState)
  const setIsHubSelfManaged = useSetRecoilState(isHubSelfManagedState)
  const setlocalHubName = useSetRecoilState(localHubNameState)
  const setMachinePools = useSetRecoilState(machinePoolsState)
  const setManagedClusterAddons = useSetRecoilState(managedClusterAddonsState)
  const setManagedClusterInfos = useSetRecoilState(managedClusterInfosState)
  const setManagedClusterSetBindings = useSetRecoilState(managedClusterSetBindingsState)
  const setManagedClusterSets = useSetRecoilState(managedClusterSetsState)
  const setManagedClusters = useSetRecoilState(managedClustersState)
  const setMultiClusterEngines = useSetRecoilState(multiClusterEnginesState)
  const setMulticlusterRoleAssignments = useSetRecoilState(multiclusterRoleAssignmentState)
  const setNamespaces = useSetRecoilState(namespacesState)
  const setNMStateConfigs = useSetRecoilState(nmStateConfigsState)
  const setNodePoolsState = useSetRecoilState(nodePoolsState)
  const setPlacementBindingsState = useSetRecoilState(placementBindingsState)
  const setPlacementDecisionsState = useSetRecoilState(placementDecisionsState)
  const setPlacementsState = useSetRecoilState(placementsState)
  const setPoliciesState = useSetRecoilState(policiesState)
  const setPolicyAutomationState = useSetRecoilState(policyAutomationState)
  const setPolicyReports = useSetRecoilState(policyreportState)
  const setPolicySetsState = useSetRecoilState(policySetsState)
  const setSearchOperator = useSetRecoilState(searchOperatorState)
  const setSecrets = useSetRecoilState(secretsState)
  const setSettings = useSetRecoilState(settingsState)
  const setServices = useSetRecoilState(servicesState)
  const setStorageClassState = useSetRecoilState(storageClassState)
  const setSubmarinerConfigs = useSetRecoilState(submarinerConfigsState)
  const setSubscriptionOperatorsState = useSetRecoilState(subscriptionOperatorsState)
  const setClusterExtensionsState = useSetRecoilState(clusterExtensionsState)
  const setSubscriptionReportsState = useSetRecoilState(subscriptionReportsState)
  const setSubscriptionsState = useSetRecoilState(subscriptionsState)
  const setUsers = useSetRecoilState(usersState)

  const { setters, mappers, caches } = useMemo(() => {
    const setters: Record<string, Record<string, SetterOrUpdater<any[]>>> = {}

    const mappers: Record<
      string,
      Record<
        string,
        {
          setter: SetterOrUpdater<Record<string, any[]>>
          mcaches: Record<string, Record<string, Record<string, IResource[]>>>
          keyBy: string[]
        }
      >
    > = {}
    const caches: Record<string, Record<string, Record<string, IResource>>> = {}
    const mcaches: Record<string, Record<string, Record<string, IResource[]>>> = {}
    function addSetter(apiVersion: string, kind: string, setter: SetterOrUpdater<any[]>) {
      const groupVersion = apiVersion.split('/')[0]
      if (!setters[groupVersion]) setters[groupVersion] = {}
      setters[groupVersion][kind] = setter
      if (!caches[groupVersion]) caches[groupVersion] = {}
      caches[groupVersion][kind] = {}
    }
    function addMapper(
      apiVersion: string,
      kind: string,
      setter: SetterOrUpdater<Record<string, any[]>>,
      keyBy: string[]
    ) {
      const groupVersion = apiVersion.split('/')[0]
      if (!mappers[groupVersion]) mappers[groupVersion] = {}
      if (!mcaches[groupVersion]) mcaches[groupVersion] = {}
      mcaches[groupVersion][kind] = {}
      mappers[groupVersion][kind] = { setter, mcaches, keyBy }
    }

    // mappers (key=>[values])
    addMapper(ManagedClusterAddOnApiVersion, ManagedClusterAddOnKind, setManagedClusterAddons, ['metadata.namespace'])

    // setters
    addSetter('argoproj.io/v1alpha1', 'ArgoCD', setArgoCDsState)
    addSetter(AgentClusterInstallApiVersion, AgentClusterInstallKind, setAgentClusterInstalls)
    addSetter(AgentKindVersion, AgentKind, setAgents)
    addSetter(AgentMachineApiVersion, AgentMachineKind, setAgentMachinesState)
    addSetter(AgentServiceConfigKindVersion, AgentServiceConfigKind, setAgentServiceConfigs)
    addSetter(AnsibleJobApiVersion, AnsibleJobKind, setAnsibleJobs)
    addSetter(AnsibleJobApiVersion, AnsibleWorkflowKind, setAnsibleWorkflows)
    addSetter(ApplicationApiVersion, ApplicationKind, setApplicationsState)
    addSetter(BareMetalHostApiVersion, BareMetalHostKind, setBareMetalHosts)
    addSetter(CertificateSigningRequestApiVersion, CertificateSigningRequestKind, setCertificateSigningRequests)
    addSetter(ChannelApiVersion, ChannelKind, setChannelsState)
    addSetter(ClusterClaimApiVersion, ClusterClaimKind, setClusterClaims)
    addSetter(ClusterCuratorApiVersion, ClusterCuratorKind, setClusterCurators)
    addSetter(ClusterDeploymentApiVersion, ClusterDeploymentKind, setClusterDeployments)
    addSetter(ClusterImageSetApiVersion, ClusterImageSetKind, setClusterImageSets)
    addSetter(ClusterManagementAddOnApiVersion, ClusterManagementAddOnKind, setClusterManagementAddons)
    addSetter(ClusterPoolApiVersion, ClusterPoolKind, setClusterPools)
    addSetter(ClusterProvisionApiVersion, ClusterProvisionKind, setClusterProvisions)
    addSetter(ClusterVersionApiVersion, ClusterVersionKind, setClusterVerions)
    addSetter(ConfigMapApiVersion, ConfigMapKind, setConfigMaps)
    addSetter(DiscoveredClusterApiVersion, DiscoveredClusterKind, setDiscoveredClusters)
    addSetter(DiscoveryConfigApiVersion, DiscoveryConfigKind, setDiscoveryConfigs)
    addSetter(GitOpsClusterApiVersion, GitOpsClusterKind, setGitOpsClustersState)
    addSetter(HelmReleaseApiVersion, HelmReleaseKind, setHelmReleases)
    addSetter(HostedClusterApiVersion, HostedClusterKind, setHostedClustersState)
    addSetter(InfraEnvApiVersion, InfraEnvKind, setInfraEnvironments)
    addSetter(InfrastructureApiVersion, InfrastructureKind, setInfrastructure)
    addSetter(MachinePoolApiVersion, MachinePoolKind, setMachinePools)
    addSetter(ManagedClusterApiVersion, ManagedClusterKind, setManagedClusters)
    addSetter(ManagedClusterInfoApiVersion, ManagedClusterInfoKind, setManagedClusterInfos)
    addSetter(ManagedClusterSetApiVersion, ManagedClusterSetKind, setManagedClusterSets)
    addSetter(ManagedClusterSetBindingApiVersion, ManagedClusterSetBindingKind, setManagedClusterSetBindings)
    addSetter(MulticlusterRoleAssignmentApiVersion, MulticlusterRoleAssignmentKind, setMulticlusterRoleAssignments)
    addSetter(MultiClusterEngineApiVersion, MultiClusterEngineKind, setMultiClusterEngines)
    addSetter(NamespaceApiVersion, NamespaceKind, setNamespaces)
    addSetter(NMStateConfigApiVersion, NMStateConfigKind, setNMStateConfigs)
    addSetter(NodePoolApiVersion, NodePoolKind, setNodePoolsState)
    addSetter(PlacementApiVersionAlpha, PlacementKind, setPlacementsState)
    addSetter(PlacementBindingApiVersion, PlacementBindingKind, setPlacementBindingsState)
    addSetter(PlacementDecisionApiVersion, PlacementDecisionKind, setPlacementDecisionsState)
    addSetter(PolicyApiVersion, PolicyKind, setPoliciesState)
    addSetter(PolicyAutomationApiVersion, PolicyAutomationKind, setPolicyAutomationState)
    addSetter(PolicyReportApiVersion, PolicyReportKind, setPolicyReports)
    addSetter(PolicySetApiVersion, PolicySetKind, setPolicySetsState)
    addSetter(SearchOperatorApiVersion, SearchOperatorKind, setSearchOperator)
    addSetter(SecretApiVersion, SecretKind, setSecrets)
    addSetter(ServiceApiVersion, ServiceKind, setServices)
    addSetter(StorageClassApiVersion, StorageClassKind, setStorageClassState)
    addSetter(SubmarinerConfigApiVersion, SubmarinerConfigKind, setSubmarinerConfigs)
    addSetter(SubscriptionApiVersion, SubscriptionKind, setSubscriptionsState)
    addSetter(SubscriptionOperatorApiVersion, SubscriptionOperatorKind, setSubscriptionOperatorsState)
    addSetter(ClusterExtensionApiVersion, ClusterExtensionKind, setClusterExtensionsState)
    addSetter(SubscriptionReportApiVersion, SubscriptionReportKind, setSubscriptionReportsState)
    addSetter(UserApiVersion, GroupKind, setGroups)
    addSetter(UserApiVersion, UserKind, setUsers)

    return { setters, mappers, caches }
  }, [
    setAgentClusterInstalls,
    setAgentMachinesState,
    setAgents,
    setAgentServiceConfigs,
    setAnsibleJobs,
    setAnsibleWorkflows,
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
    setClusterVerions,
    setConfigMaps,
    setDiscoveredClusters,
    setDiscoveryConfigs,
    setGitOpsClustersState,
    setGroups,
    setHelmReleases,
    setHostedClustersState,
    setInfraEnvironments,
    setInfrastructure,
    setMachinePools,
    setManagedClusterAddons,
    setManagedClusterInfos,
    setManagedClusterSetBindings,
    setManagedClusterSets,
    setManagedClusters,
    setMultiClusterEngines,
    setMulticlusterRoleAssignments,
    setNamespaces,
    setNMStateConfigs,
    setNodePoolsState,
    setPlacementBindingsState,
    setPlacementDecisionsState,
    setPlacementsState,
    setPoliciesState,
    setPolicyAutomationState,
    setPolicyReports,
    setPolicySetsState,
    setSearchOperator,
    setSecrets,
    setServices,
    setStorageClassState,
    setSubmarinerConfigs,
    setSubscriptionOperatorsState,
    setClusterExtensionsState,
    setSubscriptionReportsState,
    setSubscriptionsState,
    setUsers,
  ])

  const applyWatchEvents = useCallback(
    (watchEvents: WatchEvent[]) => {
      const resourceTypeMap = groupWatchEventsByKind(watchEvents)
      for (const groupVersion in resourceTypeMap) {
        for (const kind in resourceTypeMap[groupVersion]) {
          const kindEvents = resourceTypeMap[groupVersion]?.[kind]
          if (!kindEvents) continue
          const setter = setters[groupVersion]?.[kind]
          if (setter) {
            const cache = caches[groupVersion]?.[kind]
            if (cache) {
              applyWatchEventsToCache(cache, kindEvents)
              if (!isReconnectingRef.current) {
                setter(Object.values(cache))
              }
            }
          } else {
            const mapper = mappers[groupVersion]?.[kind]
            if (mapper) {
              updateMapperCache(mapper, groupVersion, kind, kindEvents)
              if (!isReconnectingRef.current) {
                mapper.setter({ ...mapper.mcaches[groupVersion]?.[kind] })
              }
            }
          }
        }
      }
    },
    [caches, mappers, setters]
  )

  const reset = useCallback(() => {
    isReconnectingRef.current = true
    resetCaches(caches)
    resetMapperCaches(mappers)
    setEventsLoaded(false)
  }, [caches, mappers])

  const flushCachesToRecoil = useCallback(() => {
    for (const groupVersion in setters) {
      for (const kind in setters[groupVersion]) {
        setters[groupVersion][kind](Object.values(caches[groupVersion]?.[kind]))
      }
    }
    for (const groupVersion in mappers) {
      for (const kind in mappers[groupVersion]) {
        const { setter, mcaches } = mappers[groupVersion][kind]
        setter({ ...mcaches[groupVersion]?.[kind] })
      }
    }
  }, [caches, mappers, setters])

  const onEndOfPacket = useCallback(() => {
    if (!isReconnectingRef.current) {
      setLoadStarted(true)
    }
  }, [setLoadStarted])

  const onLoaded = useCallback(
    ({ isReconnecting }: { isReconnecting: boolean }) => {
      if (isReconnecting) {
        flushCachesToRecoil()
        isReconnectingRef.current = false
      }
      setEventsLoaded(true)
    },
    [flushCachesToRecoil]
  )

  const onSettings = useCallback(
    (settings: Record<string, string>) => {
      setSettings(settings)
    },
    [setSettings]
  )

  const {
    data: globalHubRes,
    loading: globalHubLoading,
    startPolling: globalHubStartPoll,
    stopPolling: globalHubStopPoll,
  } = useQuery(
    globalHubQueryFn,
    [
      {
        isGlobalHub: false,
        localHubName: 'local-cluster',
        isHubSelfManaged: undefined,
        authentication: { isDirectAuthenticationEnabled: false },
      },
    ],
    {
      pollInterval: 30,
    }
  )

  // Start all Polls for Global values here
  useEffect(() => {
    globalHubStartPoll()
    return () => {
      // Stop polls on dismount
      globalHubStopPoll()
    }
  }, [globalHubStartPoll, globalHubStopPoll])

  // Update global value setters when data has finished
  const isGlobalHub = useRecoilValue(isGlobalHubState)
  if (globalHubRes && !globalHubLoading && !isGlobalHub) {
    setIsGlobalHub(globalHubRes[0]?.isGlobalHub)
    setlocalHubName(globalHubRes[0]?.localHubName)
    setIsHubSelfManaged(globalHubRes[0]?.isHubSelfManaged)
    setIsDirectAuthenticationEnabled(globalHubRes[0]?.authentication?.isDirectAuthenticationEnabled ?? false)
    setClaimMappings(globalHubRes[0]?.authentication?.claimMappings)
  }

  const {
    data: mchResponse,
    loading: mchLoading,
    startPolling: startMCHPoll,
    stopPolling: stopMCHPoll,
  } = useQuery(mchQueryFn, [], {
    pollInterval: 30,
  })

  // Start all Polls for MCH resource
  useEffect(() => {
    startMCHPoll()
    return () => {
      // Stop polls on dismount
      stopMCHPoll()
    }
  }, [startMCHPoll, stopMCHPoll])

  // Update fine-grained RBAC state from mch response
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)
  if (mchResponse && !mchLoading && !isFineGrainedRbacEnabled) {
    setIsFineGrainedRbacEnabled(mchResponse?.find((e) => e?.name === 'fine-grained-rbac')?.enabled ?? false)
  }

  // If all data not loaded (!loaded) & events data is loaded (eventsLoaded) && global hub value is loaded (!globalHubLoading) -> set loaded to true
  if (!loadCompleted && eventsLoaded && !globalHubLoading) {
    setLoadCompleted(true)
  }

  useEffect(() => {
    function checkLoggedIn() {
      fetch(`${getBackendUrl()}/authenticated`, {
        credentials: 'include',
        headers: { accept: 'application/json' },
      })
        .then((res) => {
          switch (res.status) {
            case 200:
              break
            default:
              /* istanbul ignore if */
              if (process.env.NODE_ENV === 'development' && res.status === 504) {
                window.location.reload()
              } else {
                tokenExpired()
              }
              break
          }
        })
        .catch(() => {
          tokenExpired()
        })
        .finally(() => {
          setTimeout(checkLoggedIn, 30 * 1000)
        })
    }

    if (process.env.MODE !== 'plugin') {
      checkLoggedIn()
    }
  }, [])

  return (
    <LoadDataAbstract
      path="/events"
      driveAppLifecycle
      applyWatchEvents={applyWatchEvents}
      reset={reset}
      onSettings={onSettings}
      onEndOfPacket={onEndOfPacket}
      onLoaded={onLoaded}
    />
  )
}

function resetCaches(caches: Record<string, Record<string, Record<string, IResource>>>) {
  for (const groupVersion in caches) {
    for (const kind in caches[groupVersion]) {
      caches[groupVersion][kind] = {}
    }
  }
}

function resetMapperCaches(
  mappers: Record<
    string,
    Record<
      string,
      {
        setter: SetterOrUpdater<Record<string, any[]>>
        mcaches: Record<string, Record<string, Record<string, IResource[]>>>
        keyBy: string[]
      }
    >
  >
) {
  for (const groupVersion in mappers) {
    for (const kind in mappers[groupVersion]) {
      const { mcaches } = mappers[groupVersion][kind]
      for (const gv in mcaches) {
        for (const k in mcaches[gv]) {
          mcaches[gv][k] = {}
        }
      }
    }
  }
}

function updateMapperCache(
  mapper: {
    setter: SetterOrUpdater<Record<string, any[]>>
    mcaches: Record<string, Record<string, Record<string, IResource[]>>>
    keyBy: string[]
  },
  groupVersion: string,
  kind: string,
  watchEvents: WatchEvent[]
) {
  const { mcaches, keyBy } = mapper
  const map = mcaches[groupVersion]?.[kind]
  for (const watchEvent of watchEvents) {
    const key = keyBy
      .reduce((keys, partKey) => {
        keys.push(get(watchEvent.object, partKey))
        return keys
      }, [] as string[])
      .join('/')
    map[key] = [...(map[key] || [])]
    const arr = map[key]
    const index = arr.findIndex(
      (resource) =>
        resource.metadata?.name === watchEvent.object.metadata.name &&
        resource.metadata?.namespace === watchEvent.object.metadata.namespace
    )
    switch (watchEvent.type) {
      case 'ADDED':
      case 'MODIFIED':
        if (index !== -1) arr[index] = watchEvent.object
        else arr.push(watchEvent.object)
        break
      case 'DELETED':
        if (index !== -1) arr.splice(index, 1)
        break
    }
  }
}

// Query for GlobalHub check and name
const globalHubQueryFn = () => {
  return getRequest<{
    isGlobalHub: boolean
    localHubName: string
    isHubSelfManaged: boolean | undefined
    authentication: {
      isDirectAuthenticationEnabled: boolean
      claimMappings?: ClaimMappings
    }
  }>(getBackendUrl() + '/hub')
}

// Query for GlobalHub check and name
const mchQueryFn = () => {
  return getRequest<MultiClusterHubComponent[] | undefined>(getBackendUrl() + '/multiclusterhub/components')
}
