import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, GetWrapper, ResourceList } from './Resource'

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

export const discoveredClusters = resourceMethods<DiscoveredCluster>({
    path: '/apis/operator.open-cluster-management.io/v1',
    plural: 'discoveredclusters',
})

export function DiscoveredClusters() {
    return GetWrapper<ResourceList<DiscoveredCluster>>(discoveredClusters.list)
}
