/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from '../../../src/common/resource'

export const ConfigMapApiVersion = 'v1'
export type ConfigMapApiVersionType = 'v1'

export const ConfigMapKind = 'ConfigMap'
export type ConfigMapKindType = 'ConfigMap'

export interface ConfigMap extends IResource {
    apiVersion: ConfigMapApiVersionType
    kind: ConfigMapKindType
    metadata: { name?: string; namespace?: string }
    data?: Record<string, any>
}
