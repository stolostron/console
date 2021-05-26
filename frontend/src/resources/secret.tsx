/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { V1Secret } from '@kubernetes/client-node/dist/gen/model/v1Secret'
import { getResource, listNamespacedResources } from '../lib/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const SecretApiVersion = 'v1'
export type SecretApiVersionType = 'v1'

export const SecretKind = 'Secret'
export type SecretKindType = 'Secret'

export const SecretDefinition: IResourceDefinition = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
}

export interface Secret extends V1Secret, IResource {
    apiVersion: SecretApiVersionType
    kind: SecretKindType
    metadata: V1ObjectMeta
}

export function getSecret(metadata: { name: string; namespace: string }) {
    return getResource<Secret>({ apiVersion: SecretApiVersion, kind: SecretKind, metadata })
}

export function unpackSecret(secret: Secret | Partial<Secret>) {
    if (secret.data) {
        if (!secret.stringData) secret.stringData = {}
        for (const key in secret.data) {
            secret.stringData[key] = Buffer.from(secret.data[key], 'base64').toString('ascii')
        }
    }
    return secret
}

export function listNamespaceSecrets(namespace: string) {
    return listNamespacedResources<Secret>({ apiVersion: SecretApiVersion, kind: SecretKind, metadata: { namespace } })
}
