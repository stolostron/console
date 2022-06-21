/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const DeploymentConfigApiVersion = 'v1'
export type DeploymentConfigApiVersionType = 'v1'

export const DeploymentConfigKind = 'DeploymentConfig'
export type DeploymentConfigKindType = 'DeploymentConfig'

export const DeploymentConfigDefinition: IResourceDefinition = {
    apiVersion: DeploymentConfigApiVersion,
    kind: DeploymentConfigKind,
}

export interface DeploymentConfig extends IResource {
    apiVersion: DeploymentConfigApiVersionType
    kind: DeploymentConfigKindType
    metadata: Metadata
}
