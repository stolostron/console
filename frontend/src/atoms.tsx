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
import { IResource } from './resources/resource'

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
    type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'LOADED'
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

export function Startup(props: { children?: ReactNode }) {
    const [loading, setLoading] = useRecoilState(loadingState)
    const [, setBareMetalAssets] = useRecoilState(bareMetalAssetsState)
    const [, setCertificateSigningRequests] = useRecoilState(certificateSigningRequestsState)
    const [, setClusterdDeployments] = useRecoilState(clusterDeploymentsState)
    const [, setClusterImageSets] = useRecoilState(clusterImageSetsState)
    const [, setClusterManagementAddons] = useRecoilState(clusterManagementAddonsState)
    const [, setManagedClusterAddons] = useRecoilState(managedClusterAddonsState)
    const [, setManagedClusters] = useRecoilState(managedClustersState)
    const [, setManagedClusterInfos] = useRecoilState(managedClusterInfosState)
    const [, setNamespaces] = useRecoilState(namespacesState)
    const [, setProviderConnections] = useRecoilState(providerConnectionsState)
    const [, setDiscoveryConfigs] = useRecoilState(discoveryConfigState)

    useEffect(() => {
        const eventQueue: IEventData[] = []

        async function processEvents() {
            let event = eventQueue.shift()
            while (event) {
                processEvent(event)
                event = eventQueue.shift()
            }
        }

        function processEvent(event: IEventData): void {
            switch (event.object.kind) {
                case BareMetalAssetKind:
                    return updateResource<BareMetalAsset>(event, setBareMetalAssets)
                case CertificateSigningRequestKind:
                    return updateResource<CertificateSigningRequest>(event, setCertificateSigningRequests)
                case ClusterDeploymentKind:
                    return updateResource<ClusterDeployment>(event, setClusterdDeployments)
                case ClusterImageSetKind:
                    return updateResource<ClusterImageSet>(event, setClusterImageSets)
                case ClusterManagementAddOnKind:
                    return updateResource<ClusterManagementAddOn>(event, setClusterManagementAddons)
                case ManagedClusterAddOnKind:
                    return updateResource<ManagedClusterAddOn>(event, setManagedClusterAddons)
                case ManagedClusterKind:
                    return updateResource<ManagedCluster>(event, setManagedClusters)
                case ManagedClusterInfoKind:
                    return updateResource<ManagedClusterInfo>(event, setManagedClusterInfos)
                case NamespaceKind:
                    return updateResource<Namespace>(event, setNamespaces)
                case ProviderConnectionKind:
                    return updateResource<ProviderConnection>(event, setProviderConnections)
                case DiscoveryConfigKind:
                    return updateResource<DiscoveryConfig>(event, setDiscoveryConfigs)
                default:
                    console.log(`Unknown event resource kind: ${event.object.kind}`)
            }
        }

        function updateResource<T extends IResource>(data: IEventData, setResources: SetterOrUpdater<T[]>): void {
            switch (data.type) {
                case 'ADDED':
                case 'MODIFIED':
                    return setResources((resources) => [
                        ...resources.filter(
                            (resource) =>
                                resource.metadata?.name !== data.object.metadata.name ||
                                resource.metadata?.namespace !== data.object.metadata.namespace
                        ),
                        data.object as T,
                    ])

                case 'DELETED':
                    return setResources((resources) => [
                        ...resources.filter(
                            (resource) =>
                                resource.metadata?.name !== data.object.metadata.name ||
                                resource.metadata?.namespace !== data.object.metadata.namespace
                        ),
                    ])
            }
        }

        const evtSource = new EventSource(`${process.env.REACT_APP_BACKEND_PATH}/watch`, { withCredentials: true })

        evtSource.onmessage = function (event) {
            if (event.data) {
                try {
                    const data = JSON.parse(event.data) as IEventData
                    if (loading) {
                        if (data.type === 'LOADED') {
                            processEvents()
                            setLoading(false)
                        } else {
                            eventQueue.push(data)
                        }
                    } else {
                        processEvent(event.data)
                    }
                } catch (err) {
                    console.error(err)
                }
            }
        }

        evtSource.onerror = function (err) {
            console.error('EventSource failed:', err)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) return <LoadingPage />

    return props.children
}
