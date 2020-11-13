import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { getResource } from '../utils/resource-request'
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

export function getSecret(metadata: { name: string; namespace: string }) {
    return getResource<Secret>({ apiVersion: SecretApiVersion, kind: SecretKind, metadata })
}
