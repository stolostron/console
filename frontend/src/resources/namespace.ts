/* Copyright Contributors to the Open Cluster Management project */
import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResource } from './resource'

export const NamespaceApiVersion = 'v1'
export type NamespaceApiVersionType = 'v1'

export const NamespaceKind = 'Namespace'
export type NamespaceKindType = 'Namespace'

export interface Namespace extends IResource {
    apiVersion: NamespaceApiVersionType
    kind: NamespaceKindType
    metadata: V1ObjectMeta
}
