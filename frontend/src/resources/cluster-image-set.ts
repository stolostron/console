/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { listResources } from '../lib/resource-request'
import { IResourceDefinition } from './resource'

export const ClusterImageSetApiVersion = 'hive.openshift.io/v1'
export type ClusterImageSetApiVersionType = 'hive.openshift.io/v1'

export const ClusterImageSetKind = 'ClusterImageSet'
export type ClusterImageSetKindType = 'ClusterImageSet'

export const ClusterImageSetDefinition: IResourceDefinition = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
}

export type ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersionType
    kind: ClusterImageSetKindType
    metadata: V1ObjectMeta
    spec?: { releaseImage: string }
}

export function listClusterImageSets() {
    return listResources<ClusterImageSet>({
        apiVersion: ClusterImageSetApiVersion,
        kind: ClusterImageSetKind,
    })
}
