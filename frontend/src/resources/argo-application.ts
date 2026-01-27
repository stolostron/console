/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ArgoApplicationApiVersion = 'argoproj.io/v1alpha1'
export type ArgoApplicationApiVersionType = 'argoproj.io/v1alpha1'

export const ArgoApplicationKind = 'Application'
export type ArgoApplicationKindType = 'Application'

export const ArgoApplicationDefinition: IResourceDefinition = {
  apiVersion: ArgoApplicationApiVersion,
  kind: ArgoApplicationKind,
}

export interface ArgoSyncPolicy {
  automated?: {
    enabled?: boolean
    selfHeal?: boolean
    prune?: boolean
    allowEmpty?: boolean
  }
  syncOptions?: string[]
}

export interface ArgoSource {
  path?: string
  repoURL: string
  targetRevision?: string
  chart?: string
  repositoryType?: string
}

type ArgoApplicationStatus = {
  cluster?: string
  resourceName?: string
  [key: string]: unknown
}

export interface ArgoApplication extends IResource {
  cluster?: string
  apiVersion: ArgoApplicationApiVersionType
  kind: ArgoApplicationKindType
  metadata: Metadata
  spec: {
    destination: {
      name?: string
      namespace?: string
      server?: string
    }
    project?: string
    source?: ArgoSource
    sources?: ArgoSource[]
    syncPolicy?: ArgoSyncPolicy
  }
  status?: ArgoApplicationStatus
  transformed?: {
    clusterCount?: string
  }
}
