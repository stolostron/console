/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta, V1Secret } from '@kubernetes/client-node'
import { createResource, listResources, getResource } from '../lib/resource-request'
import { IResourceDefinition } from './resource'
import { IRequestResult } from '../lib/resource-request'

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
        install?:{
            prehook: ansibleJob[]
            posthook: ansibleJob[]
        }
    }
}

export interface ansibleJob {
        name: string
        extra_vars?: {}
        
}

export function createClusterCurator(clusterCurator:ClusterCurator){
    if (!clusterCurator.metadata) {
        clusterCurator.metadata = {}
    }
    if (!clusterCurator.metadata.labels) {
        clusterCurator.metadata.labels = {}
    }
    clusterCurator.metadata.labels['open-cluster-management'] = 'curator'
    return createResource<ClusterCurator>(clusterCurator)
}

