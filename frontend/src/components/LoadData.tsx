/* Copyright Contributors to the Open Cluster Management project */
import get from 'lodash/get'
import { Fragment, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
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
} from '../resources'
import { getBackendUrl, getRequest } from '../resources/utils'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
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
  isGlobalHubState,
  isHubSelfManagedState,
  localHubNameState,
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
  ServerSideEventData,
  settingsState,
  storageClassState,
  submarinerConfigsState,
  subscriptionOperatorsState,
  subscriptionReportsState,
  subscriptionsState,
  WatchEvent,
} from '../atoms'
import { useQuery } from '../lib/useQuery'
import { PluginDataContext } from '../lib/PluginDataContext'

export function LoadData(props: { children?: ReactNode }) {
  const { loadCompleted, setLoadStarted, setLoadCompleted } = useContext(PluginDataContext)
  const [eventsLoaded, setEventsLoaded] = useState(false)

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
  const setClusterVerions = useSetRecoilState(clusterVersionState)
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
  const setSettings = useSetRecoilState(settingsState)
  const setSubmarinerConfigs = useSetRecoilState(submarinerConfigsState)
  const setSubscriptionsState = useSetRecoilState(subscriptionsState)
  const setSubscriptionOperatorsState = useSetRecoilState(subscriptionOperatorsState)
  const setSubscriptionReportsState = useSetRecoilState(subscriptionReportsState)
  const setStorageClassState = useSetRecoilState(storageClassState)
  const setHostedClustersState = useSetRecoilState(hostedClustersState)
  const setNodePoolsState = useSetRecoilState(nodePoolsState)
  const setAgentMachinesState = useSetRecoilState(agentMachinesState)
  const setIsGlobalHub = useSetRecoilState(isGlobalHubState)
  const setlocalHubName = useSetRecoilState(localHubNameState)
  const setIsHubSelfManaged = useSetRecoilState(isHubSelfManagedState)

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
    addSetter(AgentClusterInstallApiVersion, AgentClusterInstallKind, setAgentClusterInstalls)
    addSetter(AgentServiceConfigKindVersion, AgentServiceConfigKind, setAgentServiceConfigs)
    addSetter(ApplicationApiVersion, ApplicationKind, setApplicationsState)
    addSetter(ChannelApiVersion, ChannelKind, setChannelsState)
    addSetter(PlacementApiVersionAlpha, PlacementKind, setPlacementsState)
    addSetter(PlacementRuleApiVersion, PlacementRuleKind, setPlacementRulesState)
    addSetter(PlacementDecisionApiVersion, PlacementDecisionKind, setPlacementDecisionsState)
    addSetter(SubscriptionApiVersion, SubscriptionKind, setSubscriptionsState)
    addSetter(SubscriptionOperatorApiVersion, SubscriptionOperatorKind, setSubscriptionOperatorsState)
    addSetter(SubscriptionReportApiVersion, SubscriptionReportKind, setSubscriptionReportsState)
    addSetter(GitOpsClusterApiVersion, GitOpsClusterKind, setGitOpsClustersState)
    addSetter('argoproj.io/v1alpha1', 'ArgoCD', setArgoCDsState)
    addSetter(AgentKindVersion, AgentKind, setAgents)
    addSetter(AnsibleJobApiVersion, AnsibleJobKind, setAnsibleJobs)
    addSetter(BareMetalHostApiVersion, BareMetalHostKind, setBareMetalHosts)
    addSetter(CertificateSigningRequestApiVersion, CertificateSigningRequestKind, setCertificateSigningRequests)
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
    addSetter(HelmReleaseApiVersion, HelmReleaseKind, setHelmReleases)
    addSetter(InfraEnvApiVersion, InfraEnvKind, setInfraEnvironments)
    addSetter(InfrastructureApiVersion, InfrastructureKind, setInfrastructure)
    addSetter(MachinePoolApiVersion, MachinePoolKind, setMachinePools)
    addSetter(ManagedClusterApiVersion, ManagedClusterKind, setManagedClusters)
    addSetter(ManagedClusterInfoApiVersion, ManagedClusterInfoKind, setManagedClusterInfos)
    addSetter(ManagedClusterSetApiVersion, ManagedClusterSetKind, setManagedClusterSets)
    addSetter(ManagedClusterSetBindingApiVersion, ManagedClusterSetBindingKind, setManagedClusterSetBindings)
    addSetter(MultiClusterEngineApiVersion, MultiClusterEngineKind, setMultiClusterEngines)
    addSetter(
      MulticlusterApplicationSetReportApiVersion,
      MulticlusterApplicationSetReportKind,
      setMulticlusterApplicationSetReportState
    )
    addSetter(NamespaceApiVersion, NamespaceKind, setNamespaces)
    addSetter(NMStateConfigApiVersion, NMStateConfigKind, setNMStateConfigs)
    addSetter(PolicyApiVersion, PolicyKind, setPoliciesState)
    addSetter(PolicyAutomationApiVersion, PolicyAutomationKind, setPolicyAutomationState)
    addSetter(PolicySetApiVersion, PolicySetKind, setPolicySetsState)
    addSetter(PlacementBindingApiVersion, PlacementBindingKind, setPlacementBindingsState)
    addSetter(PolicyReportApiVersion, PolicyReportKind, setPolicyReports)
    addSetter(SearchOperatorApiVersion, SearchOperatorKind, setSearchOperator)
    addSetter(SecretApiVersion, SecretKind, setSecrets)
    addSetter(StorageClassApiVersion, StorageClassKind, setStorageClassState)
    addSetter(SubmarinerConfigApiVersion, SubmarinerConfigKind, setSubmarinerConfigs)
    addSetter(HostedClusterApiVersion, HostedClusterKind, setHostedClustersState)
    addSetter(NodePoolApiVersion, NodePoolKind, setNodePoolsState)
    addSetter(AgentMachineApiVersion, AgentMachineKind, setAgentMachinesState)
    return { setters, mappers, caches }
  }, [
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
    setClusterVerions,
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

  useEffect(() => {
    const eventQueue: WatchEvent[] = []

    function processEventQueue() {
      if (eventQueue.length === 0) return

      const resourceTypeMap = eventQueue?.reduce(
        (resourceTypeMap, eventData) => {
          const apiVersion = eventData.object.apiVersion
          const groupVersion = apiVersion.split('/')[0]
          const kind = eventData.object.kind
          if (!resourceTypeMap[groupVersion]) resourceTypeMap[groupVersion] = {}
          if (!resourceTypeMap[groupVersion][kind]) resourceTypeMap[groupVersion][kind] = []
          resourceTypeMap[groupVersion][kind].push(eventData)
          return resourceTypeMap
        },
        {} as Record<string, Record<string, WatchEvent[]>>
      )
      eventQueue.length = 0

      for (const groupVersion in resourceTypeMap) {
        for (const kind in resourceTypeMap[groupVersion]) {
          const watchEvents = resourceTypeMap[groupVersion]?.[kind]
          if (watchEvents) {
            const setter = setters[groupVersion]?.[kind]
            if (setter) {
              setter(() => {
                const cache = caches[groupVersion]?.[kind]
                for (const watchEvent of watchEvents) {
                  const key = `${watchEvent.object.metadata.namespace}/${watchEvent.object.metadata.name}`
                  switch (watchEvent.type) {
                    case 'ADDED':
                    case 'MODIFIED':
                      cache[key] = watchEvent.object
                      break
                    case 'DELETED':
                      delete cache[key]
                      break
                  }
                }
                return Object.values(cache)
              })
            } else {
              const mapper = mappers[groupVersion]?.[kind]
              if (mapper) {
                const { setter, mcaches, keyBy } = mapper
                setter(() => {
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
                  return { ...map }
                })
              }
            }
          }
        }
      }
    }

    function processMessage(event: MessageEvent) {
      if (event.data) {
        try {
          const data = JSON.parse(event.data) as ServerSideEventData
          switch (data.type) {
            case 'ADDED':
            case 'MODIFIED':
            case 'DELETED':
              eventQueue.push(data)
              break
            case 'START':
              eventQueue.length = 0
              break
            // instead of waiting for entire backend data to load
            // data is broken up into packets with list resources first
            // tables show skeleton until firs packet is received
            // then list grows as subsequent packets packets are received
            case 'EOP': // END OF A PACKET
              setLoadStarted(() => {
                processEventQueue()
                return true
              })
              break
            case 'LOADED':
              setEventsLoaded((eventsLoaded) => {
                if (!eventsLoaded) {
                  processEventQueue()
                }
                return true
              })
              break
            case 'SETTINGS':
              setSettings(data.settings)
              break
          }
        } catch (err) {
          console.error(err)
        }
      }
    }

    let evtSource: EventSource | undefined
    function startWatch() {
      evtSource = new EventSource(`${getBackendUrl()}/events`, { withCredentials: true })
      evtSource.onmessage = processMessage
      evtSource.onerror = function () {
        console.log('EventSource', 'error', 'readyState', evtSource?.readyState)
        switch (evtSource?.readyState) {
          case EventSource.CLOSED:
            setTimeout(() => {
              startWatch()
            }, 1000)
            break
        }
      }
    }
    startWatch()

    const timeout = setInterval(processEventQueue, 500)
    return () => {
      clearInterval(timeout)
      if (evtSource) evtSource.close()
    }
    // this effect must only run once--it sets up the call to /events on the backend
    // which should only ever be called once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const {
    data: globalHubRes,
    loading: globalHubLoading,
    startPolling: globalHubStartPoll,
    stopPolling: globalHubStopPoll,
  } = useQuery(globalHubQueryFn, [{ isGlobalHub: false, localHubName: 'local-cluster', isHubSelfManaged: undefined }], {
    pollInterval: 30,
  })

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
              tokenExpired()
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

  const children = useMemo(() => <Fragment>{props.children}</Fragment>, [props.children])

  return children
}

// Query for GlobalHub check and name
const globalHubQueryFn = () => {
  return getRequest<{
    isGlobalHub: boolean
    localHubName: string
    isHubSelfManaged: boolean | undefined
  }>(getBackendUrl() + '/hub')
}
