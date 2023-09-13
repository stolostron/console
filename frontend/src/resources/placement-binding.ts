/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '.'
import { Metadata } from './metadata'
import { ResourceRef } from './resource-ref'

export const PlacementBindingApiVersion = 'policy.open-cluster-management.io/v1'
export type PlacementBindingApiVersionType = 'policy.open-cluster-management.io/v1'

export const PlacementBindingKind = 'PlacementBinding'
export type PlacementBindingKindType = 'PlacementBinding'

export interface PlacementBinding extends IResource {
  apiVersion: PlacementBindingApiVersionType
  kind: PlacementBindingKindType
  metadata: Metadata
  bindingOverrides?: {
    remediationAction?: 'Enforce' | 'enforce' | null
  }
  subfilter?: boolean | string
  placementRef: ResourceRef
  subjects?: ResourceRef[] | null
}
