/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ClusterExtensionApiVersion = 'olm.operatorframework.io/v1'
export type ClusterExtensionApiVersionType = 'olm.operatorframework.io/v1'

export const ClusterExtensionKind = 'ClusterExtension'
export type ClusterExtensionKindType = 'ClusterExtension'

export const ClusterExtensionDefinition: IResourceDefinition = {
  apiVersion: ClusterExtensionApiVersion,
  kind: ClusterExtensionKind,
}

export interface ClusterExtension extends IResource {
  apiVersion: ClusterExtensionApiVersionType
  kind: ClusterExtensionKindType
  metadata: Metadata
  spec: {
    namespace?: string
    source?: {
      sourceType?: string
      catalog?: {
        packageName?: string
      }
    }
  }
  status?: {
    conditions?: {
      lastTransitionTime?: string
      message?: string
      reason?: string
      status: string
      type: string
    }[]
    install?: {
      bundle?: {
        name?: string
        version?: string
      }
    }
  }
}

export function isClusterExtensionInstalled(clusterExtension: ClusterExtension): boolean {
  return clusterExtension.status?.conditions?.find((condition) => condition.type === 'Installed')?.status === 'True'
}

export function getClusterExtensionPackageName(clusterExtension: ClusterExtension): string | undefined {
  return clusterExtension.spec?.source?.catalog?.packageName
}

export function getClusterExtensionVersion(clusterExtension: ClusterExtension): string | undefined {
  return clusterExtension.status?.install?.bundle?.version
}

/** Marker label so consumers can tell Subscription-shaped results came from a ClusterExtension. */
export const CLUSTER_EXTENSION_SOURCE_LABEL = 'console.open-cluster-management.io/source'
