/* Copyright Contributors to the Open Cluster Management project */
// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

import { join } from 'path'
import { Metadata } from './metadata'

export interface IResourceDefinition {
    apiVersion: string
    kind: string
}

export interface IResource extends IResourceDefinition {
    apiVersion: string
    kind: string
    metadata?: Metadata
}

export interface ResourceList<Resource extends IResource> {
    kind: string
    items?: Resource[]
}

export function getResourcePlural(resourceDefinition: IResourceDefinition) {
    return resourceDefinition.kind.toLowerCase() + 's'
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

export function getResourceApiPath(options: {
    apiVersion: string
    kind?: string
    plural?: string
    metadata?: { namespace?: string }
}): string {
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
    } else if (options.kind) {
        path = join(path, options.kind.toLowerCase() + 's')
    }

    return path.replace(/\\/g, '/')
}

export function getResourceNameApiPath(options: {
    apiVersion: string
    kind?: string
    plural?: string
    metadata?: { name?: string; namespace?: string }
}): string {
    let path = getResourceApiPath(options)

    const name = options.metadata?.name
    if (name) {
        path = join(path, name)
    }

    return path.replace(/\\/g, '/')
}
