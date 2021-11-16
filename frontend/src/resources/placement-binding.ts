/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { ResourceRef } from './resource-ref'

export interface PlacementBinding {
    apiVersion: 'policy.open-cluster-management.io/v1'
    kind: 'PlacementBinding'
    metadata: Metadata
    placementRef: ResourceRef
    subjects?: ResourceRef[] | null
}
