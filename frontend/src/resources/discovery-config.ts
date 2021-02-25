/* Copyright Contributors to the Open Cluster Management project */

import { IResource, IResourceDefinition } from './resource'
import { V1ObjectMeta } from '@kubernetes/client-node'
import { createResource, listResources, getResource, replaceResource } from '../lib/resource-request'

export const DiscoveryConfigApiVersion = 'discovery.open-cluster-management.io/v1'
export type DiscoveryConfigApiVersionType = 'discovery.open-cluster-management.io/v1'

export const DiscoveryConfigKind = 'DiscoveryConfig'
export type DiscoveryConfigKindType = 'DiscoveryConfig'

export const DiscoveryConfigDefinition: IResourceDefinition = {
    apiVersion: DiscoveryConfigApiVersion,
    kind: DiscoveryConfigKind,
}

export interface DiscoveryConfig extends IResource {
    apiVersion: DiscoveryConfigApiVersionType
    kind: DiscoveryConfigKindType
    metadata: V1ObjectMeta
    spec: {
        filters?: {
            lastActive?: number
            openShiftVersions?: string[]
        }
        providerConnections?: string[]
    }
}

export function listDiscoveryConfigs() {
    return listResources<DiscoveryConfig>({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
    })
}

export function createDiscoveryConfig(discoveryConfig: DiscoveryConfig) {
    return createResource<DiscoveryConfig>(discoveryConfig)
}

export function replaceDiscoveryConfig(discoveryConfig: DiscoveryConfig) {
    return replaceResource<DiscoveryConfig>(discoveryConfig)
}

export function getDiscoveryConfig(namespace: string) {
    return getResource<DiscoveryConfig>({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
        metadata: {
            name: 'discovery',
            namespace: namespace,
        },
        spec: {},
    })
}
