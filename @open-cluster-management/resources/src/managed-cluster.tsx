/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { V1ObjectMeta } from '@kubernetes/client-node'
import { createResource } from './utils/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const ManagedClusterApiVersion = 'cluster.open-cluster-management.io/v1'
export type ManagedClusterApiVersionType = 'cluster.open-cluster-management.io/v1'

export const ManagedClusterKind = 'ManagedCluster'
export type ManagedClusterKindType = 'ManagedCluster'

export const ManagedClusterDefinition: IResourceDefinition = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
}

export interface ManagedCluster extends IResource {
    apiVersion: ManagedClusterApiVersionType
    kind: ManagedClusterKindType
    metadata: V1ObjectMeta
    spec?: {
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
        conditions: V1CustomResourceDefinitionCondition[]
        version: {
            kubernetes: string
        }
        clusterClaims: { name: string; value: string }[]
    }
}

export const createManagedCluster = (data: {
    clusterName: string | undefined
    clusterLabels: Record<string, string>
    clusterAnnotations?: Record<string, string>
}) => {
    return createResource<ManagedCluster>({
        apiVersion: ManagedClusterApiVersion,
        kind: ManagedClusterKind,
        metadata: {
            name: data.clusterName,
            labels: data.clusterLabels,
            annotations: data.clusterAnnotations,
        },
        spec: { hubAcceptsClient: true },
    })
}
