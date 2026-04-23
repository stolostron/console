/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { Selector } from './selector'
import { listResources } from './utils/resource-request'

export const PlacementApiVersionAlpha = 'cluster.open-cluster-management.io/v1alpha1'
export type PlacementApiVersionAlphaType = 'cluster.open-cluster-management.io/v1alpha1'

export const PlacementApiVersionBeta = 'cluster.open-cluster-management.io/v1beta1'
export type PlacementApiVersionBetaType = 'cluster.open-cluster-management.io/v1beta1'

export const PlacementKind = 'Placement'
export type PlacementKindType = 'Placement'

export const GlobalPlacementName = 'global'

export const PlacementDefinition: IResourceDefinition = {
  apiVersion: PlacementApiVersionAlpha,
  kind: PlacementKind,
}

export interface Placement extends IResource {
  apiVersion: PlacementApiVersionAlphaType | PlacementApiVersionBetaType
  kind: PlacementKindType
  metadata: Metadata
  spec: {
    numberOfClusters?: number
    clusterSets?: Array<string>
    predicates?: PlacementPredicates[]
    tolerations?: PlacementTolerations[]

    clusterSelector?: Selector | null
  }
  status?: PlacementStatus
}

export interface PlacementPredicates {
  requiredClusterSelector: PlacementRequiredClusterSelector
  clusterName?: string
}

export interface PlacementTolerations {
  key: string
  operator?: 'Equal' | 'Exists'
  value?: string
  tolerationSections?: number
  effect?: 'NoSelect' | 'PreferNoSelect' | 'NoSelectIfNew'
}

export interface PlacementRequiredClusterSelector {
  labelSelector?: Selector
  claimSelector?: Selector
}

export interface PlacementStatus {
  conditions: Array<{
    lastTransitionTime: string
    message: string
    reason: string
    status: string
    type: string
  }>
  numberOfSelectedClusters?: number
}

export function listPlacements(namespace: string) {
  if (!namespace) {
    return {
      promise: Promise.resolve([]),
      abort: () => {},
    }
  }
  const result = listResources<Placement>({
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: {
      namespace,
    },
  })

  return {
    promise: result.promise.then((placements) => {
      return placements
    }),
    abort: result.abort,
  }
}
