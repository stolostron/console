/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { Selector } from './selector'
import { IResource, IResourceDefinition } from './resource'
import { ArgoSyncPolicy, ArgoSource } from './argo-application'

export const ApplicationSetApiVersion = 'argoproj.io/v1alpha1'
export type ApplicationSetApiVersionType = 'argoproj.io/v1alpha1'

export const ApplicationSetKind = 'ApplicationSet'
export type ApplicationSetKindType = 'ApplicationSet'

export const APPLICATION_SET_GITOPS_MODEL_ANNOTATION = 'apps.open-cluster-management.io/gitops-model'

export const ApplicationSetDefinition: IResourceDefinition = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
}

type AppSetPlacementDataType = (string | string[])[]

export interface ApplicationSetSyncPolicy {
  preserveResourcesOnDeletion?: boolean
}

export interface AppSetGenerator {
  clusterDecisionResource?: {
    configMapRef?: string
    labelSelector?: Selector
    requeueAfterSeconds?: number
  }
  matrix?: {
    generators?: AppSetGenerator[]
  }
  merge?: {
    generators?: AppSetGenerator[]
  }
}

export interface ApplicationSet extends IResource {
  apiVersion: ApplicationSetApiVersionType
  kind: ApplicationSetKindType
  metadata: Metadata
  spec: {
    generators?: AppSetGenerator[]
    syncPolicy?: ApplicationSetSyncPolicy
    template?: {
      metadata?: Metadata
      spec?: {
        destination?: {
          namespace: string
          server?: string
          name?: string
        }
        project: string
        source?: ArgoSource
        sources?: ArgoSource[]
        syncPolicy?: ArgoSyncPolicy
      }
    }
  }
  transformed?: {
    clusterCount?: string
  }
  uidata?: {
    appSetPlacementData: AppSetPlacementDataType
  }
}
