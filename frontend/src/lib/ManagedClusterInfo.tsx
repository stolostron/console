import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, ResourceList, resourceMethods, GetWrapper } from './Resource'
export interface NodeInfo {
    name?: string
    labels?: {[key: string]: string}
    capacity?: {[key: string]: string}
    conditions?: {
        status: string
        type: string
    }[]
}
export interface ManagedClusterInfo extends IResource {
    apiVersion: string
    kind: 'ManagedClusterInfo'
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

export const managedClusterInfos = resourceMethods<ManagedClusterInfo>({
    path: '/apis/internal.open-cluster-management.io/v1beta1',
    plural: 'managedclusterinfos',
})

export function ListManagedClusterInfos(namespace: string) {
    const restFunc = () => {
        return managedClusterInfos.listNamespace(namespace)
    }
    return GetWrapper<ResourceList<ManagedClusterInfo>>(restFunc)
}

