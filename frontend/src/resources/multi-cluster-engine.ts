/* Copyright Contributors to the Open Cluster Management project */

import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { listResources } from './utils/resource-request'

export const MultiClusterEngineApiVersion = 'multicluster.openshift.io/v1'
export type MultiClusterEngineApiVersionType = 'multicluster.openshift.io/v1'

export const MultiClusterEngineKind = 'MultiClusterEngine'
export type MultiClusterEngineKindType = 'MultiClusterEngine'

export const MultiClusterEngineDefinition: IResourceDefinition = {
    apiVersion: MultiClusterEngineApiVersion,
    kind: MultiClusterEngineKind,
}

export interface MultiClusterEngine extends IResource {
    apiVersion: MultiClusterEngineApiVersionType
    kind: MultiClusterEngineKindType
    metadata: Metadata & { generation: number }
    spec?: {
        availabilityConfig: string
        imagePullSecret: string
        overrides: {
            components: { enabled: boolean; name: string }[]
        }
        targetNamespace: string
        tolerations: { effect: string; key: string; operator: string }[]
    }
    status?: any
}

export function listMultiClusterEngines() {
    return listResources<MultiClusterEngine>({
        apiVersion: MultiClusterEngineApiVersion,
        kind: MultiClusterEngineKind,
    })
}
