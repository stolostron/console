/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const CronJobApiVersion = 'batch/v1'
export type CronJobApiVersionType = 'batch/v1'

export const CronJobKind = 'CronJob'
export type CronJobKindType = 'CronJob'

export const CronJobDefinition: IResourceDefinition = {
    apiVersion: CronJobApiVersion,
    kind: CronJobKind,
}

export interface CronJob extends IResource {
    apiVersion: CronJobApiVersionType
    kind: CronJobKindType
    metadata: Metadata
}
