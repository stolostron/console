/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const StatefulSetApiVersion = 'apps/v1'
export type StatefulSetApiVersionType = 'apps/v1'

export const StatefulSetKind = 'StatefulSet'
export type StatefulSetKindType = 'StatefulSet'

export const StatefulSetDefinition: IResourceDefinition = {
    apiVersion: StatefulSetApiVersion,
    kind: StatefulSetKind,
}

export interface StatefulSet extends IResource {
    apiVersion: StatefulSetApiVersionType
    kind: StatefulSetKindType
    metadata: Metadata
}
