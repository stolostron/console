/* Copyright Contributors to the Open Cluster Management project */
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const SearchOperatorApiVersion = 'search.open-cluster-management.io/v1alpha1'
export type SearchOperatorApiVersionType = 'search.open-cluster-management.io/v1alpha1'

export const SearchOperatorKind = 'Search'
export type SearchOperatorKindType = 'Search'

export const SearchOperatorDefinition: IResourceDefinition = {
  apiVersion: SearchOperatorApiVersion,
  kind: SearchOperatorKind,
}

export interface SearchOperator extends IResource {
  apiVersion: SearchOperatorApiVersionType
  kind: SearchOperatorKindType
  metadata: Metadata
  // spec?: {
  //   dbStorage: {
  //     size: string
  //   }
  //   deployments: {
  //     collector: any
  //     database: any
  //     indexer: any
  //     queryapi: any
  //   }
  //   tolerations: { effect: string; key: string; operator: string }[]
  // }
  status?: {
    conditions: V1CustomResourceDefinitionCondition[]
  }
}
