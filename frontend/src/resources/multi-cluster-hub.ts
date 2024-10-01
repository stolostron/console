/* Copyright Contributors to the Open Cluster Management project */
import { listResources } from './utils/resource-request'
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const MultiClusterHubApiVersion = 'operator.open-cluster-management.io/v1'
export type MultiClusterHubApiVersionType = 'operator.open-cluster-management.io/v1'

export const MultiClusterHubKind = 'MultiClusterHub'
export type MultiClusterHubKindType = 'MultiClusterHub'

export const MultiClusterHubDefinition: IResourceDefinition = {
  apiVersion: MultiClusterHubApiVersion,
  kind: MultiClusterHubKind,
}

export interface MultiClusterHub extends IResource {
  apiVersion: MultiClusterHubApiVersionType
  kind: MultiClusterHubKindType
  metadata: Metadata
  spec?: object
  status: {
    currentVersion: string
  }
}

export function listMultiClusterHubs() {
  return listResources<MultiClusterHub>({
    apiVersion: MultiClusterHubApiVersion,
    kind: MultiClusterHubKind,
  })
}
