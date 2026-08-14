/* Copyright Contributors to the Open Cluster Management project */
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const AWSClusterControllerIdentityApiVersion = 'infrastructure.cluster.x-k8s.io/v1beta2'
export type AWSClusterControllerIdentityApiVersionType = 'infrastructure.cluster.x-k8s.io/v1beta2'

export const AWSClusterControllerIdentityKind = 'AWSClusterControllerIdentity'
export type AWSClusterControllerIdentityKindType = 'AWSClusterControllerIdentity'

export const AWSClusterControllerIdentityDefinition: IResourceDefinition = {
  apiVersion: AWSClusterControllerIdentityApiVersion,
  kind: AWSClusterControllerIdentityKind,
}

export const AWS_CLUSTER_CONTROLLER_IDENTITY_DEFAULT_NAME = 'default'

export interface AWSClusterControllerIdentity extends IResource {
  apiVersion: AWSClusterControllerIdentityApiVersionType
  kind: AWSClusterControllerIdentityKindType
  metadata: Metadata
  spec?: {
    allowedNamespaces?: Record<string, unknown> | null
  }
}
