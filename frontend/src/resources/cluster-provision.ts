/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
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
        clusterDeploymentRef: {
            name: string
        }
        installLog: string
    }
    status?: {
        conditions: V1CustomResourceDefinitionCondition[]
    }
}
