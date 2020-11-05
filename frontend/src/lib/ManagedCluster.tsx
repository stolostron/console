import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, QueryWrapper, ResourceList } from './Resource'

export interface ClusterLabels {
    cloud: string
    vendor: string
    name: string
    [key: string]: string
}

export interface ManagedCluster extends IResource {
    apiVersion: 'cluster.open-cluster-management.io/v1'
    kind: 'ManagedCluster'
    metadata: V1ObjectMeta
    spec: {
        hubAcceptsClient: boolean
        leaseDurationSeconds?: number
    }
    status?: {
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

export const managedClusterMethods = resourceMethods<ManagedCluster>({
    path: '/apis/cluster.open-cluster-management.io/v1',
    plural: 'managedclusters',
})

export function QueryManagedClusters() {
    return QueryWrapper<ResourceList<ManagedCluster>>(managedClusterMethods.list)
}

export const createManagedCluster = (data: { clusterName: string | undefined; clusterLabels: ClusterLabels }) => {
    return managedClusterMethods.create({
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: { name: data.clusterName, labels: data.clusterLabels },
        spec: {
            hubAcceptsClient: true,
        },
    })
}
