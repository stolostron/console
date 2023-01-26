/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const DaemonSetApiVersion = 'apps/v1'
export type DaemonSetApiVersionType = 'apps/v1'

export const DaemonSetKind = 'DaemonSet'
export type DaemonSetKindType = 'DaemonSet'

export interface DaemonSet extends IResource {
  apiVersion: DaemonSetApiVersionType
  kind: DaemonSetKindType
  metadata: Metadata
}

export const DaemonSetDefinition: IResourceDefinition = {
  apiVersion: DaemonSetApiVersion,
  kind: DaemonSetKind,
}
