import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { createResource, listResources, getResource } from '../lib/resource-request'
import { SecretApiVersionType, SecretKindType } from './secret'
import { IResourceDefinition } from './resource'

export const BareMetalAssetApiVersion = 'inventory.open-cluster-management.io/v1alpha1'
export type BareMetalAssetApiVersionType = 'inventory.open-cluster-management.io/v1alpha1'

export const BareMetalAssetKind = 'BareMetalAsset'
export type BareMetalAssetKindType = 'BareMetalAsset'

export const BareMetalAssetDefinition: IResourceDefinition = {
    apiVersion: BareMetalAssetApiVersion,
    kind: BareMetalAssetKind,
}

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

export function createBareMetalAssetResource(asset: {
    name: string
    namespace: string
    bootMACAddress: string
    bmc: { address: string }
}) {
    const {
        name,
        namespace,
        bootMACAddress,
        bmc: { address },
    } = asset
    const credentialsName = `${name}-bmc-secret`
    return createResource<BareMetalAsset>({
        apiVersion: BareMetalAssetApiVersion,
        kind: BareMetalAssetKind,
        metadata: {
            name,
            namespace,
        },
        spec: {
            bmc: {
                address,
                credentialsName: credentialsName,
            },
            bootMACAddress,
        },
    })
}

export function createBareMetalAssetSecret(asset: {
    name: string
    namespace: string
    bmc: { username: string; password: string }
}) {
    const {
        name,
        namespace,
        bmc: { username, password },
    } = asset
    const credentialsName = `${name}-bmc-secret`
    return !username
        ? Promise.resolve()
        : createResource<BMASecret>({
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
}
