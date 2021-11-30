/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const SubscriptionApiVersion = 'apps.open-cluster-management.io/v1'
export type SubscriptionApiVersionType = 'apps.open-cluster-management.io/v1'

export const SubscriptionKind = 'Subscription'
export type SubscriptionKindType = 'Subscription'

export const SubscriptionDefinition: IResourceDefinition = {
    apiVersion: SubscriptionApiVersion,
    kind: SubscriptionKind,
}

export interface Subscription extends IResource {
    apiVersion: SubscriptionApiVersionType
    kind: SubscriptionKindType
    metadata: Metadata
    spec: {
        channel?: string
        placement?: {
            placementRef?: {
                kind: string
                name: string
            }
        }
        secondaryChannel?: string
    }
    status: {
        message?: string
        phase?: string
        statuses?: any
    }
}
