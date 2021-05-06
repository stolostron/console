/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { listResources } from '../lib/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const DiscoveredClusterApiVersion = 'discovery.open-cluster-management.io/v1'
export type DiscoveredClusterApiVersionType = 'discovery.open-cluster-management.io/v1'

export const DiscoveredClusterKind = 'DiscoveredCluster'
export type DiscoveredClusterKindType = 'DiscoveredCluster'

export const DiscoveredClusterDefinition: IResourceDefinition = {
    apiVersion: DiscoveredClusterApiVersion,
    kind: DiscoveredClusterKind,
}

export interface DiscoveredCluster extends IResource {
    apiVersion: DiscoveredClusterApiVersionType
    kind: DiscoveredClusterKindType
    metadata: V1ObjectMeta
    spec: {
        name: string
        console: string
        display_name: string
        creation_timestamp?: string
        activity_timestamp: string
        openshiftVersion: string
        cloudProvider: string
        status: string
        isManagedCluster?: boolean
        credential?: {
            apiVersion: string
            kind: string
            name: string
            namespace: string
            resourceVersion: string
            uid: string
        }
    }
}

export function listDiscoveredClusters() {
    return listResources<DiscoveredCluster>({
        apiVersion: DiscoveredClusterApiVersion,
        kind: DiscoveredClusterKind,
    })
}
