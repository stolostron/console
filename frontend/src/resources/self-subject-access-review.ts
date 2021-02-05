import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource } from './resource'
import { createResource } from '../lib/resource-request'
import { Cluster, ClusterStatus } from '../lib/get-cluster'

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
    'cluster.edit.labels'?: boolean
    'cluster.detach'?: boolean
    'cluster.destroy'?: boolean
    'cluster.upgrade'?: boolean
}

export type ProviderConnectionsTableActionsRbac = {
    'secret.edit'?: boolean
    'secret.delete': boolean
}

export type BMATableRbacAccess = {
    'bma.delete': boolean
    'bma.edit': boolean
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

export function createSubjectAccessReviews(resourceAttributes: Array<ResourceAttributes>) {
    const results = resourceAttributes.map((resource) => createSubjectAccessReview(resource))
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}

export async function rbacNamespaceFilter(action: string, namespaces: Array<string>) {
    const resourceList: Array<ResourceAttributes> = []
    let filteredNamespaces: Array<string> = []

    if (namespaces.length === 0) return []

    // check for admin access before checking namespaces individually
    const adminAccess = await checkAdminAccess()

    if (adminAccess) {
        return namespaces
    }

    namespaces.forEach((namespace) => {
        resourceList.push(...rbacMapping(action, '', namespace))
    })

    const promiseResult = createSubjectAccessReviews(resourceList)
    return promiseResult.promise.then((results) => {
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                if (result.value.status?.allowed) {
                    filteredNamespaces.push(result.value.spec.resourceAttributes.namespace!)
                }
            }
        })
        // remove duplicates from filtered list
        filteredNamespaces = filteredNamespaces.filter((value, index) => {
            return filteredNamespaces.indexOf(value) === index
        })

        return filteredNamespaces
    })
}

export async function checkAdminAccess() {
    let adminAccess = false
    const resourceAttribute: ResourceAttributes = {
        name: '*',
        namespace: '*',
        resource: '*',
        verb: '*',
    }
    const promiseResult = createSubjectAccessReviews([resourceAttribute]).promise
    await promiseResult
        .catch((err) => {
            console.error(err)
        })
        .then((results) => {
            if (results) {
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        adminAccess = result.value.status?.allowed!
                    }
                })
            }
        })
    return adminAccess
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
                    resource: 'managedclusteractions',
                    verb: 'create',
                    group: 'action.open-cluster-management.io',
                    namespace,
                },
            ]
        case 'secret.get':
            return [
                {
                    name,
                    namespace,
                    resource: 'secrets',
                    verb: 'get',
                },
            ]
        case 'secret.create':
            return [
                {
                    namespace,
                    resource: 'secrets',
                    verb: 'create',
                },
            ]
        case 'secret.delete':
            return [
                {
                    name,
                    namespace,
                    resource: 'secrets',
                    verb: 'delete',
                },
            ]
        case 'secret.edit':
            return [
                {
                    name,
                    namespace,
                    resource: 'secrets',
                    verb: 'patch',
                },
            ]
        case 'bma.create':
            return [
                {
                    name,
                    namespace,
                    group: 'inventory.open-cluster-management.io',
                    resource: 'baremetalassets',
                    verb: 'create',
                },
            ]
        case 'bma.delete':
            return [
                {
                    name,
                    namespace,
                    group: 'inventory.open-cluster-management.io',
                    resource: 'baremetalassets',
                    verb: 'delete',
                },
            ]
        case 'bma.edit':
            return [
                {
                    name,
                    namespace,
                    group: 'inventory.open-cluster-management.io',
                    resource: 'baremetalassets',
                    verb: 'patch',
                },
            ]
        default:
            return []
    }
}

export const defaultTableRbacValues: ClustersTableActionsRbac = {
    'cluster.edit.labels': false,
    'cluster.detach': false,
    'cluster.destroy': false,
    'cluster.upgrade': false,
}

export function CheckTableActionsRbacAccess(
    cluster: Cluster,
    setTableActionRbacValues: React.Dispatch<React.SetStateAction<ClustersTableActionsRbac>>,
    setRbacAborts?: React.Dispatch<React.SetStateAction<Function[] | undefined>>
) {
    let currentRbacValues = { ...defaultTableRbacValues }
    let abortArray: Array<Function> = []
    if (!cluster.isHive) {
        delete currentRbacValues['cluster.destroy']
    }
    if (cluster?.status === ClusterStatus.detached) {
        delete currentRbacValues['cluster.detach']
    }
    Object.keys(currentRbacValues).forEach((action) => {
        const request = createSubjectAccessReviews(rbacMapping(action, cluster.name, cluster.namespace))
        request.promise
            .then((results) => {
                if (results) {
                    let rbacQueryResults: boolean[] = []
                    results.forEach((result) => {
                        if (result.status === 'fulfilled') {
                            rbacQueryResults.push(result.value.status?.allowed!)
                        }
                    })
                    if (!rbacQueryResults.includes(false)) {
                        setTableActionRbacValues((current) => {
                            return { ...current, ...{ [action]: true } }
                        })
                    }
                }
            })
            .catch((err) => console.error(err))
        abortArray.push(request.abort)
    })
    if (setRbacAborts) setRbacAborts(abortArray)
}
