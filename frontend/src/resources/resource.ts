/* Copyright Contributors to the Open Cluster Management project */
// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

import { join } from 'path'
import { globalCustomResourceDefinitions } from '../atoms'
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

export function getResourcePlural(resourceDefinition: IResourceDefinition) {
    const crd = globalCustomResourceDefinitions.find(
        (crd) =>
            crd.spec.group === getResourceGroup(resourceDefinition) &&
            crd.spec.names.kind.toLowerCase() === resourceDefinition.kind.toLowerCase()
    )

    if (crd) return crd.spec.names.plural

    if (resourceDefinition.kind.endsWith('s')) {
        return resourceDefinition.kind.toLowerCase()
    }

    return resourceDefinition.kind?.toLowerCase().endsWith('y')
        ? resourceDefinition.kind?.toLowerCase().slice(0, -1) + 'ies'
        : resourceDefinition.kind?.toLowerCase() + 's'
}

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
        path = join(path, getResourcePlural({ apiVersion: options.apiVersion, kind: options.kind }))
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
