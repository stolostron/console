/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResource, IResourceDefinition } from './resource'

export const SubmarinerConfigApiVersion: SubmarinerConfigApiVersionType =
    'submarineraddon.open-cluster-management.io/v1alpha1'
export type SubmarinerConfigApiVersionType = 'submarineraddon.open-cluster-management.io/v1alpha1'

export const SubmarinerConfigKind: SubmarinerConfigKindType = 'SubmarinerConfig'
export type SubmarinerConfigKindType = 'SubmarinerConfig'

export const SubmarinerConfigDefinition: IResourceDefinition = {
    apiVersion: SubmarinerConfigApiVersion,
    kind: SubmarinerConfigKind,
}

export interface SubmarinerConfig extends IResource {
    apiVersion: SubmarinerConfigApiVersionType
    kind: SubmarinerConfigKindType
    metadata: V1ObjectMeta
    spec: {
        credentialsSecret: {
            name: string
        }
    }
}
