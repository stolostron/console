import { V1ObjectMeta, V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { listNamespacedResources, listResources, getResource } from '../lib/resource-request'
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

export type OpenShiftDistributionInfo = {
    version: string
    availableUpdates: string[]
    desiredVersion: string
    upgradeFailed: boolean
}

export interface ManagedClusterInfo extends IResource {
    apiVersion: ManagedClusterInfoApiVersionType
    kind: ManagedClusterInfoKindType
    metadata: V1ObjectMeta
    spec?: {
        loggingCA?: string
        masterEndpoint?: string
    }
    status?: {
        conditions?: V1CustomResourceDefinitionCondition[]
        version?: string
        kubeVendor?: string
        cloudVendor?: string
        clusterID?: string
        distributionInfo?: {
            type: string
            ocp: OpenShiftDistributionInfo
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

export function listMCIs() {
    return listResources<ManagedClusterInfo>(
        {
            apiVersion: ManagedClusterInfoApiVersion,
            kind: ManagedClusterInfoKind,
        },
        undefined,
        undefined,
        { managedNamespacesOnly: '' }
    )
}

export function getManagedClusterInfo(namespace: string, name: string) {
    return getResource<ManagedClusterInfo>({
        apiVersion: ManagedClusterInfoApiVersion,
        kind: ManagedClusterInfoKind,
        metadata: { namespace, name },
    })
}
