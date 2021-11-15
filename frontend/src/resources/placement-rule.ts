/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { Selector } from './selector'
import { IResource, IResourceDefinition } from './resource'

export const PlacementRuleApiVersion = 'apps.open-cluster-management.io/v1'
export type PlacementRuleApiVersionType = 'apps.open-cluster-management.io/v1'

export const PlacementRuleKind = 'PlacementRule'
export type PlacementRuleKindType = 'PlacementRule'

export const PlacementRuleDefinition: IResourceDefinition = {
  apiVersion: PlacementRuleApiVersion,
  kind: PlacementRuleKind,
}

export interface PlacementRule extends IResource {
    apiVersion: PlacementRuleApiVersionType
    kind: PlacementRuleKindType
    metadata: Metadata
    spec: {
        clusterReplicas?: number
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
