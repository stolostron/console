/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { Selector } from './selector'
import { IResource, IResourceDefinition } from './resource'

export const ApplicationSetApiVersion = 'argoproj.io/v1alpha1'
export type ApplicationSetApiVersionType = 'argoproj.io/v1alpha1'

export const ApplicationSetKind = 'ApplicationSet'
export type ApplicationSetKindType = 'ApplicationSet'

export const ApplicationSetDefinition: IResourceDefinition = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
}

export interface ApplicationSet extends IResource {
  apiVersion: ApplicationSetApiVersionType
  kind: ApplicationSetKindType
  metadata: Metadata
  spec: {
    generators?: {
      clusterDecisionResource?: {
        configMapRef?: string
        labelSelector?: Selector
        requeueAfterSeconds?: number
      }
    }[]
    template?: {
      metadata?: Metadata
      spec?: {
        destination?: {
          namespace: string
          server: string
        }
        project: string
        source?: {
          path?: string
          repoURL: string
          targetRevision?: string
          chart?: string
        }
        sources?: {
          path?: string
          repoURL: string
          targetRevision?: string
          chart?: string
          repositoryType?: string
        }[]
        syncPolicy?: any
      }
    }
  }
  transformed?: {
    clusterCount?: string
  }
}
