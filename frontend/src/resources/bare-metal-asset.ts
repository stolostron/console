import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { createResource, listResources, getResource } from '../lib/resource-request'
import { SecretApiVersionType, SecretKindType } from './secret'

export const BareMetalAssetApiVersion = 'inventory.open-cluster-management.io/v1alpha1'
export type BareMetalAssetApiVersionType = 'inventory.open-cluster-management.io/v1alpha1'

export const BareMetalAssetKind = 'BareMetalAsset'
export type BareMetalAssetKindType = 'BareMetalAsset'

export interface BareMetalAsset {
    apiVersion: BareMetalAssetApiVersionType
    kind: BareMetalAssetKindType
    metadata: V1ObjectMeta
    spec?: {
        bmc: {
            address: string
            credentialsName: string
        }
        bootMACAddress: string
    }
    status?: {
        conditions: Array<{
            lastTransitionTime: Date
            message: string
            reason: string
            status: string
            type: string
        }>
    }
}

export interface BMASecret extends V1Secret {
    apiVersion: SecretApiVersionType
    kind: SecretKindType
    metadata: V1ObjectMeta
    stringData: {
        password: string
        username: string
    }
}

export function getBareMetalAsset(metadata: Object) {
    return getResource<BareMetalAsset>({
        kind: BareMetalAssetKind,
        apiVersion: BareMetalAssetApiVersion,
        metadata,
    })
}

export function listBareMetalAssets() {
    const result = listResources<BareMetalAsset>({
        apiVersion: BareMetalAssetApiVersion,
        kind: BareMetalAssetKind,
    })
    return {
        promise: result.promise.then((bareMetalAssets) => {
            return bareMetalAssets
        }),
        abort: result.abort,
    }
}

export function createBareMetalAsset(asset: {
    name: string
    namespace: string
    bootMACAddress: string
    bmc: { address: string; username: string; password: string }
}) {
    const {
        name,
        namespace,
        bootMACAddress,
        bmc: { address, username, password },
    } = asset
    const credentialsName = `${name}-bmc-secret`
    return new Promise((resolve, reject) => {
        // create the secret
        createResource<BMASecret>({
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: {
                name: credentialsName,
                namespace,
            },
            stringData: {
                password,
                username,
            },
        })
            .promise.then((secret) => {
                // create the asset
                createResource<BareMetalAsset>({
                    apiVersion: BareMetalAssetApiVersion,
                    kind: BareMetalAssetKind,
                    metadata: {
                        name,
                        namespace,
                    },
                    spec: {
                        bmc: {
                            address,
                            credentialsName: secret.metadata.name ?? '',
                        },
                        bootMACAddress,
                    },
                })
                    .promise.then((bma) => {
                        resolve(bma)
                    })
                    .catch((err: Error) => {
                        reject(err)
                    })
            })
            .catch((err: Error) => {
                reject(err)
            })
    })
}
