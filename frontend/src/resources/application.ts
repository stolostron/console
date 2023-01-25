/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { Selector } from './selector'
import { IResource, IResourceDefinition } from './resource'
import { ApplicationSetApiVersion } from './application-set'

export const ApplicationApiVersion = 'app.k8s.io/v1beta1'
export type ApplicationApiVersionType = 'app.k8s.io/v1beta1'

export const ApplicationKind = 'Application'
export type ApplicationKindType = 'Application'

export const ApplicationDefinition: IResourceDefinition = {
  apiVersion: ApplicationApiVersion,
  kind: ApplicationKind,
}

export const DiscoveredArgoApplicationDefinition: IResourceDefinition = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationKind,
}

export interface Application extends IResource {
  apiVersion: ApplicationApiVersionType
  kind: ApplicationKindType
  metadata: Metadata
  spec: {
    componentKinds: {
      group: string
      kind: string
    }[]
    selector?: Selector | null
  }
  transformed?: {
    clusterCount?: string
  }
}
