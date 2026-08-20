/* Copyright Contributors to the Open Cluster Management project */
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const CapiClusterApiVersion = 'cluster.x-k8s.io/v1beta1'
export type CapiClusterApiVersionType = 'cluster.x-k8s.io/v1beta1'

export const CapiClusterKind = 'Cluster'
export type CapiClusterKindType = 'Cluster'

export const CapiClusterDefinition: IResourceDefinition = {
  apiVersion: CapiClusterApiVersion,
  kind: CapiClusterKind,
}

export interface CapiClusterRef {
  apiVersion: string
  kind: string
  name: string
  namespace?: string
}

export interface CapiCluster extends IResource {
  apiVersion: CapiClusterApiVersionType
  kind: CapiClusterKindType
  metadata: Metadata
  spec?: {
    clusterNetwork?: {
      pods?: { cidrBlocks?: string[] }
      services?: { cidrBlocks?: string[] }
    }
    infrastructureRef?: CapiClusterRef
    controlPlaneRef?: CapiClusterRef
  }
  status?: {
    controlPlaneReady?: boolean
    infrastructureReady?: boolean
    phase?: string
  }
}
