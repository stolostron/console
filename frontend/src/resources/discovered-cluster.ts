/* Copyright Contributors to the Open Cluster Management project */
import { listResources } from './utils/resource-request'
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const DiscoveredClusterApiVersion = 'discovery.open-cluster-management.io/v1'
export type DiscoveredClusterApiVersionType = 'discovery.open-cluster-management.io/v1'

export const DiscoveredClusterKind = 'DiscoveredCluster'
export type DiscoveredClusterKindType = 'DiscoveredCluster'

export const DiscoveredClusterDefinition: IResourceDefinition = {
  apiVersion: DiscoveredClusterApiVersion,
  kind: DiscoveredClusterKind,
}

export interface DiscoveredCluster extends IResource {
  apiVersion: DiscoveredClusterApiVersionType
  kind: DiscoveredClusterKindType
  metadata: Metadata
  spec: {
    name: string
    console: string
    apiUrl?: string
    displayName: string
    creationTimestamp?: string
    activityTimestamp: string
    openshiftVersion: string
    cloudProvider: string
    status: string
    type?: string
    isManagedCluster?: boolean
    rhocmClusterId?: string
    credential?: {
      apiVersion: string
      kind: string
      name: string
      namespace: string
      resourceVersion: string
      uid: string
    }
  }
}

export function listDiscoveredClusters() {
  return listResources<DiscoveredCluster>({
    apiVersion: DiscoveredClusterApiVersion,
    kind: DiscoveredClusterKind,
  })
}
