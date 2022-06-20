/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const CustomResourceDefinitionApiVersion = 'apiextensions.k8s.io/v1'
export type CustomResourceDefinitionApiVersionType = 'apiextensions.k8s.io/v1'

export const CustomResourceDefinitionKind = 'CustomResourceDefinition'
export type CustomResourceDefinitionKindType = 'CustomResourceDefinition'

export const CustomResourceDefinitionDefinition: IResourceDefinition = {
    apiVersion: CustomResourceDefinitionApiVersion,
    kind: CustomResourceDefinitionKind,
}

export interface CustomResourceDefinition extends IResource {
    apiVersion: CustomResourceDefinitionApiVersionType
    kind: CustomResourceDefinitionKindType
    metadata: Metadata
}
