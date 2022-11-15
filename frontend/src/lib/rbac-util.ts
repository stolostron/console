/* Copyright Contributors to the Open Cluster Management project */

import {
    Cluster,
    createSubjectAccessReview,
    createSubjectAccessReviews,
    fallbackPlural,
    getResourceGroup,
    getResourcePlural,
    IResource,
    Namespace,
    ResourceAttributes,
} from '../resources'

export function getAuthorizedNamespaces(resourceAttributes: ResourceAttributes[], namespaces: Namespace[]) {
    return new Promise<string[]>(async (resolve, reject) => {
        try {
            const namespaceList: string[] = namespaces.map((namespace) => namespace.metadata.name!)

            if (namespaceList.length === 0) {
                return resolve([])
            }

            const adminAccessRequest = await checkAdminAccess()
            const isAdmin = adminAccessRequest?.status?.allowed ?? false

            if (isAdmin) {
                return resolve(namespaceList)
            }

            const resourceList: Array<ResourceAttributes> = []

            namespaceList.forEach((namespace) => {
                resourceList.push(...resourceAttributes.map((attribute) => ({ ...attribute, namespace })))
            })

            let authorizedNamespaces: string[] = []
            const promiseResult = createSubjectAccessReviews(resourceList)
            await promiseResult.promise.then((results) => {
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        if (result.value.status?.allowed) {
                            authorizedNamespaces.push(result.value.spec.resourceAttributes.namespace!)
                        }
                    }
                })
                // remove duplicates from filtered list
                authorizedNamespaces = Array.from(new Set(authorizedNamespaces))
            })
            return resolve(authorizedNamespaces)
        } catch (err) {
            return reject(err)
        }
    })
}

export function getAuthorizedClusters(resourceAttributes: ResourceAttributes[], clusters: Cluster[]) {
    return new Promise<Cluster[]>(async (resolve, reject) => {
        try {
            const clusterList: string[] = clusters.map((cluster) => cluster.name!)

            if (clusterList.length === 0) {
                return resolve([])
            }

            const adminAccessRequest = await checkAdminAccess()
            const isAdmin = adminAccessRequest?.status?.allowed ?? false

            if (isAdmin) {
                return resolve(clusters)
            }

            const resourceList: ResourceAttributes[] = []

            clusterList.forEach((cluster) => {
                resourceList.push(...resourceAttributes.map((attribute) => ({ ...attribute, name: cluster })))
            })

            let authorizedClusterList: string[] = []
            const promiseResult = createSubjectAccessReviews(resourceList)
            await promiseResult.promise.then((results) => {
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        if (result.value.status?.allowed) {
                            authorizedClusterList.push(result.value.spec.resourceAttributes.name!)
                        }
                    }
                })
                // remove duplicates from filtered list
                authorizedClusterList = Array.from(new Set(authorizedClusterList))
            })
            const authorizedClusters = authorizedClusterList.map((cluster) => {
                return clusters.find((c) => c.name === cluster)!
            })
            return resolve(authorizedClusters)
        } catch (err) {
            return reject(err)
        }
    })
}

export function checkAdminAccess() {
    const result = createSubjectAccessReview({
        name: '*',
        namespace: '*',
        resource: '*',
        verb: '*',
    }).promise
    return result
}

type Verb = 'get' | 'patch' | 'create' | 'delete' | 'update'
type SubResource = 'join' | 'bind'

export async function rbacResource(
    verb: Verb,
    resource: IResource,
    namespace?: string,
    name?: string,
    subresource?: SubResource
) {
    const resourcePlural = await getResourcePlural(resource)
    const attributes = {
        name: name ?? resource?.metadata?.name,
        namespace: namespace ?? resource?.metadata?.namespace,
        resource: resourcePlural,
        subresource,
        verb,
        group: getResourceGroup(resource),
    }
    if (!attributes.name) delete attributes.name
    if (!attributes.namespace) delete attributes.namespace
    if (!attributes.subresource) delete attributes.subresource

    return attributes
}

export function rbacGet(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('get', resource, namespace, name)
}

export function rbacPatch(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('patch', resource, namespace, name)
}

export function rbacCreate(resource: IResource, namespace?: string, name?: string, subresource?: SubResource) {
    return rbacResource('create', resource, namespace, name, subresource)
}

export function rbacDelete(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('delete', resource, namespace, name)
}

export function rbacUpdate(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('update', resource, namespace, name)
}

export function canUser(
    verb: Verb,
    resource: IResource,
    namespace?: string,
    name?: string,
    _subresource?: SubResource
) {
    const resourceAttributes = rbacResource(verb, resource, namespace, name, _subresource)
    const selfSubjectAccessReview = createSubjectAccessReview(resourceAttributes)
    return selfSubjectAccessReview
}

export async function checkPermission(
    resourceAttributes: Promise<ResourceAttributes>,
    setStateFn: (state: boolean) => void,
    namespaces: Namespace[]
) {
    if (namespaces.length) {
        const fetchAuthorizedNamespaces = async () => {
            return getAuthorizedNamespaces([await resourceAttributes], namespaces)
        }
        fetchAuthorizedNamespaces().then((authorizedNamespaces) => {
            if (authorizedNamespaces?.length > 0) {
                setStateFn(true)
            } else {
                setStateFn(false)
            }
        })
    } else {
        setStateFn(false)
    }
}

export function rbacResourceTestHelper(
    verb: Verb,
    resource: IResource,
    namespace?: string,
    name?: string,
    subresource?: SubResource
) {
    const resourcePlural = fallbackPlural(resource)
    const attributes = {
        name: name ?? resource?.metadata?.name,
        namespace: namespace ?? resource?.metadata?.namespace,
        resource: resourcePlural,
        subresource,
        verb,
        group: getResourceGroup(resource),
    }
    if (!attributes.name) delete attributes.name
    if (!attributes.namespace) delete attributes.namespace
    if (!attributes.subresource) delete attributes.subresource

    return attributes
}

export function rbacGetTestHelper(resource: IResource, namespace?: string, name?: string) {
    return rbacResourceTestHelper('get', resource, namespace, name)
}

export function rbacPatchTestHelper(resource: IResource, namespace?: string, name?: string) {
    return rbacResourceTestHelper('patch', resource, namespace, name)
}

export function rbacCreateTestHelper(
    resource: IResource,
    namespace?: string,
    name?: string,
    subresource?: SubResource
) {
    return rbacResourceTestHelper('create', resource, namespace, name, subresource)
}

export function rbacDeleteTestHelper(resource: IResource, namespace?: string, name?: string) {
    return rbacResourceTestHelper('delete', resource, namespace, name)
}

export function rbacUpdateTestHelper(resource: IResource, namespace?: string, name?: string) {
    return rbacResourceTestHelper('update', resource, namespace, name)
}
