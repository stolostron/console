/* Copyright Contributors to the Open Cluster Management project */
import { listResources } from './utils/resource-request'
import { IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const ClusterImageSetApiVersion = 'hive.openshift.io/v1'
export type ClusterImageSetApiVersionType = 'hive.openshift.io/v1'

export const ClusterImageSetKind = 'ClusterImageSet'
export type ClusterImageSetKindType = 'ClusterImageSet'

export const ClusterImageSetDefinition: IResourceDefinition = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
}

export type ClusterImageSet = {
  apiVersion: ClusterImageSetApiVersionType
  kind: ClusterImageSetKindType
  metadata: Metadata
  spec?: { releaseImage: string }
}

export function listClusterImageSets() {
  return listResources<ClusterImageSet>({
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
  })
}
