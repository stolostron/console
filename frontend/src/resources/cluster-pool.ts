/* Copyright Contributors to the Open Cluster Management project */
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ClusterPoolApiVersion = 'hive.openshift.io/v1'
export type ClusterPoolApiVersionType = 'hive.openshift.io/v1'

export const ClusterPoolKind = 'ClusterPool'
export type ClusterPoolKindType = 'ClusterPool'

export const ClusterPoolDefinition: IResourceDefinition = {
  apiVersion: ClusterPoolApiVersion,
  kind: ClusterPoolKind,
}

export interface ClusterPool extends IResource {
  apiVersion: ClusterPoolApiVersionType
  kind: ClusterPoolKindType
  metadata: Metadata
  spec?: {
    baseDomain: string
    installConfigSecretTemplateRef: {
      name: string
    }
    imageSetRef: {
      name: string
    }
    platform?: {
      aws?: {
        credentialsSecretRef: {
          name: string
        }
        region: string
        privateLink?: {
          enabled: boolean
        }
      }
      gcp?: {
        credentialsSecretRef: {
          name: string
        }
      }
      azure?: {
        credentialsSecretRef: {
          name: string
        }
      }
    }
    pullSecretRef: {
      name: string
    }
    size: number
    runningCount?: number
    skipMachinePools?: boolean
  }
  status?: {
    conditions: V1CustomResourceDefinitionCondition[]
    ready?: number
    standby?: number
    size?: number
  }
}

export const clusterPoolNamespaceLabels = Object.freeze({ 'open-cluster-management.io/managed-by': 'clusterpools' })

export function isClusterPoolDeleting(clusterPool: ClusterPool) {
  return !!clusterPool?.metadata?.deletionTimestamp
}
