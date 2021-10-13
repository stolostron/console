/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const ApplicationApiVersion = 'app.k8s.io/v1beta1'
export type ApplicationApiVersionType = 'app.k8s.io/v1beta1'

export const ApplicationKind = 'Application'
export type ApplicationKindType = 'Application'

export const ApplicationDefinition: IResourceDefinition = {
    apiVersion: ApplicationApiVersion,
    kind: ApplicationKind,
}

export interface Application extends IResource {
    apiVersion: ApplicationApiVersionType
    kind: ApplicationKindType
    metadata: Metadata
}
