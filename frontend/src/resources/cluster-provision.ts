import { V1ObjectMeta, V1CustomResourceDefinitionCondition } from '@kubernetes/client-node'
import { listNamespacedResources } from '../lib/resource-request'
import { IResourceDefinition } from './resource'

export const ClusterProvisionApiVersion = 'hive.openshift.io/v1'
export type ClusterProvisionApiVersionType = 'hive.openshift.io/v1'

export const ClusterProvisionKind = 'ClusterProvision'
export type ClusterProvisionKindType = 'ClusterProvision'

export const ClusterProvisionDefinition: IResourceDefinition = {
    apiVersion: ClusterProvisionApiVersion,
    kind: ClusterProvisionKind,
}

export interface ClusterProvision {
    apiVersion: ClusterProvisionApiVersionType
    kind: ClusterProvisionKindType
    metadata: V1ObjectMeta
    spec?: {
        attempt: number
    }
    status?: {
        conditions: V1CustomResourceDefinitionCondition[]
    }
}

export function listClusterProvisions(namespace: string) {
    return listNamespacedResources<ClusterProvision>({
        apiVersion: ClusterProvisionApiVersion,
        kind: ClusterProvisionKind,
        metadata: { namespace },
    })
}
