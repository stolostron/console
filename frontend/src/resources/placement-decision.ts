/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '.'
import { Metadata } from './metadata'

export const PlacementDecisionApiVersion = 'cluster.open-cluster-management.io/v1beta1'
export type PlacementDecisionApiVersionType = 'cluster.open-cluster-management.io/v1beta1'

export const PlacementDecisionKind = 'PlacementDecision'
export type PlacementDecisionKindType = 'PlacementDecision'

export interface PlacementDecision extends IResource {
    apiVersion: PlacementDecisionApiVersionType
    kind: PlacementDecisionKindType
    metadata: Metadata
    status?: PlacementDecisionStatus
}

export interface PlacementDecisionStatus {
    /**
     * Decisions is a slice of decisions according to a placement
     * The number of decisions should not be larger than 100
     */
    decisions: ClusterDecision[]
}

/**
 * ClusterDecision represents a decision from a placement An
 * empty ClusterDecision indicates it is not scheduled yet.
 */
interface ClusterDecision {
    /**
     * ClusterName is the name of the ManagedCluster.
     * If it is not empty, its value should be unique cross all
     * placement decisions for the Placement.
     */
    clusterName: string

    /** Reason represents the reason why the ManagedCluster is selected. */
    reason: string
}
