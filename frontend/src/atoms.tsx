/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useEffect } from 'react'
import { atom, SetterOrUpdater, useRecoilState } from 'recoil'
import { LoadingPage } from './components/LoadingPage'
import { BareMetalAsset, BareMetalAssetKind } from './resources/bare-metal-asset'
import { CertificateSigningRequest, CertificateSigningRequestKind } from './resources/certificate-signing-requests'
import { ClusterDeployment, ClusterDeploymentKind } from './resources/cluster-deployment'
import { ClusterImageSet, ClusterImageSetKind } from './resources/cluster-image-set'
import { ClusterManagementAddOn, ClusterManagementAddOnKind } from './resources/cluster-management-add-on'
import { DiscoveryConfig, DiscoveryConfigKind } from './resources/discovery-config'
import { ManagedCluster, ManagedClusterKind } from './resources/managed-cluster'
import { ManagedClusterAddOn, ManagedClusterAddOnKind } from './resources/managed-cluster-add-on'
import { ManagedClusterInfo, ManagedClusterInfoKind } from './resources/managed-cluster-info'
import { Namespace, NamespaceKind } from './resources/namespace'
import { ProviderConnection, ProviderConnectionKind } from './resources/provider-connection'

export const loadingState = atom<boolean>({ key: 'loading', default: true })
export const bareMetalAssetsState = atom<BareMetalAsset[]>({ key: 'bareMetalAssets', default: [] })
export const certificateSigningRequestsState = atom<CertificateSigningRequest[]>({
    key: 'certificateSigningRequests',
    default: [],
})
export const clusterDeploymentsState = atom<ClusterDeployment[]>({ key: 'clusterDeployments', default: [] })
export const clusterImageSetsState = atom<ClusterImageSet[]>({ key: 'clusterImageSets', default: [] })
export const clusterManagementAddonsState = atom<ClusterManagementAddOn[]>({
    key: 'clusterManagementAddons',
    default: [],
})
export const discoveryConfigState = atom<DiscoveryConfig[]>({ key: 'discoveryConfigs', default: [] })
export const managedClusterAddonsState = atom<ManagedClusterAddOn[]>({ key: 'managedClusterAddons', default: [] })
export const managedClustersState = atom<ManagedCluster[]>({ key: 'managedClusters', default: [] })
export const managedClusterInfosState = atom<ManagedClusterInfo[]>({ key: 'managedClusterInfos', default: [] })
export const namespacesState = atom<Namespace[]>({ key: 'namespaces', default: [] })
export const providerConnectionsState = atom<ProviderConnection[]>({ key: 'providerConnections', default: [] })

interface IEventData {
    type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'BOOKMARK' | 'START'
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

export function LoadData(props: { children?: ReactNode }) {
    const [loading, setLoading] = useRecoilState(loadingState)
    const [, setBareMetalAssets] = useRecoilState(bareMetalAssetsState)
    const [, setCertificateSigningRequests] = useRecoilState(certificateSigningRequestsState)
    const [, setClusterdDeployments] = useRecoilState(clusterDeploymentsState)
    const [, setClusterImageSets] = useRecoilState(clusterImageSetsState)
    const [, setClusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
    const [, setDiscoveryConfigs] = useRecoilState(discoveryConfigState)
    const [, setManagedClusterAddons] = useRecoilState(managedClusterAddonsState)
    const [, setManagedClusters] = useRecoilState(managedClustersState)
    const [, setManagedClusterInfos] = useRecoilState(managedClusterInfosState)
    const [, setNamespaces] = useRecoilState(namespacesState)
    const [, setProviderConnections] = useRecoilState(providerConnectionsState)

    const setters: Record<string, SetterOrUpdater<any[]>> = {
        [BareMetalAssetKind]: setBareMetalAssets,
        [CertificateSigningRequestKind]: setCertificateSigningRequests,
        [ClusterDeploymentKind]: setClusterdDeployments,
        [ClusterImageSetKind]: setClusterImageSets,
        [ClusterManagementAddOnKind]: setClusterManagementAddons,
        [ManagedClusterAddOnKind]: setManagedClusterAddons,
        [ManagedClusterKind]: setManagedClusters,
        [ManagedClusterInfoKind]: setManagedClusterInfos,
        [NamespaceKind]: setNamespaces,
        [ProviderConnectionKind]: setProviderConnections,
        [DiscoveryConfigKind]: setDiscoveryConfigs,
    }

    // Temporary fix for checking for login
    useEffect(() => {
        function checkLoggedIn() {
            fetch(`${process.env.REACT_APP_BACKEND_PATH}/api/`, {
                credentials: 'include',
                headers: { accept: 'application/json' },
            }).then((res) => {
                switch (res.status) {
                    case 401:
                        window.location.href = `${process.env.REACT_APP_BACKEND_HOST}/login`
                        break
                }
                setTimeout(checkLoggedIn, 30 * 1000)
            })
        }
        checkLoggedIn()
    }, [])

    useEffect(() => {
        let eventQueue: IEventData[] | undefined = []

        async function processEvents() {
            if (!eventQueue) return
            const eventsToProcess = eventQueue
            for (const kind in setters) {
                const setter = setters[kind]
                setter((resources) => {
                    let newResources = [...resources]
                    for (const event of eventsToProcess) {
                        if (event.object?.kind === kind) {
                            const index = newResources.findIndex(
                                (resource) =>
                                    resource.metadata?.name === event.object.metadata.name &&
                                    resource.metadata?.namespace === event.object.metadata.namespace
                            )
                            if (index !== -1) newResources.splice(index, 1)
                            switch (event.type) {
                                case 'ADDED':
                                case 'MODIFIED':
                                    newResources.push(event.object)
                                    break
                            }
                        }
                    }
                    return newResources
                })
            }
            eventQueue = undefined
        }

        function processEvent(event: IEventData): void {
            if (!event.object) return
            const setter = setters[event.object.kind]
            setter((resources) => {
                const index = resources.findIndex(
                    (resource) =>
                        resource.metadata?.name === event.object.metadata.name &&
                        resource.metadata?.namespace === event.object.metadata.namespace
                )
                if (index !== -1) resources.splice(index, 1)
                switch (event.type) {
                    case 'ADDED':
                    case 'MODIFIED':
                        resources.push(event.object)
                        break
                }
                return [...resources]
            })
        }

        function processMessage(event: MessageEvent) {
            if (event.data) {
                try {
                    const data = JSON.parse(event.data) as IEventData
                    switch (data.type) {
                        case 'ADDED':
                        case 'MODIFIED':
                        case 'DELETED':
                            if (eventQueue) {
                                eventQueue.push(data)
                            } else {
                                processEvent(event.data)
                            }
                            break
                        case 'START':
                            if (eventQueue === undefined) eventQueue = []
                            break
                        case 'BOOKMARK':
                            processEvents()
                            setLoading(false)
                            break
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        }

        let evtSource: EventSource | undefined
        function startWatch() {
            evtSource = new EventSource(`${process.env.REACT_APP_BACKEND_PATH}/watch`, { withCredentials: true })
            evtSource.onmessage = processMessage
            evtSource.onerror = function (err) {
                try {
                    if (evtSource) evtSource.close()
                } catch {
                    // Do nothing
                }
                evtSource = undefined
                console.error('EventSource failed:', err)
                setTimeout(() => {
                    startWatch()
                }, 10 * 1000)
            }
        }
        startWatch()
        return () => {
            if (evtSource) evtSource.close()
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) return <LoadingPage />

    return props.children
}
