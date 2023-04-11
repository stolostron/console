/* Copyright Contributors to the Open Cluster Management project */
import { IResourceDefinition } from './resource'
import { Metadata } from './metadata'
import { PlacementApiVersionBetaType, PlacementKindType } from './placement'

export const GitOpsClusterApiVersion = 'apps.open-cluster-management.io/v1beta1'
export type GitOpsClusterApiVersionType = 'apps.open-cluster-management.io/v1beta1'

export const GitOpsClusterKind = 'GitOpsCluster'
export type GitOpsClusterKindType = 'GitOpsCluster'

export const GitopsClusterDefinition: IResourceDefinition = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
}

export interface GitOpsCluster {
  apiVersion: GitOpsClusterApiVersionType
  kind: GitOpsClusterKindType
  metadata: Metadata
  spec?: {
    argoServer?: {
      argoNamespace: string
      cluster?: string
    }
    placementRef?: {
      apiVersion: PlacementApiVersionBetaType
      kind: PlacementKindType
      name: string
    }
  }
}
