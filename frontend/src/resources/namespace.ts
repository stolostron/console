/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { listResources } from '.'

export const NamespaceApiVersion = 'v1'
export type NamespaceApiVersionType = 'v1'

export const NamespaceKind = 'Namespace'
export type NamespaceKindType = 'Namespace'

export interface Namespace extends IResource {
    apiVersion: NamespaceApiVersionType
    kind: NamespaceKindType
    metadata: Metadata
}

export const NamespaceDefinition: IResourceDefinition = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
}
