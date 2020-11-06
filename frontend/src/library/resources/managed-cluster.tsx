import { V1ObjectMeta } from '@kubernetes/client-node'
import { resourceMethods } from '../utils/resource-methods'
import { IResource } from './resource'

export const ManagedClusterApiVersion = 'cluster.open-cluster-management.io/v1'
export type ManagedClusterApiVersionType = 'cluster.open-cluster-management.io/v1'

export const ManagedClusterKind = 'ManagedCluster'
export type ManagedClusterKindType = 'ManagedCluster'

export interface ClusterLabels {
    cloud: string
    vendor: string
    name: string
    [key: string]: string
}

export interface ManagedCluster extends IResource {
    apiVersion: ManagedClusterApiVersionType
    kind: ManagedClusterKindType
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
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
})

export const createManagedCluster = (data: { clusterName: string | undefined; clusterLabels: ClusterLabels }) => {
    return managedClusterMethods.create({
        apiVersion: ManagedClusterApiVersion,
        kind: ManagedClusterKind,
        metadata: { name: data.clusterName, labels: data.clusterLabels },
        spec: {
            hubAcceptsClient: true,
        },
    })
}
