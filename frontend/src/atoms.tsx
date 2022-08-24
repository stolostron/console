/* Copyright Contributors to the Open Cluster Management project */
import { noop } from 'lodash'
import {
    AgentClusterInstallK8sResource,
    AgentK8sResource,
    AgentMachineK8sResource,
    BareMetalHostK8sResource,
    HostedClusterK8sResource,
    InfraEnvK8sResource,
    InfrastructureK8sResource,
    NMStateK8sResource,
    NodePoolK8sResource,
} from 'openshift-assisted-ui-lib/cim'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import { atom, SetterOrUpdater, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { LoadingPage } from './components/LoadingPage'
import {
    AgentClusterInstallApiVersion,
    AgentClusterInstallKind,
    AgentKind,
    AgentKindVersion,
    AgentMachineApiVersion,
    AgentMachineKind,
    AnsibleJob,
    AnsibleJobApiVersion,
    AnsibleJobKind,
    Application,
    ApplicationApiVersion,
    ApplicationKind,
    ApplicationSet,
    ApplicationSetApiVersion,
    ApplicationSetKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    BareMetalAsset,
    BareMetalAssetApiVersion,
    BareMetalAssetKind,
    BareMetalHostApiVersion,
    BareMetalHostKind,
    CertificateSigningRequest,
    CertificateSigningRequestApiVersion,
    CertificateSigningRequestKind,
    Channel,
    ChannelApiVersion,
    ChannelKind,
    ClusterClaim,
    ClusterClaimApiVersion,
    ClusterClaimKind,
    ClusterCurator,
    ClusterCuratorApiVersion,
    ClusterCuratorKind,
    ClusterDeployment,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
    ClusterImageSet,
    ClusterImageSetApiVersion,
    ClusterImageSetKind,
    ClusterManagementAddOn,
    ClusterManagementAddOnApiVersion,
    ClusterManagementAddOnKind,
    ClusterPool,
    ClusterPoolApiVersion,
    ClusterPoolKind,
    ClusterProvision,
    ClusterProvisionApiVersion,
    ClusterProvisionKind,
    ConfigMap,
    ConfigMapApiVersion,
    ConfigMapKind,
    CustomResourceDefinition,
    CustomResourceDefinitionApiVersion,
    CustomResourceDefinitionKind,
    DiscoveredCluster,
    DiscoveredClusterApiVersion,
    DiscoveredClusterKind,
    DiscoveryConfig,
    DiscoveryConfigApiVersion,
    DiscoveryConfigKind,
    fetchGet,
    getBackendUrl,
    GitOpsCluster,
    GitOpsClusterApiVersion,
    GitOpsClusterKind,
    HelmRelease,
    HelmReleaseApiVersion,
    HelmReleaseKind,
    HostedClusterApiVersion,
    HostedClusterKind,
    InfraEnvApiVersion,
    InfraEnvKind,
    InfrastructureApiVersion,
    InfrastructureKind,
    IResource,
    MachinePool,
    MachinePoolApiVersion,
    MachinePoolKind,
    ManagedCluster,
    ManagedClusterAddOn,
    ManagedClusterAddOnApiVersion,
    ManagedClusterAddOnKind,
    ManagedClusterApiVersion,
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
    ManagedClusterKind,
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetBinding,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetBindingKind,
    ManagedClusterSetKind,
    MultiClusterEngine,
    MultiClusterEngineApiVersion,
    MultiClusterEngineKind,
    MultiClusterHub,
    MultiClusterHubApiVersion,
    MultiClusterHubKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    NMStateConfigApiVersion,
    NMStateConfigKind,
    NodePoolApiVersion,
    NodePoolKind,
    OCPAppResource,
    Placement,
    PlacementApiVersionAlpha,
    PlacementBinding,
    PlacementBindingApiVersion,
    PlacementBindingKind,
    PlacementDecision,
    PlacementDecisionApiVersion,
    PlacementDecisionKind,
    PlacementKind,
    PlacementRule,
    PlacementRuleApiVersion,
    PlacementRuleKind,
    Policy,
    PolicyApiVersion,
    PolicyAutomation,
    PolicyAutomationApiVersion,
    PolicyAutomationKind,
    PolicyKind,
    PolicyReport,
    PolicyReportApiVersion,
    PolicyReportKind,
    PolicySet,
    PolicySetApiVersion,
    PolicySetKind,
    Secret,
    SecretApiVersion,
    SecretKind,
    SubmarinerConfig,
    SubmarinerConfigApiVersion,
    SubmarinerConfigKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
    SubscriptionOperator,
    SubscriptionOperatorApiVersion,
    SubscriptionOperatorKind,
    SubscriptionReport,
    SubscriptionReportApiVersion,
    SubscriptionReportKind,
    UserPreference,
    UserPreferenceApiVersion,
    UserPreferenceKind,
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
export const ansibleJobState = AtomArray<AnsibleJob>()
export const appProjectsState = AtomArray<IResource>()
export const applicationSetsState = AtomArray<ApplicationSet>()
export const applicationsState = AtomArray<Application>()
export const argoApplicationsState = AtomArray<ArgoApplication>()
export const argoCDsState = AtomArray<IResource>()
export const bareMetalAssetsState = AtomArray<BareMetalAsset>()
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
export const submarinerConfigsState = AtomArray<SubmarinerConfig>()
export const subscriptionsState = AtomArray<Subscription>()
export const subscriptionOperatorsState = AtomArray<SubscriptionOperator>()
export const subscriptionReportsState = AtomArray<SubscriptionReport>()
export const userPreferencesState = AtomArray<UserPreference>()
export const hostedClustersState = AtomArray<HostedClusterK8sResource>()
export const nodePoolsState = AtomArray<NodePoolK8sResource>()
export const agentMachinesState = AtomArray<AgentMachineK8sResource>()
export const customResourceDefinitionsState = AtomArray<CustomResourceDefinition>()

export let globalCustomResourceDefinitions: CustomResourceDefinition[] = []

export const settingsState = atom<Settings>({ key: 'settings', default: {} })

export interface Settings {
    LOG_LEVEL?: string
    SAVED_SEARCH_LIMIT?: string
    ansibleIntegration?: 'enabled' | 'disabled'
    singleNodeOpenshift?: 'enabled' | 'disabled'
    awsPrivateWizardStep?: 'enabled' | 'disabled'
}

interface WatchEvent {
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

type ServerSideEventData = WatchEvent | SettingsEvent | { type: 'START' | 'LOADED' }

export function LoadData(props: { children?: ReactNode }) {
    const [loading, setLoading] = useState(true)
    const setAgentClusterInstalls = useSetRecoilState(agentClusterInstallsState)
    const setAgents = useSetRecoilState(agentsState)
    const setAnsibleJobs = useSetRecoilState(ansibleJobState)
    const setAppProjectsState = useSetRecoilState(appProjectsState)
    const setApplicationSetsState = useSetRecoilState(applicationSetsState)
    const setApplicationsState = useSetRecoilState(applicationsState)
    const setArgoApplicationsState = useSetRecoilState(argoApplicationsState)
    const setArgoCDsState = useSetRecoilState(argoCDsState)
    const setBareMetalAssets = useSetRecoilState(bareMetalAssetsState)
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
    const setMultiClusterHubs = useSetRecoilState(multiClusterHubState)
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
    const setSecrets = useSetRecoilState(secretsState)
    const setSettings = useSetRecoilState(settingsState)
    const setSubmarinerConfigs = useSetRecoilState(submarinerConfigsState)
    const setSubscriptionsState = useSetRecoilState(subscriptionsState)
    const setSubscriptionOperatorsState = useSetRecoilState(subscriptionOperatorsState)
    const setSubscriptionReportsState = useSetRecoilState(subscriptionReportsState)
    const setUserPreferencesState = useSetRecoilState(userPreferencesState)
    const setHostedClustersState = useSetRecoilState(hostedClustersState)
    const setNodePoolsState = useSetRecoilState(nodePoolsState)
    const setAgentMachinesState = useSetRecoilState(agentMachinesState)

    const [customResourceDefinitions, setCustomResourceDefinitionsState] =
        useRecoilState(customResourceDefinitionsState)
    useEffect(() => {
        globalCustomResourceDefinitions = customResourceDefinitions
    }, [customResourceDefinitions])

    const setters: Record<string, Record<string, SetterOrUpdater<any[]>>> = useMemo(() => {
        const setters: Record<string, Record<string, SetterOrUpdater<any[]>>> = {}
        function addSetter(apiVersion: string, kind: string, setter: SetterOrUpdater<any[]>) {
            const groupVersion = apiVersion.split('/')[0]
            if (!setters[groupVersion]) setters[groupVersion] = {}
            setters[groupVersion][kind] = setter
        }
        addSetter(AgentClusterInstallApiVersion, AgentClusterInstallKind, setAgentClusterInstalls)
        addSetter(ApplicationApiVersion, ApplicationKind, setApplicationsState)
        addSetter(ChannelApiVersion, ChannelKind, setChannelsState)
        addSetter(PlacementApiVersionAlpha, PlacementKind, setPlacementsState)
        addSetter(PlacementRuleApiVersion, PlacementRuleKind, setPlacementRulesState)
        addSetter(PlacementDecisionApiVersion, PlacementDecisionKind, setPlacementDecisionsState)
        addSetter(SubscriptionApiVersion, SubscriptionKind, setSubscriptionsState)
        addSetter(SubscriptionOperatorApiVersion, SubscriptionOperatorKind, setSubscriptionOperatorsState)
        addSetter(SubscriptionReportApiVersion, SubscriptionReportKind, setSubscriptionReportsState)
        addSetter(GitOpsClusterApiVersion, GitOpsClusterKind, setGitOpsClustersState)
        addSetter('argoproj.io/v1alpha1', 'appProjects', setAppProjectsState)
        addSetter(ApplicationSetApiVersion, ApplicationSetKind, setApplicationSetsState)
        addSetter(ArgoApplicationApiVersion, ArgoApplicationKind, setArgoApplicationsState)
        addSetter('argoproj.io/v1alpha1', 'argoCDs', setArgoCDsState)
        addSetter(AgentKindVersion, AgentKind, setAgents)
        addSetter(AnsibleJobApiVersion, AnsibleJobKind, setAnsibleJobs)
        addSetter(BareMetalAssetApiVersion, BareMetalAssetKind, setBareMetalAssets)
        addSetter(BareMetalHostApiVersion, BareMetalHostKind, setBareMetalHosts)
        addSetter(CertificateSigningRequestApiVersion, CertificateSigningRequestKind, setCertificateSigningRequests)
        addSetter(ClusterClaimApiVersion, ClusterClaimKind, setClusterClaims)
        addSetter(ClusterCuratorApiVersion, ClusterCuratorKind, setClusterCurators)
        addSetter(ClusterDeploymentApiVersion, ClusterDeploymentKind, setClusterDeployments)
        addSetter(ClusterImageSetApiVersion, ClusterImageSetKind, setClusterImageSets)
        addSetter(ClusterManagementAddOnApiVersion, ClusterManagementAddOnKind, setClusterManagementAddons)
        addSetter(ClusterPoolApiVersion, ClusterPoolKind, setClusterPools)
        addSetter(ClusterProvisionApiVersion, ClusterProvisionKind, setClusterProvisions)
        addSetter(ConfigMapApiVersion, ConfigMapKind, setConfigMaps)
        addSetter(DiscoveredClusterApiVersion, DiscoveredClusterKind, setDiscoveredClusters)
        addSetter(DiscoveryConfigApiVersion, DiscoveryConfigKind, setDiscoveryConfigs)
        addSetter(HelmReleaseApiVersion, HelmReleaseKind, setHelmReleases)
        addSetter(InfraEnvApiVersion, InfraEnvKind, setInfraEnvironments)
        addSetter(InfrastructureApiVersion, InfrastructureKind, setInfrastructure)
        addSetter(MachinePoolApiVersion, MachinePoolKind, setMachinePools)
        addSetter(ManagedClusterAddOnApiVersion, ManagedClusterAddOnKind, setManagedClusterAddons)
        addSetter(ManagedClusterApiVersion, ManagedClusterKind, setManagedClusters)
        addSetter(ManagedClusterInfoApiVersion, ManagedClusterInfoKind, setManagedClusterInfos)
        addSetter(ManagedClusterSetApiVersion, ManagedClusterSetKind, setManagedClusterSets)
        addSetter(ManagedClusterSetBindingApiVersion, ManagedClusterSetBindingKind, setManagedClusterSetBindings)
        addSetter(MultiClusterHubApiVersion, MultiClusterHubKind, setMultiClusterHubs)
        addSetter(MultiClusterEngineApiVersion, MultiClusterEngineKind, setMultiClusterEngines)
        addSetter(NamespaceApiVersion, NamespaceKind, setNamespaces)
        addSetter(NMStateConfigApiVersion, NMStateConfigKind, setNMStateConfigs)
        addSetter(PolicyApiVersion, PolicyKind, setPoliciesState)
        addSetter(PolicyAutomationApiVersion, PolicyAutomationKind, setPolicyAutomationState)
        addSetter(PolicySetApiVersion, PolicySetKind, setPolicySetsState)
        addSetter(PlacementBindingApiVersion, PlacementBindingKind, setPlacementBindingsState)
        addSetter(PolicyReportApiVersion, PolicyReportKind, setPolicyReports)
        addSetter(SecretApiVersion, SecretKind, setSecrets)
        addSetter(SubmarinerConfigApiVersion, SubmarinerConfigKind, setSubmarinerConfigs)
        addSetter(UserPreferenceApiVersion, UserPreferenceKind, setUserPreferencesState)
        addSetter(HostedClusterApiVersion, HostedClusterKind, setHostedClustersState)
        addSetter(NodePoolApiVersion, NodePoolKind, setNodePoolsState)
        addSetter(AgentMachineApiVersion, AgentMachineKind, setAgentMachinesState)
        addSetter(CustomResourceDefinitionApiVersion, CustomResourceDefinitionKind, setCustomResourceDefinitionsState)
        return setters
    }, [
        setAgentClusterInstalls,
        setAgents,
        setAnsibleJobs,
        setAppProjectsState,
        setApplicationSetsState,
        setApplicationsState,
        setArgoApplicationsState,
        setArgoCDsState,
        setBareMetalAssets,
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
        setMultiClusterHubs,
        setMultiClusterEngines,
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
        setSecrets,
        setSubmarinerConfigs,
        setSubscriptionReportsState,
        setSubscriptionsState,
        setSubscriptionOperatorsState,
        setUserPreferencesState,
        setHostedClustersState,
        setNodePoolsState,
        setAgentMachinesState,
        setCustomResourceDefinitionsState,
    ])

    useEffect(() => {
        const eventQueue: WatchEvent[] = []

        function processEventQueue() {
            if (eventQueue.length === 0) return

            const resourceTypeMap = eventQueue?.reduce((resourceTypeMap, eventData) => {
                const apiVersion = eventData.object.apiVersion
                const groupVersion = apiVersion.split('/')[0]
                const kind = eventData.object.kind
                if (!resourceTypeMap[groupVersion]) resourceTypeMap[groupVersion] = {}
                if (!resourceTypeMap[groupVersion][kind]) resourceTypeMap[groupVersion][kind] = []
                resourceTypeMap[groupVersion][kind].push(eventData)
                return resourceTypeMap
            }, {} as Record<string, Record<string, WatchEvent[]>>)
            eventQueue.length = 0

            for (const groupVersion in resourceTypeMap) {
                for (const kind in resourceTypeMap[groupVersion]) {
                    const setter = setters[groupVersion]?.[kind]
                    if (setter) {
                        setter((resources) => {
                            const newResources = [...resources]
                            const watchEvents = resourceTypeMap[groupVersion]?.[kind]
                            if (watchEvents) {
                                for (const watchEvent of watchEvents) {
                                    const index = newResources.findIndex(
                                        (resource) =>
                                            resource.metadata?.name === watchEvent.object.metadata.name &&
                                            resource.metadata?.namespace === watchEvent.object.metadata.namespace
                                    )
                                    switch (watchEvent.type) {
                                        case 'ADDED':
                                        case 'MODIFIED':
                                            if (index !== -1) newResources[index] = watchEvent.object
                                            else newResources.push(watchEvent.object)
                                            break
                                        case 'DELETED':
                                            if (index !== -1) newResources.splice(index, 1)
                                            break
                                    }
                                }
                            }
                            return newResources
                        })
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
                        case 'LOADED':
                            setLoading((loading) => {
                                if (loading) {
                                    processEventQueue()
                                }
                                return false
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

        const timeout = setInterval(processEventQueue, THROTTLE_EVENTS_DELAY)
        return () => {
            clearInterval(timeout)
            if (evtSource) evtSource.close()
        }
    }, [setSettings, setters])

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
        checkLoggedIn()
    }, [])

    const children = useMemo(() => <Fragment>{props.children}</Fragment>, [props.children])

    if (loading || getBackendUrl() === undefined) return <LoadingPage />

    return children
}

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

export async function tokenExpired() {
    if (process.env.NODE_ENV === 'production') {
        logout()
    } else {
        window.location.href = `${getBackendUrl()}/login`
    }
}

export async function logout() {
    const tokenEndpointResult = await fetchGet<{ token_endpoint: string }>(getBackendUrl() + '/configure')
    await fetchGet(getBackendUrl() + '/logout').catch(noop)

    const iframe = document.createElement('iframe')
    iframe.setAttribute('type', 'hidden')
    iframe.name = 'hidden-form'
    document.body.appendChild(iframe)

    const form = document.createElement('form')
    form.method = 'POST'
    form.target = 'hidden-form'
    const url = new URL(tokenEndpointResult.data.token_endpoint)
    form.action = `${url.protocol}//${url.host}/logout`
    document.body.appendChild(form)

    form.submit()

    await new Promise((resolve) => setTimeout(resolve, 500))

    location.pathname = '/'
}
