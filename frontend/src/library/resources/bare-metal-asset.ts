import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { ResourceList } from './resource'
import { resourceMethods } from '../utils/resource-methods'
//import { ProviderID } from '../../lib/providers'
import { useQuery } from '../../lib/useQuery'

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

export const bareMetalAssets = resourceMethods<BareMetalAsset>({
    apiVersion: BareMetalAssetApiVersion,
    kind: BareMetalAssetKind
})
// TODO: generate logic for listing BMA in edge cases, where fields are missing
const originalList = bareMetalAssets.list

bareMetalAssets.list = async (labels?: string[]) => {
    const result = await originalList(labels)
    return result
}

const originalCreate = bareMetalAssets.create

bareMetalAssets.create = async (bareMetalAsset: BareMetalAsset) => {
    return originalCreate(bareMetalAsset)
}

export function BareMetalAssets() {
    return useQuery<ResourceList<BareMetalAsset>>(bareMetalAssets.list)
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
    kind: 'secret',
    metadata: V1ObjectMeta
    data: {
        password: string,
        username: string,
    }
}

export const bmaSecrets = resourceMethods<BMASecret>({ apiVersion: 'v1', kind: 'Secret' })

const originalSecretCreate = bmaSecrets.create

bmaSecrets.create = async (bmaSecrets: BMASecret) => {
    return originalSecretCreate(bmaSecrets)
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

