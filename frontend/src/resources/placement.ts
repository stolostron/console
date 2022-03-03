/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { Selector } from './selector'

export const PlacementApiVersion = 'cluster.open-cluster-management.io/v1alpha1'
export type PlacementApiVersionType = 'cluster.open-cluster-management.io/v1alpha1'

export const PlacementKind = 'Placement'
export type PlacementKindType = 'Placement'

export const PlacementDefinition: IResourceDefinition = {
    apiVersion: PlacementApiVersion,
    kind: PlacementKind,
}

export interface Placement extends IResource {
    apiVersion: PlacementApiVersionType
    kind: PlacementKindType
    metadata: Metadata
    spec: {
        numberOfClusters?: number
        clusterSets?: Array<string>
        predicates?: PlacementPredicates[]

        clusterSelector?: Selector | null
    }
    status?: PlacementStatus
}

export interface PlacementPredicates {
    requiredClusterSelector: PlacementRequiredClusterSelector
    clusterName?: string
}

export interface PlacementRequiredClusterSelector {
    labelSelector?: Selector
    claimSelector?: Selector
}

export interface PlacementStatus {
    conditions: Array<{
        lastTransitionTime: Date
        message: string
        reason: string
        status: string
        type: string
    }>
    numberOfSelectedClusters?: number
}
