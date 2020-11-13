import { V1ObjectMeta } from '@kubernetes/client-node'
import { listNamespacedResources } from '../lib/resource-request'
import { IResource } from './resource'

export const ManagedClusterInfoApiVersion = 'internal.open-cluster-management.io/v1beta1'
export type ManagedClusterInfoApiVersionType = 'internal.open-cluster-management.io/v1beta1'

export const ManagedClusterInfoKind = 'ManagedClusterInfo'
export type ManagedClusterInfoKindType = 'ManagedClusterInfo'

export interface NodeInfo {
    name?: string
    labels?: { [key: string]: string }
    capacity?: { [key: string]: string }
    conditions?: {
        status: string
        type: string
    }[]
}

export interface ManagedClusterInfo extends IResource {
    apiVersion: ManagedClusterInfoApiVersionType
    kind: ManagedClusterInfoKindType
    metadata: V1ObjectMeta
    spec: {
        loggingCA?: string
        MasterEndpoiont?: string
    }
    status: {
        conditions?: {
            lastTransitionTime: string
            message: string
            reason: string
            status: string
            type: string
        }[]
        version?: string
        kubeVendor?: string
        cloudVendor?: string
        clusterID?: string
        distributionInfo?: {
            type: string
            ocp: {
                version: string
                availableUpdates: string[]
                desiredVersion: string
                upgradeFailed: boolean
            }
        }
        consoleURL?: string
        nodeList?: NodeInfo[]
        loggingEndpoint?: {
            ip: string
            hostname?: string
            nodeName?: string
            targetRef?: {
                kind?: string
                namespace?: string
                name?: string
                uid?: string
                apiVersion?: string
                resourceVersion?: string
                fieldPath?: string
            }
        }
        loggingPort?: {
            name?: string
            port: number
            protocol?: string
            appProtocol?: string
        }
    }
}

export function listManagedClusterInfos(namespace: string) {
    return listNamespacedResources<ManagedClusterInfo>({
        apiVersion: ManagedClusterInfoApiVersion,
        kind: ManagedClusterInfoKind,
        metadata: { namespace },
    })
}
