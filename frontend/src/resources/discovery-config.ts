/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { createResource, getResource, listResources, replaceResource } from './utils/resource-request'

export const DiscoveryConfigApiVersion = 'discovery.open-cluster-management.io/v1alpha1'
export type DiscoveryConfigApiVersionType = 'discovery.open-cluster-management.io/v1alpha1'

export const DiscoveryConfigKind = 'DiscoveryConfig'
export type DiscoveryConfigKindType = 'DiscoveryConfig'

export const DiscoveryConfigDefinition: IResourceDefinition = {
    apiVersion: DiscoveryConfigApiVersion,
    kind: DiscoveryConfigKind,
}

export interface DiscoveryConfig extends IResource {
    apiVersion: DiscoveryConfigApiVersionType
    kind: DiscoveryConfigKindType
    metadata: Metadata
    spec: {
        filters?: {
            lastActive?: number
            openShiftVersions?: string[]
        }
        credential: string
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

export function getDiscoveryConfig(metadata: { name: string; namespace: string }) {
    return getResource<DiscoveryConfig>({
        apiVersion: DiscoveryConfigApiVersion,
        kind: DiscoveryConfigKind,
        metadata,
        spec: {
            credential: '',
        },
    })
}
