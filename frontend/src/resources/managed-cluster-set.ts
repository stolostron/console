/* Copyright Contributors to the Open Cluster Management project */
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ManagedClusterSetApiVersion = 'cluster.open-cluster-management.io/v1beta1'
export type ManagedClusterSetApiVersionType = 'cluster.open-cluster-management.io/v1beta1'

export const ManagedClusterSetKind = 'ManagedClusterSet'
export type ManagedClusterSetKindType = 'ManagedClusterSet'

export const submarinerBrokerNamespaceAnnotation = 'cluster.open-cluster-management.io/submariner-broker-ns'

export const isGlobalClusterSet = (managedClusterSet: ManagedClusterSet | undefined): boolean =>
    managedClusterSet?.metadata?.name === 'global'

export const ManagedClusterSetDefinition: IResourceDefinition = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
}

export interface ManagedClusterSet extends IResource {
    apiVersion: ManagedClusterSetApiVersionType
    kind: ManagedClusterSetKindType
    metadata: Metadata
    spec?: {}
    status?: {
        conditions: V1CustomResourceDefinitionCondition[]
    }
}

export const managedClusterSetLabel = 'cluster.open-cluster-management.io/clusterset'
