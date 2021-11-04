/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { Selector } from './selector'

export const PlacementRuleApiVersion = 'apps.open-cluster-management.io/v1'
export type PlacementRuleApiVersionType = 'apps.open-cluster-management.io/v1'

export const PlacementRuleKind = 'PlacementRule'
export type PlacementRuleKindType = 'PlacementRule'

export interface PlacementRule {
    apiVersion: PlacementRuleApiVersionType
    kind: PlacementRuleApiVersionType
    metadata: Metadata
    spec: {
        clusterConditions?: {
            status: string
            type: string
        }[]
        clusterSelector?: Selector | null
    }
    status?: {
        decisions?: {
            clusterName: string
            clusterNamespace: string
        }[]
    }
}
