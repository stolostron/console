/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ManagedClusterSetBindingApiVersion = 'cluster.open-cluster-management.io/v1beta2'
export type ManagedClusterSetBindingApiVersionType = 'cluster.open-cluster-management.io/v1beta2'

export const ManagedClusterSetBindingKind = 'ManagedClusterSetBinding'
export type ManagedClusterSetBindingKindType = 'ManagedClusterSetBinding'

export const ManagedClusterSetBindingDefinition: IResourceDefinition = {
    apiVersion: ManagedClusterSetBindingApiVersion,
    kind: ManagedClusterSetBindingKind,
}

export interface ManagedClusterSetBinding extends IResource {
    apiVersion: ManagedClusterSetBindingApiVersionType
    kind: ManagedClusterSetBindingKindType
    metadata: Metadata
    spec: {
        clusterSet: string
    }
}
