/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const NodePoolApiVersion = 'hypershift.openshift.io/v1beta1'
export type NodePoolApiVersionType = 'hypershift.openshift.io/v1beta1'

export const NodePoolKind = 'NodePool'
export type NodePoolKindType = 'NodePool'

export const NodePoolDefinition: IResourceDefinition = {
  apiVersion: NodePoolApiVersion,
  kind: NodePoolKind,
}

export interface NodePool extends IResource {
  apiVersion: NodePoolApiVersionType
  kind: NodePoolKindType
  metadata: Metadata
  spec: {
    clusterName: string
    management: any
    platform: {
      aws?: {
        instanceProfile: string
        instanceType: string
        rootVolume: {
          size: number
          type: string
        }
        securityGroups: any[]
        subnet: {
          id: string
        }
      }
      type: string
    }
    release: {
      image: string
    }
    replicas: number
  }
  status?: {
    conditions?: {
      type: string
      status: string
      reason: string
      message: string
    }[]
    version: string
  }
}
