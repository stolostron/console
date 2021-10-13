/* Copyright Contributors to the Open Cluster Management project */
import { AcmRoute } from '@open-cluster-management/ui-components'
import { CIM } from 'openshift-assisted-ui-lib'
import { Fragment, ReactNode, useEffect, useMemo, useState } from 'react'
import { atom, SetterOrUpdater, useRecoilState } from 'recoil'
import { LoadingPage } from './components/LoadingPage'
import {
    AgentClusterInstallKind,
    AgentClusterInstallVersion,
    AgentKind,
    AgentKindVersion,
    AnsibleJob,
    AnsibleJobApiVersion,
    AnsibleJobKind,
    BareMetalAsset,
    BareMetalAssetApiVersion,
    BareMetalAssetKind,
    BareMetalHostApiVersion,
    BareMetalHostKind,
    CertificateSigningRequest,
    CertificateSigningRequestApiVersion,
    CertificateSigningRequestKind,
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
    InfraEnvApiVersion,
    InfraEnvKind,
    InfrastructureApiVersion,
    InfrastructureKind,
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
    ManagedClusterSetBindingKind,
    ManagedClusterSetBindingApiVersion,
    ManagedClusterSetKind,
    MultiClusterHub,
    MultiClusterHubApiVersion,
    MultiClusterHubKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    PolicyReport,
    PolicyReportApiVersion,
    PolicyReportKind,
    Secret,
    SecretApiVersion,
    SecretKind,
    SubmarinerConfig,
    SubmarinerConfigApiVersion,
    SubmarinerConfigKind,
    IResource,
} from './resources'

export const acmRouteState = atom<AcmRoute>({ key: 'acmRoute', default: '' as AcmRoute })
export const agentClusterInstallsState = atom<CIM.AgentClusterInstallK8sResource[]>({
    key: 'agentclusterinstalls',
    default: [],
})
export const agentsState = atom<CIM.AgentK8sResource[]>({ key: 'agents', default: [] })
export const ansibleJobState = atom<AnsibleJob[]>({ key: 'ansiblejobs', default: [] })

export const applicationsState = atom<IResource[]>({ key: 'applications', default: [] })
export const channelsState = atom<IResource[]>({ key: 'channels', default: [] })
export const gitOpsClustersState = atom<IResource[]>({ key: 'gitOpsClusters', default: [] })
export const placementRulesState = atom<IResource[]>({ key: 'placementRules', default: [] })
export const subscriptionsState = atom<IResource[]>({ key: 'subscriptions', default: [] })
export const appProjectsState = atom<IResource[]>({ key: 'appProjects', default: [] })
export const argoApplicationsState = atom<IResource[]>({ key: 'argoApplications', default: [] })
export const applicationSetsState = atom<IResource[]>({ key: 'applicationSets', default: [] })
export const argoCDsState = atom<IResource[]>({ key: 'argoCDs', default: [] })

export const bareMetalAssetsState = atom<BareMetalAsset[]>({ key: 'bareMetalAssets', default: [] })
export const bareMetalHostsState = atom<CIM.BareMetalHostK8sResource[]>({ key: 'baremetalhosts', default: [] })
export const certificateSigningRequestsState = atom<CertificateSigningRequest[]>({
    key: 'certificateSigningRequests',
    default: [],
})
export const clusterClaimsState = atom<ClusterClaim[]>({ key: 'clusterClaims', default: [] })
export const clusterCuratorsState = atom<ClusterCurator[]>({ key: 'clusterCurators', default: [] })
export const clusterDeploymentsState = atom<ClusterDeployment[]>({ key: 'clusterDeployments', default: [] })
export const clusterImageSetsState = atom<ClusterImageSet[]>({ key: 'clusterImageSets', default: [] })
export const clusterManagementAddonsState = atom<ClusterManagementAddOn[]>({
    key: 'clusterManagementAddons',
    default: [],
})
export const clusterPoolsState = atom<ClusterPool[]>({ key: 'clusterPools', default: [] })
export const clusterProvisionsState = atom<ClusterProvision[]>({ key: 'clusterProvisions', default: [] })
export const configMapsState = atom<ConfigMap[]>({ key: 'configMaps', default: [] })
export const discoveredClusterState = atom<DiscoveredCluster[]>({ key: 'discoveredClusters', default: [] })
export const discoveryConfigState = atom<DiscoveryConfig[]>({ key: 'discoveryConfigs', default: [] })
export const infraEnvironmentsState = atom<CIM.InfraEnvK8sResource[]>({ key: 'infraenvs', default: [] })
export const infrastructuresState = atom<CIM.InfrastructureK8sResource[]>({ key: 'infrastructures', default: [] })
export const machinePoolsState = atom<MachinePool[]>({ key: 'machinePools', default: [] })
export const managedClusterAddonsState = atom<ManagedClusterAddOn[]>({ key: 'managedClusterAddons', default: [] })
export const managedClusterInfosState = atom<ManagedClusterInfo[]>({ key: 'managedClusterInfos', default: [] })
export const managedClusterSetBindingsState = atom<ManagedClusterSetBinding[]>({
    key: 'managedClusterSetBindings',
    default: [],
})
export const managedClusterSetsState = atom<ManagedClusterSet[]>({ key: 'managedClusterSets', default: [] })
export const managedClustersState = atom<ManagedCluster[]>({ key: 'managedClusters', default: [] })
export const multiClusterHubState = atom<MultiClusterHub[]>({ key: 'multiClusterHubs', default: [] })
export const namespacesState = atom<Namespace[]>({ key: 'namespaces', default: [] })
export const policyreportState = atom<PolicyReport[]>({ key: 'policyreports', default: [] })
export const secretsState = atom<Secret[]>({ key: 'secrets', default: [] })
export const settingsState = atom<Settings>({ key: 'settings', default: {} })
export const submarinerConfigsState = atom<SubmarinerConfig[]>({ key: 'submarinerconfigs', default: [] })

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

    const [, setApplicationsState] = useRecoilState(applicationsState)
    const [, setChannelsState] = useRecoilState(channelsState)
    const [, setGitOpsClustersState] = useRecoilState(gitOpsClustersState)
    const [, setPlacementRulesState] = useRecoilState(placementRulesState)
    const [, setSubscriptionsState] = useRecoilState(subscriptionsState)
    const [, setAppProjectsState] = useRecoilState(appProjectsState)
    const [, setArgoApplicationsState] = useRecoilState(argoApplicationsState)
    const [, setApplicationSetsState] = useRecoilState(applicationSetsState)
    const [, setArgoCDsState] = useRecoilState(argoCDsState)

    const [, setBareMetalAssets] = useRecoilState(bareMetalAssetsState)
    const [, setBareMetalHosts] = useRecoilState(bareMetalHostsState)
    const [, setCertificateSigningRequests] = useRecoilState(certificateSigningRequestsState)
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
    const [, setPolicyReports] = useRecoilState(policyreportState)
    const [, setSecrets] = useRecoilState(secretsState)
    const [, setSettings] = useRecoilState(settingsState)
    const [, setSubmarinerConfigs] = useRecoilState(submarinerConfigsState)

    const setters: Record<string, Record<string, SetterOrUpdater<any[]>>> = useMemo(() => {
        const setters: Record<string, Record<string, SetterOrUpdater<any[]>>> = {}
        function addSetter(apiVersion: string, kind: string, setter: SetterOrUpdater<any[]>) {
            if (!setters[apiVersion]) setters[apiVersion] = {}
            setters[apiVersion][kind] = setter
        }
        addSetter(AgentClusterInstallVersion, AgentClusterInstallKind, setAgentClusterInstalls)
        addSetter(AgentKindVersion, AgentKind, setAgents)
        addSetter(AnsibleJobApiVersion, AnsibleJobKind, setAnsibleJobs)

        addSetter('app.k8s.io/v1beta1', 'Application', setApplicationsState)
        addSetter('apps.open-cluster-management.io/v1', 'Channel', setChannelsState)
        addSetter('apps.open-cluster-management.io/v1alpha1', 'GitOpsCluster', setGitOpsClustersState)
        addSetter('apps.open-cluster-management.io/v1', 'PlacementRule', setPlacementRulesState)
        addSetter('apps.open-cluster-management.io/v1', 'Subscription', setSubscriptionsState)
        addSetter('argoproj.io/v1alpha1', 'appProjects', setAppProjectsState)
        addSetter('argoproj.io/v1alpha1', 'applications', setArgoApplicationsState)
        addSetter('argoproj.io/v1alpha1', 'applicationSets', setApplicationSetsState)
        addSetter('argoproj.io/v1alpha1', 'argoCDs', setArgoCDsState)

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
        addSetter(ManagedClusterInfoApiVersion, ManagedClusterInfoKind, setManagedClusterInfos)
        addSetter(ManagedClusterApiVersion, ManagedClusterKind, setManagedClusters)
        addSetter(ManagedClusterSetBindingApiVersion, ManagedClusterSetBindingKind, setManagedClusterSetBindings)
        addSetter(ManagedClusterSetApiVersion, ManagedClusterSetKind, setManagedClusterSets)
        addSetter(MultiClusterHubApiVersion, MultiClusterHubKind, setMultiClusterHubs)
        addSetter(NamespaceApiVersion, NamespaceKind, setNamespaces)
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
            evtSource = new EventSource(`${process.env.REACT_APP_BACKEND_PATH}/events`, { withCredentials: true })
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
            fetch(`${process.env.REACT_APP_BACKEND_PATH}/authenticated`, {
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
                                window.location.href = `${process.env.REACT_APP_BACKEND_HOST}${process.env.REACT_APP_BACKEND_PATH}/login`
                            }
                            break
                    }
                })
                .catch(() => {
                    if (process.env.NODE_ENV === 'production') {
                        window.location.reload()
                    } else {
                        window.location.href = `${process.env.REACT_APP_BACKEND_HOST}${process.env.REACT_APP_BACKEND_PATH}/login`
                    }
                })
                .finally(() => {
                    setTimeout(checkLoggedIn, 30 * 1000)
                })
        }
        checkLoggedIn()
    }, [])

    if (loading) return <LoadingPage />

    return <Fragment>{props.children}</Fragment>
}
