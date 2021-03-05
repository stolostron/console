import { ReactNode, useEffect } from 'react'
import { atom, SetterOrUpdater, useRecoilState } from 'recoil'
import { BareMetalAsset, BareMetalAssetKind } from './resources/bare-metal-asset'
import { CertificateSigningRequest, CertificateSigningRequestKind } from './resources/certificate-signing-requests'
import { ClusterDeployment, ClusterDeploymentKind } from './resources/cluster-deployment'
import { ClusterImageSet, ClusterImageSetKind } from './resources/cluster-image-set'
import { ClusterManagementAddOn, ClusterManagementAddOnKind } from './resources/cluster-management-add-on'
import { ManagedCluster, ManagedClusterKind } from './resources/managed-cluster'
import { ManagedClusterAddOn, ManagedClusterAddOnKind } from './resources/managed-cluster-add-on'
import { ManagedClusterInfo, ManagedClusterInfoKind } from './resources/managed-cluster-info'
import { Namespace, NamespaceKind } from './resources/namespace'
import { ProviderConnection, ProviderConnectionKind } from './resources/provider-connection'
import { IResource } from './resources/resource'

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
export const managedClusterAddonsState = atom<ManagedClusterAddOn[]>({ key: 'managedClusterAddons', default: [] })
export const managedClustersState = atom<ManagedCluster[]>({ key: 'managedClusters', default: [] })
export const managedClusterInfosState = atom<ManagedClusterInfo[]>({ key: 'managedClusterInfos', default: [] })
export const namespacesState = atom<Namespace[]>({ key: 'namespaces', default: [] })
export const providerConnectionsState = atom<ProviderConnection[]>({ key: 'providerConnections', default: [] })

interface IEventData {
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

export function Startup(props: { children?: ReactNode }) {
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

    useEffect(() => {
        const eventQueue: IEventData[] = []

        let isProcessEvents = 0
        async function processEvents() {
            if (isProcessEvents >= 6) return
            isProcessEvents++
            while (eventQueue.length) {
                const event = eventQueue.shift()
                if (!event) continue

                await processEvent(event)
            }
            isProcessEvents--
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
                    eventQueue.push(data)
                    processEvents()
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

    return props.children
}
