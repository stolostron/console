/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta, V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { IResource, IResourceDefinition } from './resource'

export const ManagedClusterSetApiVersion = 'cluster.open-cluster-management.io/v1alpha1'
export type ManagedClusterSetApiVersionType = 'cluster.open-cluster-management.io/v1alpha1'

export const ManagedClusterSetKind = 'ManagedClusterSet'
export type ManagedClusterSetKindType = 'ManagedClusterSet'

export const ManagedClusterSetDefinition: IResourceDefinition = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
}

export interface ManagedClusterSet extends IResource {
    apiVersion: ManagedClusterSetApiVersionType
    kind: ManagedClusterSetKindType
    metadata: V1ObjectMeta
    spec?: {}
    status?: {
        conditions: V1CustomResourceDefinitionCondition[]
    }
}

export const managedClusterSetLabel = 'cluster.open-cluster-management.io/clusterset'
