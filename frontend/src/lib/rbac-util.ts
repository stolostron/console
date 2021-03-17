/* Copyright Contributors to the Open Cluster Management project */

import {
    ResourceAttributes,
    createSubjectAccessReview,
    createSubjectAccessReviews,
} from '../resources/self-subject-access-review'
import { Namespace } from '../resources/namespace'
import { getResourceGroup, getResourcePlural, IResource } from '../resources/resource'

export function getAuthorizedNamespaces(resourceAttributes: ResourceAttributes[], namespaces: Namespace[]) {
    return new Promise<string[]>(async (resolve, reject) => {
        try {
            const namespaceList: string[] = namespaces.map((namespace) => namespace.metadata.name!)

            if (namespaceList.length === 0) {
                return resolve([])
            }

            if (await checkAdminAccess()) {
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

export async function checkAdminAccess() {
    try {
        const result = await createSubjectAccessReview({
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        }).promise
        return result.status!.allowed
    } catch (err) {
        return false
    }
}

type Verb = 'get' | 'patch' | 'create' | 'delete' | 'update'

export function rbacResource(verb: Verb, resource: IResource, namespace?: string, name?: string) {
    let attributes = {
        name: name ?? resource?.metadata?.name,
        namespace: namespace ?? resource?.metadata?.namespace,
        resource: getResourcePlural(resource),
        verb,
        group: getResourceGroup(resource),
    }
    if (!attributes.name) delete attributes.name
    if (!attributes.namespace) delete attributes.namespace
    return attributes
}

export function rbacGet(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('get', resource, namespace, name)
}

export function rbacPatch(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('patch', resource, namespace, name)
}

export function rbacCreate(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('create', resource, namespace, name)
}

export function rbacDelete(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('delete', resource, namespace, name)
}

export function rbacUpdate(resource: IResource, namespace?: string, name?: string) {
    return rbacResource('update', resource, namespace, name)
}

export function canUser(verb: Verb, resource: IResource, namespace?: string, name?: string) {
    const resourceAttributes = rbacResource(verb, resource, namespace, name)
    const selfSubjectAccessReview = createSubjectAccessReview(resourceAttributes)
    return selfSubjectAccessReview
}
