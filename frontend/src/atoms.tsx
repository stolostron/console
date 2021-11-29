/* Copyright Contributors to the Open Cluster Management project */
import { AcmRoute } from '@open-cluster-management/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import { atom, SetterOrUpdater, useRecoilState } from 'recoil'
import { LoadingPage } from './components/LoadingPage'
import {
    getBackendUrl,
    AgentClusterInstallApiVersion,
    AgentClusterInstallKind,
    AgentClusterInstallVersion,
    AgentKind,
    AgentKindVersion,
    AnsibleJob,
    AnsibleJobApiVersion,
    AnsibleJobKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    Application,
    ApplicationApiVersion,
    ApplicationKind,
    ApplicationSet,
    ApplicationSetApiVersion,
    ApplicationSetKind,
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
    DiscoveredCluster,
    DiscoveredClusterApiVersion,
    DiscoveredClusterKind,
    DiscoveryConfig,
    DiscoveryConfigApiVersion,
    DiscoveryConfigKind,
    GitOpsCluster,
    GitOpsClusterApiVersion,
    GitOpsClusterKind,
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
    MultiClusterHub,
    MultiClusterHubApiVersion,
    MultiClusterHubKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    Placement,
    PlacementApiVersion,
    PlacementKind,
    PlacementRule,
    PlacementRuleApiVersion,
    PlacementRuleKind,
    PolicyReport,
    PolicyReportApiVersion,
    PolicyReportKind,
    Secret,
    SecretApiVersion,
    SecretKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
    SubmarinerConfig,
    SubmarinerConfigApiVersion,
    SubmarinerConfigKind,
} from './resources'
import { PlacementBinding, PlacementBindingApiVersion, PlacementBindingKind } from './resources/placement-binding'
import { Policy, PolicyApiVersion, PolicyKind } from './resources/policy'

let atomArrayKey = 0
function AtomArray<T>() {
    return atom<T[]>({ key: (++atomArrayKey).toString(), default: [] })
}

export const acmRouteState = atom<AcmRoute>({ key: 'acmRoute', default: '' as AcmRoute })

export const agentClusterInstallsState = AtomArray<CIM.AgentClusterInstallK8sResource>()
export const agentsState = AtomArray<CIM.AgentK8sResource>()
export const ansibleJobState = AtomArray<AnsibleJob>()
export const appProjectsState = AtomArray<IResource>()
export const applicationSetsState = AtomArray<ApplicationSet>()
export const applicationsState = AtomArray<Application>()
export const argoApplicationsState = AtomArray<ArgoApplication>()
export const argoCDsState = AtomArray<IResource>()
export const bareMetalAssetsState = AtomArray<BareMetalAsset>()
export const bareMetalHostsState = AtomArray<CIM.BareMetalHostK8sResource>()
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
export const infraEnvironmentsState = AtomArray<CIM.InfraEnvK8sResource>()
export const infrastructuresState = AtomArray<CIM.InfrastructureK8sResource>()
export const machinePoolsState = AtomArray<MachinePool>()
export const managedClusterAddonsState = AtomArray<ManagedClusterAddOn>()
export const managedClusterInfosState = AtomArray<ManagedClusterInfo>()
export const managedClusterSetBindingsState = AtomArray<ManagedClusterSetBinding>()
export const managedClusterSetsState = AtomArray<ManagedClusterSet>()
export const managedClustersState = AtomArray<ManagedCluster>()
export const multiClusterHubState = AtomArray<MultiClusterHub>()
export const namespacesState = AtomArray<Namespace>()
export const policiesState = AtomArray<Policy>()
export const placementBindingsState = AtomArray<PlacementBinding>()
export const placementsState = AtomArray<Placement>()
export const placementRulesState = AtomArray<PlacementRule>()
export const policyreportState = AtomArray<PolicyReport>()
export const secretsState = AtomArray<Secret>()
export const submarinerConfigsState = AtomArray<SubmarinerConfig>()
export const subscriptionsState = AtomArray<Subscription>()

export const settingsState = atom<Settings>({ key: 'settings', default: {} })

interface Settings {
    LOG_LEVEL?: string
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
    const [, setAgentClusterInstalls] = useRecoilState(agentClusterInstallsState)
    const [, setAgents] = useRecoilState(agentsState)
    const [, setAnsibleJobs] = useRecoilState(ansibleJobState)
    const [, setAppProjectsState] = useRecoilState(appProjectsState)
    const [, setApplicationSetsState] = useRecoilState(applicationSetsState)
    const [, setApplicationsState] = useRecoilState(applicationsState)
    const [, setArgoApplicationsState] = useRecoilState(argoApplicationsState)
    const [, setArgoCDsState] = useRecoilState(argoCDsState)
    const [, setBareMetalAssets] = useRecoilState(bareMetalAssetsState)
    const [, setBareMetalHosts] = useRecoilState(bareMetalHostsState)
    const [, setCertificateSigningRequests] = useRecoilState(certificateSigningRequestsState)
    const [, setChannelsState] = useRecoilState(channelsState)
    const [, setClusterClaims] = useRecoilState(clusterClaimsState)
    const [, setClusterCurators] = useRecoilState(clusterCuratorsState)
    const [, setClusterDeployments] = useRecoilState(clusterDeploymentsState)
    const [, setClusterImageSets] = useRecoilState(clusterImageSetsState)
    const [, setClusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
    const [, setClusterPools] = useRecoilState(clusterPoolsState)
    const [, setClusterProvisions] = useRecoilState(clusterProvisionsState)
    const [, setConfigMaps] = useRecoilState(configMapsState)
    const [, setDiscoveredClusters] = useRecoilState(discoveredClusterState)
    const [, setDiscoveryConfigs] = useRecoilState(discoveryConfigState)
    const [, setGitOpsClustersState] = useRecoilState(gitOpsClustersState)
    const [, setInfraEnvironments] = useRecoilState(infraEnvironmentsState)
    const [, setInfrastructure] = useRecoilState(infrastructuresState)
    const [, setMachinePools] = useRecoilState(machinePoolsState)
    const [, setManagedClusterAddons] = useRecoilState(managedClusterAddonsState)
    const [, setManagedClusterInfos] = useRecoilState(managedClusterInfosState)
    const [, setManagedClusterSetBindings] = useRecoilState(managedClusterSetBindingsState)
    const [, setManagedClusterSets] = useRecoilState(managedClusterSetsState)
    const [, setManagedClusters] = useRecoilState(managedClustersState)
    const [, setMultiClusterHubs] = useRecoilState(multiClusterHubState)
    const [, setNamespaces] = useRecoilState(namespacesState)
    const [, setPoliciesState] = useRecoilState(policiesState)
    const [, setPlacementBindingsState] = useRecoilState(placementBindingsState)
    const [, setPlacementsState] = useRecoilState(placementsState)
    const [, setPlacementRulesState] = useRecoilState(placementRulesState)
    const [, setPolicyReports] = useRecoilState(policyreportState)
    const [, setSecrets] = useRecoilState(secretsState)
    const [, setSettings] = useRecoilState(settingsState)
    const [, setSubmarinerConfigs] = useRecoilState(submarinerConfigsState)
    const [, setSubscriptionsState] = useRecoilState(subscriptionsState)

    const setters: Record<string, Record<string, SetterOrUpdater<any[]>>> = useMemo(() => {
        const setters: Record<string, Record<string, SetterOrUpdater<any[]>>> = {}
        function addSetter(apiVersion: string, kind: string, setter: SetterOrUpdater<any[]>) {
            if (!setters[apiVersion]) setters[apiVersion] = {}
            setters[apiVersion][kind] = setter
        }
        addSetter(AgentClusterInstallApiVersion, AgentClusterInstallKind, setAgentClusterInstalls)
        addSetter(ApplicationApiVersion, ApplicationKind, setApplicationsState)
        addSetter(ChannelApiVersion, ChannelKind, setChannelsState)
        addSetter(PlacementApiVersion, PlacementKind, setPlacementsState)
        addSetter(PlacementRuleApiVersion, PlacementRuleKind, setPlacementRulesState)
        addSetter(SubscriptionApiVersion, SubscriptionKind, setSubscriptionsState)
        addSetter(GitOpsClusterApiVersion, GitOpsClusterKind, setGitOpsClustersState)
        addSetter('argoproj.io/v1alpha1', 'appProjects', setAppProjectsState)
        addSetter(ApplicationSetApiVersion, ApplicationSetKind, setApplicationSetsState)
        addSetter(ArgoApplicationApiVersion, ArgoApplicationKind, setArgoApplicationsState)
        addSetter('argoproj.io/v1alpha1', 'argoCDs', setArgoCDsState)
        addSetter(AgentClusterInstallVersion, AgentClusterInstallKind, setAgentClusterInstalls)
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
        addSetter(InfraEnvApiVersion, InfraEnvKind, setInfraEnvironments)
        addSetter(InfrastructureApiVersion, InfrastructureKind, setInfrastructure)
        addSetter(MachinePoolApiVersion, MachinePoolKind, setMachinePools)
        addSetter(ManagedClusterAddOnApiVersion, ManagedClusterAddOnKind, setManagedClusterAddons)
        addSetter(ManagedClusterApiVersion, ManagedClusterKind, setManagedClusters)
        addSetter(ManagedClusterInfoApiVersion, ManagedClusterInfoKind, setManagedClusterInfos)
        addSetter(ManagedClusterSetApiVersion, ManagedClusterSetKind, setManagedClusterSets)
        addSetter(ManagedClusterSetBindingApiVersion, ManagedClusterSetBindingKind, setManagedClusterSetBindings)
        addSetter(MultiClusterHubApiVersion, MultiClusterHubKind, setMultiClusterHubs)
        addSetter(NamespaceApiVersion, NamespaceKind, setNamespaces)
        addSetter(PolicyApiVersion, PolicyKind, setPoliciesState)
        addSetter(PlacementBindingApiVersion, PlacementBindingKind, setPlacementBindingsState)
        addSetter(PolicyReportApiVersion, PolicyReportKind, setPolicyReports)
        addSetter(SecretApiVersion, SecretKind, setSecrets)
        addSetter(SubmarinerConfigApiVersion, SubmarinerConfigKind, setSubmarinerConfigs)
        return setters
    }, [])

    useEffect(() => {
        const eventQueue: WatchEvent[] = []

        function processEventQueue() {
            if (eventQueue.length === 0) return

            const resourceTypeMap = eventQueue?.reduce((resourceTypeMap, eventData) => {
                const apiVersion = eventData.object.apiVersion
                const kind = eventData.object.kind
                if (!resourceTypeMap[apiVersion]) resourceTypeMap[apiVersion] = {}
                if (!resourceTypeMap[apiVersion][kind]) resourceTypeMap[apiVersion][kind] = []
                resourceTypeMap[apiVersion][kind].push(eventData)
                return resourceTypeMap
            }, {} as Record<string, Record<string, WatchEvent[]>>)
            eventQueue.length = 0

            for (const apiVersion in resourceTypeMap) {
                for (const kind in resourceTypeMap[apiVersion]) {
                    const setter = setters[apiVersion]?.[kind]
                    if (setter) {
                        setter((resources) => {
                            const newResources = [...resources]
                            const watchEvents = resourceTypeMap[apiVersion][kind]
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
                            processEventQueue()
                            setLoading(false)
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
                        startWatch()
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
    }, [])

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
                            if (process.env.NODE_ENV === 'production') {
                                window.location.reload()
                            } else {
                                window.location.href = `${getBackendUrl()}/login`
                            }
                            break
                    }
                })
                .catch(() => {
                    if (process.env.NODE_ENV === 'production') {
                        window.location.reload()
                    } else {
                        window.location.href = `${getBackendUrl()}/login`
                    }
                })
                .finally(() => {
                    setTimeout(checkLoggedIn, 30 * 1000)
                })
        }
        checkLoggedIn()
    }, [])

    if (loading || getBackendUrl() === undefined) return <LoadingPage />

    return <Fragment>{props.children}</Fragment>
}
