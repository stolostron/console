/* Copyright Contributors to the Open Cluster Management project */
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const ROSAClusterApiVersion = 'infrastructure.cluster.x-k8s.io/v1beta2'
export type ROSAClusterApiVersionType = 'infrastructure.cluster.x-k8s.io/v1beta2'

export const ROSAClusterKind = 'ROSACluster'
export type ROSAClusterKindType = 'ROSACluster'

export const ROSAClusterDefinition: IResourceDefinition = {
  apiVersion: ROSAClusterApiVersion,
  kind: ROSAClusterKind,
}

export interface ROSACluster extends IResource {
  apiVersion: ROSAClusterApiVersionType
  kind: ROSAClusterKindType
  metadata: Metadata
  spec?: {
    controlPlaneEndpoint?: {
      host?: string
      port?: number
    }
  }
  status?: {
    ready?: boolean
    conditions?: {
      type: string
      status: string
      lastTransitionTime: string
      reason?: string
      message?: string
      severity?: string
    }[]
  }
}
