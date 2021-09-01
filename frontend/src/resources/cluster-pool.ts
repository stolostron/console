/* Copyright Contributors to the Open Cluster Management project */

import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResource, IResourceDefinition } from './resource'

export const ClusterPoolApiVersion = 'hive.openshift.io/v1'
export type ClusterPoolApiVersionType = 'hive.openshift.io/v1'

export const ClusterPoolKind = 'ClusterPool'
export type ClusterPoolKindType = 'ClusterPool'

export const ClusterPoolDefinition: IResourceDefinition = {
    apiVersion: ClusterPoolApiVersion,
    kind: ClusterPoolKind,
}

export interface ClusterPool extends IResource {
    apiVersion: ClusterPoolApiVersionType
    kind: ClusterPoolKindType
    metadata: V1ObjectMeta
    spec?: {
        baseDomain: string
        installConfigSecretTemplateRef: {
            name: string
        }
        imageSetRef: {
            name: string
        }
        platform?: {
            aws?: {
                credentialsSecretRef: {
                    name: string
                }
                region: string
            }
            gcp?: {
                credentialsSecretRef: {
                    name: string
                }
            }
            azure?: {
                credentialsSecretRef: {
                    name: string
                }
            }
        }
        pullSecretRef: {
            name: string
        }
        size: number
        skipMachinePools?: boolean
    }
    status?: {
        conditions: V1CustomResourceDefinitionCondition[]
        ready?: number
        size?: number
    }
}
