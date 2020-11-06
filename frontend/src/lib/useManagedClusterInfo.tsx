import { V1ObjectMeta } from '@kubernetes/client-node'
import { useCallback } from 'react'
import { IResource, ResourceList } from '../library/resources/resource'
import { resourceMethods } from '../library/utils/resource-methods'
import { useQuery } from './useQuery'

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

export const managedClusterInfoMethods = resourceMethods<ManagedClusterInfo>({
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
})

export function useManagedClusterInfos(namespace: string) {
    const restFunc = useCallback(() => {
        return managedClusterInfoMethods.listNamespace(namespace)
    }, [namespace])
    return useQuery<ResourceList<ManagedClusterInfo>>(restFunc)
}
