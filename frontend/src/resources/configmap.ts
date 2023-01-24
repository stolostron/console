/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '.'
import { Metadata } from './metadata'
import { IResourceDefinition } from './resource'

export const ConfigMapApiVersion = 'v1'
export type ConfigMapApiVersionType = 'v1'

export const ConfigMapKind = 'ConfigMap'
export type ConfigMapKindType = 'ConfigMap'

export const ConfigMapDefinition: IResourceDefinition = {
  apiVersion: ConfigMapApiVersion,
  kind: ConfigMapKind,
}

export interface ConfigMap extends IResource {
  apiVersion: ConfigMapApiVersionType
  kind: ConfigMapKindType
  metadata: Metadata
  data?: Record<string, any>
}
