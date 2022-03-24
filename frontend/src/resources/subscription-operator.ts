/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const SubscriptionOperatorApiVersion = 'operators.coreos.com/v1alpha1'
export type SubscriptionOperatorApiVersionType = 'operators.coreos.com/v1alpha1'

export const SubscriptionOperatorKind = 'Subscription'
export type SubscriptionOperatorKindType = 'Subscription'

export const SubscriptionOperatorDefinition: IResourceDefinition = {
    apiVersion: SubscriptionOperatorApiVersion,
    kind: SubscriptionOperatorKind,
}

export interface SubscriptionOperator extends IResource {
    apiVersion: SubscriptionOperatorApiVersionType
    kind: SubscriptionOperatorKindType
    metadata: Metadata
    spec: {}
    status?: {
        conditions: {
            lastTransitionTime?: string
            message?: string
            reason?: string
            status: string
            type: string
        }[]
    }
}
