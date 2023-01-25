/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const DeploymentApiVersion = 'apps/v1'
export type DeploymentApiVersionType = 'apps/v1'

export const DeploymentKind = 'Deployment'
export type DeploymentKindType = 'Deployment'

export interface Deployment extends IResource {
  apiVersion: DeploymentApiVersionType
  kind: DeploymentKindType
  metadata: Metadata
}

export const DeploymentDefinition: IResourceDefinition = {
  apiVersion: DeploymentApiVersion,
  kind: DeploymentKind,
}
