/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { Selector } from './selector'

export interface PlacementRule {
    apiVersion: 'apps.open-cluster-management.io/v1'
    kind: 'PlacementRule'
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
