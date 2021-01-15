import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { listResources, getResource } from '../lib/resource-request'
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
