/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta, V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { IResource, IResourceDefinition } from './resource'

export const ClusterClaimApiVersion = 'hive.openshift.io/v1'
export type ClusterClaimApiVersionType = 'hive.openshift.io/v1'

export const ClusterClaimKind = 'ClusterClaim'
export type ClusterClaimKindType = 'ClusterClaim'

export const ClusterClaimDefinition: IResourceDefinition = {
    apiVersion: ClusterClaimApiVersion,
    kind: ClusterClaimKind,
}

export interface ClusterClaim extends IResource {
    apiVersion: ClusterClaimApiVersionType
    kind: ClusterClaimKindType
    metadata: V1ObjectMeta
    spec?: {
        clusterPoolName: string
        lifetime?: string
        namespace?: string
    }
    status?: {
        conditions: V1CustomResourceDefinitionCondition[]
    }
}
