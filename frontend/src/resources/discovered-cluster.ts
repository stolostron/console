import { IResource } from './resource'
import { V1ObjectMeta } from '@kubernetes/client-node'
import { listResources } from '../lib/resource-request'

export const DiscoveredClusterApiVersion = 'discovery.open-cluster-management.io/v1'
export type DiscoveredClusterApiVersionType = 'discovery.open-cluster-management.io/v1'

export const DiscoveredClusterKind = 'DiscoveredCluster'
export type DiscoveredClusterKindType = 'DiscoveredCluster'

export interface DiscoveredCluster extends IResource {
    apiVersion: DiscoveredClusterApiVersionType
    kind: DiscoveredClusterKindType
    metadata: V1ObjectMeta
    spec: {
        activity_timestamp: string
        apiUrl?: string
        cloudProvider: string
        console: string
        creation_timestamp?: string
        healthState: string
        name: string
        openshiftVersion: string
        product: string
        providerConnections?: {
            apiVersion: string
            kind: string
            name: string
            namespace: string
            resourceVersion: string
            uid: string
        }[]
        region: string
        state: string
        subscription: {
            creator_id: string
            managed: boolean
            status: string
            support_level?: string
        }
    }
}

export function listDiscoveredClusters() {
    return listResources<DiscoveredCluster>({
        apiVersion: DiscoveredClusterApiVersion,
        kind: DiscoveredClusterKind,
    })
}
