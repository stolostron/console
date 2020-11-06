import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, useQueryWrapper, ResourceList } from './Resource'

export interface DiscoveredCluster extends IResource {
    apiVersion: string
    kind: 'DiscoveredCluster'
    metadata: V1ObjectMeta
    info: {
        activity_timestamp: string
        apiUrl: string
        cloudProvider: string
        console: string
        creation_timestamp: string
        healthState: string
        managed: boolean
        name: string
        openshiftVersion: string
        product: string
        region: string
        state: string
        status: string
        support_level: string
    }
}

export const discoveredClusterMethods = resourceMethods<DiscoveredCluster>({
    path: '/apis/discovery.open-cluster-management.io/v1',
    plural: 'discoveredclusters',
})

export function useDiscoveredClusters() {
    return useQueryWrapper<ResourceList<DiscoveredCluster>>(discoveredClusterMethods.list)
}