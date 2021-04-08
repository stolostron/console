/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { listResources } from '../lib/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const ManagedClusterInfoApiVersion = 'internal.open-cluster-management.io/v1beta1'
export type ManagedClusterInfoApiVersionType = 'internal.open-cluster-management.io/v1beta1'

export const ManagedClusterInfoKind = 'ManagedClusterInfo'
export type ManagedClusterInfoKindType = 'ManagedClusterInfo'

export const ManagedClusterInfoDefinition: IResourceDefinition = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
}

export interface NodeInfo {
    name?: string
    labels?: { [key: string]: string }
    capacity?: { cpu: string; memory: string }
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

export function listMCIs() {
    return listResources<ManagedClusterInfo>(
        {
            apiVersion: ManagedClusterInfoApiVersion,
            kind: ManagedClusterInfoKind,
        },
        undefined,
        { managedNamespacesOnly: '' }
    )
}
