/* Copyright Contributors to the Open Cluster Management project */

import { V1ConfigMap } from '@kubernetes/client-node/dist/gen/model/v1ConfigMap'
import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResource, IResourceDefinition } from './resource'

export const ConfigMapApiVersion = 'v1'
export type ConfigMapApiVersionType = 'v1'

export const ConfigMapKind = 'ConfigMap'
export type ConfigMapKindType = 'ConfigMap'

export const ConfigMapDefinition: IResourceDefinition = {
    apiVersion: ConfigMapApiVersion,
    kind: ConfigMapKind,
}

export interface ConfigMap extends V1ConfigMap, IResource {
    apiVersion: ConfigMapApiVersionType
    kind: ConfigMapKindType
    metadata: V1ObjectMeta
    data?: Record<string, any>
}
