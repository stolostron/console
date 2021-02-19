import { IResource, IResourceDefinition } from './resource'
import { V1ObjectMeta } from '@kubernetes/client-node'
import { listResources } from '../lib/resource-request'

export const MultiClusterHubApiVersion = 'operator.open-cluster-management.io/v1'
export type MultiClusterHubApiVersionType = 'operator.open-cluster-management.io/v1'

export const MultiClusterHubKind = 'MultiClusterHub'
export type MultiClusterHubKindType = 'MultiClusterHub'

export const MultiClusterHubDefinition: IResourceDefinition = {
    apiVersion: MultiClusterHubApiVersion,
    kind: MultiClusterHubKind,
}

export interface MultiClusterHub extends IResource {
    apiVersion: MultiClusterHubApiVersionType
    kind: MultiClusterHubKindType
    metadata: V1ObjectMeta
    spec?: {}
}

export function listMultiClusterHubs() {
    return listResources<MultiClusterHub>({
        apiVersion: MultiClusterHubApiVersion,
        kind: MultiClusterHubKind,
    })
}
