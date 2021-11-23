/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { Selector } from './selector'
import { isType } from '../lib/is-type'
import { IResource, IResourceDefinition } from './resource'
import { listResources } from '.'

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
        predicates: Array<{
            requiredClusterSelector: {
                labelSelector?: Selector
            }
        }>

        clusterSelector?: Selector | null
    }
    status?: {
        conditions: Array<{
            lastTransitionTime: Date
            message: string
            reason: string
            status: string
            type: string
        }>
        numberOfSelectedClusters?: number
    }
}

export function listPlacements() {
    const placements = listResources<Placement>({
        apiVersion: PlacementApiVersion,
        kind: PlacementKind,
    })
    return {
        promise: placements.promise.then((placements) => {
            return placements.map((placement) => placement.metadata.name).filter(isType)
        }),
        abort: placements.abort,
    }
}
