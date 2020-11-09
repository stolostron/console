import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { resourceMethods } from '../utils/resource-methods'
import { IResource } from './resource'

export const SecretApiVersion = 'v1'
export type SecretApiVersionType = 'v1'

export const SecretKind = 'Secret'
export type SecretKindType = 'Secret'

export interface Secret extends V1Secret, IResource {
    apiVersion: SecretApiVersionType
    kind: SecretKindType
    metadata: V1ObjectMeta
}

export const secretMethods = resourceMethods<Secret>({
    apiVersion: SecretApiVersion,
    kind: SecretKind,
})
