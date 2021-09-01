/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'

export interface PlacementRule {
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
