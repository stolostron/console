import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, GetWrapper } from './Resource'

export interface ManagedCluster extends IResource {
    apiVersion: string
    kind: 'ManagedCluster'
    metadata: V1ObjectMeta
    spec: {
        hubAcceptsClient: string
        leaseDurationSeconds: number
    }
    status: {
        allocatable: {
            cpu: string
            memory: string
        }
        capacity: {
            cpu: string
            memory: string
        }
        conditions: {
            lastTransitionTime: string
            message: string
            reason: string
            status: string
            type: string
        }[]
        version: {
            kubernetes: string
        }
    }
}

export const managedClusters = resourceMethods<ManagedCluster>({
    path: '/apis/cluster.open-cluster-management.io/v1',
    plural: 'managedclusters',
})

export function ManagedClusters() {
    return GetWrapper<ManagedCluster[]>(managedClusters.list)
}
