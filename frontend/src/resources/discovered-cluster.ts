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
        activity_timestamp: string
        cloudProvider: string
        console: string
        creation_timestamp?: string
        name: string
        openshiftVersion: string
        providerConnections?: {
            apiVersion: string
            kind: string
            name: string
            namespace: string
            resourceVersion: string
            uid: string
        }[]
        status: string
    }
}

export function listDiscoveredClusters() {
    return listResources<DiscoveredCluster>(
        {
            apiVersion: DiscoveredClusterApiVersion,
            kind: DiscoveredClusterKind,
        },
        ['isManagedCluster!=true']
    ) // do not list discovered clusters that are already managed
}
