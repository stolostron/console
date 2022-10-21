/* Copyright Contributors to the Open Cluster Management project */
// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

import { join } from 'path'
import { APIResourceNames, getApiPaths } from '../lib/api-resource-list'
import { Metadata } from './metadata'

export interface IResourceDefinition {
    apiVersion: string
    kind: string
}

export interface IResource extends IResourceDefinition {
    status?: any
    apiVersion: string
    kind: string
    metadata?: Metadata
}

export interface ResourceList<Resource extends IResource> {
    kind: string
    items?: Resource[]
}

export async function getApiResourceList() {
    return getApiPaths().promise
}

/*
Todo: 
    1. use getResourcePlural to execute getApiResoruceList
    2. check to see if cache is empty, and if loading is false
    3. load, look for resource
    4. if resource is not found and loaded bool is false, reload and force update 
    5. if resource is not found and loaded bool is true, exit.

    TODO: restore fallback code for getResourcePlural (which adds plural endings)
    */

let apiResourceList: APIResourceNames = {}

export async function getResourcePlural(resourceDefinition: IResourceDefinition) {
    const plural = apiResourceList[resourceDefinition.apiVersion as string][resourceDefinition.kind].pluralName

    if (plural) {
        return plural || ''
    }
    apiResourceList = await getApiResourceList()
    return apiResourceList[resourceDefinition.apiVersion as string][resourceDefinition.kind].pluralName || ''
}

// export function getResourcePlural(resourceDefinition: IResourceDefinition) {
//     if (resourceDefinition.kind.endsWith('s')) {
//         return resourceDefinition.kind.toLowerCase()
//     }

//     return resourceDefinition.kind?.toLowerCase().endsWith('y')
//         ? resourceDefinition.kind?.toLowerCase().slice(0, -1) + 'ies'
//         : resourceDefinition.kind?.toLowerCase() + 's'
// }

export function getApiVersionResourceGroup(apiVersion: string) {
    if (apiVersion.includes('/')) {
        return apiVersion.split('/')[0]
    } else {
        return ''
    }
}

export function getResourceGroup(resourceDefinition: IResourceDefinition) {
    if (resourceDefinition.apiVersion.includes('/')) {
        return resourceDefinition.apiVersion.split('/')[0]
    } else {
        return ''
    }
}

export function getResourceName(resource: Partial<IResource>) {
    return resource.metadata?.name
}

export function getResourceNamespace(resource: Partial<IResource>) {
    return resource.metadata?.namespace
}

export async function getResourceApiPath(options: {
    apiVersion: string
    kind?: string
    plural?: string
    metadata?: { namespace?: string }
}) {
    const { apiVersion } = options

    let path: string
    if (apiVersion?.includes('/')) {
        path = join('/apis', apiVersion)
    } else {
        path = join('/api', apiVersion)
    }

    const namespace = options.metadata?.namespace
    if (namespace) {
        path = join(path, 'namespaces', namespace)
    }

    if (options.plural) {
        path = join(path, options.plural)
        return path.replace(/\\/g, '/')
    } else if (options.kind) {
        const pluralName = await getResourcePlural({ apiVersion: options.apiVersion, kind: options.kind })
        path = join(path, pluralName)
    }

    return path.replace(/\\/g, '/')
}

export async function getResourceNameApiPath(options: {
    apiVersion: string
    kind?: string
    plural?: string
    metadata?: { name?: string; namespace?: string }
}) {
    let path = await getResourceApiPath(options)

    const name = options.metadata?.name
    if (name) {
        path = join(path, name)
    }

    return path.replace(/\\/g, '/')
}
