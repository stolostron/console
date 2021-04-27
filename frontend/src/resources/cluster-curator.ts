/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta, V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { IResourceDefinition } from './resource'

export const ClusterCuratorApiVersion = 'cluster.open-cluster-management.io/v1alpha1'
export type ClusterCuratorApiVersionType = 'cluster.open-cluster-management.io/v1alpha1'

export const ClusterCuratorKind = 'ClusterCurator'
export type ClusterCuratorKindType = 'ClusterCurator'

export const ClusterCuratorDefinition: IResourceDefinition = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
}

export interface ClusterCurator {
    apiVersion: ClusterCuratorApiVersionType
    kind: ClusterCuratorKindType
    metadata: V1ObjectMeta
    spec?: {
        desiredCuration: string
        install?: {
            prehook: AnsibleJob[]
            posthook: AnsibleJob[]
        }
    }
    status?: {
        conditions: V1CustomResourceDefinitionCondition[]
    }
}

export interface AnsibleJob {
    name: string
    extra_vars?: {}
}
