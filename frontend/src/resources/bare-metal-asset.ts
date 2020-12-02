import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { listResources } from '../lib/resource-request'

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

export function BMAStatusMessage(bareMetalAssets: BareMetalAsset, translation: Function) {
    GetLabels(bareMetalAssets)
    if (bareMetalAssets.status) {
        let mostCurrentStatusTime = bareMetalAssets.status!.conditions[0].lastTransitionTime
        let mostCurrentStatus = bareMetalAssets.status!.conditions[0].type
        for (let conditions of bareMetalAssets.status!.conditions) {
            if (conditions.lastTransitionTime > mostCurrentStatusTime!) {
                mostCurrentStatusTime = conditions.lastTransitionTime
                mostCurrentStatus = conditions.type
            }
            // if status time is equivalent, take the status at that was added last
            else if (conditions.lastTransitionTime === mostCurrentStatusTime) {
                mostCurrentStatusTime = conditions.lastTransitionTime
                mostCurrentStatus = conditions.type
            }
        }
        return translation(GetStatusMessage(mostCurrentStatus))
    }
    return ''
}
function GetStatusMessage(status: string) {
    switch (status) {
        // returns translation strings
        case 'CredentialsFound':
            return 'bareMetalAsset.statusMessage.credentialsFound'
        case 'AssetSyncStarted':
            return 'bareMetalAsset.statusMessage.assetSyncStarted'
        case 'ClusterDeploymentFound':
            return 'bareMetalAsset.statusMessage.clusterDeploymentFound'
        case 'AssetSyncCompleted':
            return 'bareMetalAsset.statusMessage.assetSyncCompleted'
        case 'Ready':
            return 'bareMetalAsset.statusMessage.ready'
        default:
            return ''
    }
}

export function GetLabels(bareMetalAssets: BareMetalAsset) {
    const labels = []
    const labelDict = bareMetalAssets.metadata.labels
    for (let key in labelDict) {
        labels.push(key + '=' + labelDict[key])
    }
    return labels
}

export interface BMASecret extends V1Secret {
    apiVersion: 'v1'
    kind: 'Secret'
    metadata: V1ObjectMeta
    stringData: {
        password: string
        username: string
    }
}

export function MakeId(customID?: string) {
    if (customID) {
        return customID
    }

    let result = ''
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (var i = 0; i < 5; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
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

export function unpackBareMetalAsset(bma: BareMetalAsset) {
    const unpackedBMA: Partial<BareMetalAsset> = {
        kind: bma.kind,
        apiVersion: bma.apiVersion,
        metadata: {
            name: bma.metadata.name,
            namespace: bma.metadata.namespace,
        },
        spec: {
            bmc: {
                address: bma.spec?.bmc.address!,
                credentialsName: bma.spec?.bmc.credentialsName!,
            },
            bootMACAddress: bma.spec?.bootMACAddress!,
        },
    }
    return unpackedBMA
}
