/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const JobApiVersion = 'batch/v1'
export type JobApiVersionType = 'batch/v1'

export const JobKind = 'Job'
export type JobKindType = 'Job'

export interface Job extends IResource {
    apiVersion: JobApiVersionType
    kind: JobKindType
    metadata: Metadata
}

export const JobDefinition: IResourceDefinition = {
    apiVersion: JobApiVersion,
    kind: JobKind,
}
