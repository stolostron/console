import {
    ResourceAttributes,
    createSubjectAccessReview,
    createSubjectAccessReviews,
} from '../resources/self-subject-access-review'
import { listProjects } from '../resources/project'
import { getResourceGroup, getResourcePlural, IResource } from '../resources/resource'

export function getAuthorizedNamespaces(resourceAttributes: ResourceAttributes[]) {
    return new Promise<string[]>(async (resolve, reject) => {
        try {
            const projects = await listProjects().promise
            const namespaces: string[] = projects.map((project) => project.metadata.name!)

            if (namespaces.length === 0) {
                return resolve([])
            }

            if (await checkAdminAccess()) {
                return resolve(namespaces)
            }

            const resourceList: Array<ResourceAttributes> = []

            namespaces.forEach((namespace) => {
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

export function getResourceAttributes(verb: 'get' | 'patch', resource: IResource, namespace?: string, name?: string) {
    return {
        name: name ?? resource.metadata?.name,
        namespace: namespace ?? resource.metadata?.namespace,
        resource: getResourcePlural(resource),
        verb,
        group: getResourceGroup(resource),
    }
}
