import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { listResources, createResource } from '../lib/resource-request'

export const BareMetalAssetApiVersion = 'inventory.open-cluster-management.io/v1alpha1'
export type BareMetalAssetApiVersionType = 'inventory.open-cluster-management.io/v1alpha1'

export const BareMetalAssetKind = 'BareMetalAsset'
export type BareMetalAssetKindType = 'BareMetalAsset'

export interface BareMetalAsset {
    apiVersion: BareMetalAssetApiVersionType
    kind: BareMetalAssetKindType
    metadata: V1ObjectMeta
    spec: {
        bmc: {
            address: string
            credentialsName: string
        }
        bootMac: string
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

export function BMAStatusMessage(bareMetalAssets: BareMetalAsset) {
    const KNOWN_STATUSES = [
        'CredentialsFound',
        'AssetSyncStarted',
        'ClusterDeploymentFound',
        'AssetSyncCompleted',
        'Ready',
    ]
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
        return GetStatusMessage(mostCurrentStatus)
    }
    return ''
}
function GetStatusMessage(status: string) {
    switch (status) {
        case 'CredentialsFound':
            return 'No credentials'
        case 'AssetSyncStarted':
            return 'Asset syncing'
        case 'ClusterDeploymentFound':
            return 'No cluster deployment'
        case 'AssetSyncCompleted':
            return 'Asset sync failed'
        case 'Ready':
            return 'Ready'
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
// TODO - should this be moved to or combined with ./Secrets.tsx ?
export interface BMASecret extends V1Secret {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: V1ObjectMeta
    data: {
        password: string,
        username: string,
    }
}

export function MakeId(customID?: string) {
    if(customID){
        return customID
    }

    let result           = ''
    const characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length
    for ( var i = 0; i < 5; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result
 }

 export function createBareMetalAsset(bareMetalAsset: BareMetalAsset) {
    const copy = { ...bareMetalAsset }
    return createResource<BareMetalAsset>(copy)
}

export function listBareMetalAssets() {
    const result = listResources<BareMetalAsset>(
        {
            apiVersion: BareMetalAssetApiVersion,
            kind: BareMetalAssetKind,
        },
    )
    return {
        promise: result.promise.then((bareMetalAssets) => {
            for (const bareMetalAsset of bareMetalAssets) {
                bareMetalAsset.apiVersion = BareMetalAssetApiVersion
                bareMetalAsset.kind = BareMetalAssetKind
            }
            return bareMetalAssets
        }),
        abort: result.abort,
    }
}