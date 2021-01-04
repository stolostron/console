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
        denied?: boolean
        evaluationError?: string
        reason?: string
    }
}

export type ResourceAttributes = {
    name?: string
    namespace?: string
    resource: string
    verb: string
    group?: string
    version?: string
    subresource?: string
}

export type ClustersTableActionsRbac = {
    'cluster.edit.labels': boolean
    'cluster.detach': boolean
    'cluster.destroy': boolean
    'cluster.upgrade': boolean
}

// TODO: Add support for bma and provider connections
// export type ProviderConnectionsTableRbacAccess = {
//     edit: boolean
//     delete: boolean
// }

// export type BMATableRbacAccess = {
//     editLabels: boolean
//     editAsset: boolean
//     destroy: boolean
// }

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

export function createSubjectAccessReviews(resourceAttributes: Array<ResourceAttributes>) {
    const results = resourceAttributes.map((resource) => createSubjectAccessReview(resource))
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}

export function rbacMapping(action: string, name?: string, namespace?: string) {
    switch (action) {
        case 'cluster.create':
        case 'cluster.import':
            return [
                {
                    resource: 'managedclusters',
                    verb: 'create',
                    group: 'cluster.open-cluster-management.io',
                },
            ]
        case 'cluster.detach':
            return [
                {
                    resource: 'managedclusters',
                    verb: 'delete',
                    group: 'cluster.open-cluster-management.io',
                    name,
                },
            ]

        case 'cluster.destroy':
            return [
                {
                    resource: 'managedclusters',
                    verb: 'delete',
                    group: 'cluster.open-cluster-management.io',
                    name,
                },
                {
                    resource: 'clusterdeployments',
                    verb: 'delete',
                    group: 'hive.openshift.io',
                    name,
                    namespace,
                },
                {
                    resource: 'machinepools',
                    verb: 'delete',
                    group: 'hive.openshift.io',
                    namespace,
                },
            ]
        case 'cluster.edit.labels':
            return [
                {
                    resource: 'managedclusters',
                    verb: 'patch',
                    group: 'cluster.open-cluster-management.io',
                    name,
                },
            ]
        case 'cluster.upgrade':
            return [
                {
                    resource: 'managedclusterviews',
                    verb: 'create',
                    group: 'view.open-cluster-management.io',
                    namespace               
                }, 
                {
                    resource: 'managedclusteractions',
                    verb: 'create',
                    group: 'action.open-cluster-management.io',
                    namespace
                }
            
            ]
        case 'secret.get':
            return [
                {
                    namespace,
                    resource: 'secret',
                    verb: 'get',
                    version: 'v1',
                },
            ]
        default:
            return []
    }
}
