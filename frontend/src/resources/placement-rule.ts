/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource } from './resource'

export const PlacementRuleApiVersion = 'policy.open-cluster-management.io/v1'
export type PlacementRuleApiVersionType = 'policy.open-cluster-management.io/v1'

export const PlacementRuleKind = 'PlacementBinding'
export type PlacementRuleKindType = 'PlacementBinding'

export interface PlacementRule extends IResource{
    apiVersion: 'apps.open-cluster-management.io/v1'
    kind: 'PlacementRule'
    metadata: Metadata
    spec: {
        clusterConditions?: {
            status: string
            type: string
        }[]
        clusterSelector?: {
            matchExpressions?: {
                key: string
                operator: string
                values?: string[]
            }[]
            matchLabels?: Record<string, string>
        } | null
    }
    status?: {
        decisions?: {
            clusterName: string
            clusterNamespace: string
        }[]
    }
}
