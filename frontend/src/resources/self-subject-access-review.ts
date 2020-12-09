import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource } from './resource'
import { createResource } from '../lib/resource-request'

export const SelfSubjectAccessReviewApiVersion = 'authorization.k8s.io/v1'
export type SelfSubjectAccessReviewApiVersionType = 'authorization.k8s.io/v1'

export const SelfSubjectAccessReviewKind = 'SelfSubjectAccessReview'
export type SelfSubjectAccessReviewType = 'SelfSubjectAccessReview'

export interface SelfSubjectAccessReview extends IResource {
    apiVersion: SelfSubjectAccessReviewApiVersionType
    kind: SelfSubjectAccessReviewType
    metadata: V1ObjectMeta
    spec: {
        resourceAttributes: ResourceAttributes
        user?: string
    }
    status?: {
        allowed: boolean
        denied: boolean
        evaluationError: string
        reason: string
    }
}
export type ResourceAttributes = {
    group: string
    name: string
    namespace: string
    resource: string
    subresource: string
    verb: string
    version: string
}

export function createSubjectAccessReview(resourceAttributes: ResourceAttributes) {
    return createResource<SelfSubjectAccessReview>({
        apiVersion: SelfSubjectAccessReviewApiVersion,
        kind: SelfSubjectAccessReviewKind,
        metadata: {},
        spec: {
            resourceAttributes,
        },
    })
}
