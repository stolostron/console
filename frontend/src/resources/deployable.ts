/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const DeployableApiVersion = 'apps.open-cluster-management.io/v1'
export type DeployableApiVersionType = 'apps.open-cluster-management.io/v1'

export const DeployableKind = 'Deployable'
export type DeployableKindType = 'Deployable'

export const DeployableDefinition: IResourceDefinition = {
    apiVersion: DeployableApiVersion,
    kind: DeployableKind,
}

export interface Deployable extends IResource {
    apiVersion: DeployableApiVersionType
    kind: DeployableKindType
    metadata: Metadata
    spec: {
        template?: {
            metadata?: Metadata
            spec?: {
                output: {
                    to?: {
                        kind?: string
                        name?: string
                    }
                }
                source?: {
                    path?: string
                }
                sourceStrategy: any
            }
        }
    }
}
