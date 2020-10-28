import { V1ObjectMeta } from '@kubernetes/client-node'
import { GetWrapper, resourceMethods } from './Resource'

export interface BareMetalAsset {
    apiVersion: 'inventory.open-cluster-management.io/v1alpha1'
    kind: 'BareMetalAsset'
    metadata: V1ObjectMeta
    spec: {
        bmc: {
            address: string
            credentialsName: string
        }
    }
    status: {
        conditions: Array<{
            lastTransitionTime: Date
            message: string
            reason: string
            status: string
            type: string
        }>
    }
}

export const bareMetalAssets = resourceMethods<BareMetalAsset>({ path: '/apis/inventory.open-cluster-management.io/v1alpha1', plural: 'baremetalassets' })
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
    return GetWrapper<BareMetalAsset[]>(bareMetalAssets.list)
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

    let mostCurrentStatusTime = bareMetalAssets.status.conditions[0].lastTransitionTime
    let mostCurrentStatus = bareMetalAssets.status.conditions[0].type
   for (let conditions of bareMetalAssets.status.conditions){
        if(conditions.lastTransitionTime > mostCurrentStatusTime){
            mostCurrentStatusTime = conditions.lastTransitionTime
            mostCurrentStatus = conditions.type
        }
        // if status time is equivalent, take the status at that was added last
        else if (conditions.lastTransitionTime === mostCurrentStatusTime){
            mostCurrentStatusTime = conditions.lastTransitionTime
            mostCurrentStatus = conditions.type
        }
   }

    return GetStatusMessage(mostCurrentStatus)
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

export function GetLabels(bareMetalAssets: BareMetalAsset){
    const labels = []
    const labelDict = bareMetalAssets.metadata.labels
    for (let key in labelDict){
        labels.push(key + '=' +labelDict[key])
    }
    return labels
}