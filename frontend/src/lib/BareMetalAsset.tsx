import { V1ObjectMeta } from '@kubernetes/client-node'
import * as YAML from 'yamljs'
import { ProviderID } from './providers'
import { GetWrapper, resourceMethods } from './Resource'
import { Metadata, Scalars } from '../sdk'

//const start = new Date(Date.now());

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
    
}

export const bareMetalAssets = resourceMethods<BareMetalAsset>({ path: '/apis/inventory.open-cluster-management.io/v1alpha1', plural: 'baremetalassets' })
// TODO: generate logic for listing BMA in edge cases, where fields are missing
const originalList = bareMetalAssets.list

bareMetalAssets.list = async (labels?: string[]) => {
    // if (!labels) {
    //     labels = ['cluster.open-cluster-management.io/cloudconnection=']
    // } else if (!labels.includes('cluster.open-cluster-management.io/cloudconnection=')) {
    //     labels.push('cluster.open-cluster-management.io/cloudconnection=')
    // }
    const result = await originalList(labels)
    // for (const bareMetalAsset of result.data) {
    //     if (bareMetalAsset?.metadata) {
    //         try {
    //             const yaml = Buffer.from(bareMetalAsset?.metadata, 'base64').toString('ascii')
    //             bareMetalAsset.stringData = YAML.parse(yaml)
    //         } catch {}
    //     }
    //     console.log(bareMetalAsset)
    // }
    return result
}

const originalCreate = bareMetalAssets.create

bareMetalAssets.create = async (bareMetalAsset: BareMetalAsset) => {

    return originalCreate(bareMetalAsset)
}

export function BareMetalAssets() {
    return GetWrapper<BareMetalAsset[]>(bareMetalAssets.list)
}

// export function getBareMetalAssetProviderID(bareMetalAsset: BareMetalAsset) {
//     const label = bareMetalAsset.metadata?.labels?.['cluster.open-cluster-management.io/provider']
//     return label as ProviderID
// }

// export function setBareMetalAssetProviderID(bareMetalAsset: BareMetalAsset, providerID: ProviderID) {
//     if (!bareMetalAsset.metadata) {
//         bareMetalAsset.metadata = {}
//     }
//     if (!bareMetalAsset.metadata.labels) {
//         bareMetalAsset.metadata.labels = {}
//     }
//     bareMetalAsset.metadata.labels['cluster.open-cluster-management.io/provider'] = providerID
//     bareMetalAsset.metadata.labels['cluster.open-cluster-management.io/cloudconnection'] = ''
// }