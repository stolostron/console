/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResource, IResourceDefinition } from './resource'

export const ManagedClusterSetBindingApiVersion = 'cluster.open-cluster-management.io/v1alpha1'
export type ManagedClusterSetBindingApiVersionType = 'cluster.open-cluster-management.io/v1alpha1'

export const ManagedClusterSetBindingKind = 'ManagedClusterSetBinding'
export type ManagedClusterSetBindingKindType = 'ManagedClusterSetBinding'

export const ManagedClusterSetBindingDefinition: IResourceDefinition = {
    apiVersion: ManagedClusterSetBindingApiVersion,
    kind: ManagedClusterSetBindingKind,
}

export interface ManagedClusterSetBinding extends IResource {
    apiVersion: ManagedClusterSetBindingApiVersionType
    kind: ManagedClusterSetBindingKindType
    metadata: V1ObjectMeta
    spec: {
        clusterSet: string
    }
}
