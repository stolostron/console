/* Copyright Contributors to the Open Cluster Management project */
// https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.19

import { join } from 'path'
import { APIResourceNames, getApiPaths } from '../lib/api-resource-list'
import { Metadata } from './metadata'

export interface IResourceDefinition {
  apiVersion: string
  kind: string
}

export interface IResource<StatusType = any> extends IResourceDefinition {
  status?: StatusType
  apiVersion: string
  kind: string
  metadata?: Metadata
}
export interface IUIData {
  clusterList: string[]
  appSetRelatedResources: any
  appSetApps: string[]
}

export interface IUIResource extends IResource {
  uidata: IUIData
}
export interface ResourceList<Resource extends IResource> {
  kind: string
  items?: Resource[]
}

let apiResourceList: APIResourceNames = {}
let pendingPromise: Promise<string> | undefined

export function fallbackPlural(resourceDefinition: IResourceDefinition) {
  if (resourceDefinition.kind.endsWith('s')) {
    return resourceDefinition.kind.toLowerCase()
  }

  return resourceDefinition.kind?.toLowerCase().endsWith('y')
    ? resourceDefinition.kind?.toLowerCase().slice(0, -1) + 'ies'
    : resourceDefinition.kind?.toLowerCase() + 's'
}

function getPluralFromCache(resourceDefinition: IResourceDefinition) {
  return apiResourceList[resourceDefinition.apiVersion]?.[resourceDefinition.kind]?.pluralName
}

function getApiResourceList() {
  return getApiPaths().promise
}

export async function getResourcePlural(resourceDefinition: IResourceDefinition): Promise<string> {
  let plural = getPluralFromCache(resourceDefinition)
  if (plural) {
    return plural
  }

  if (pendingPromise) {
    const queuedAsyncResult = pendingPromise.then(() => {
      plural = getPluralFromCache(resourceDefinition)
      if (plural) {
        return plural
      }
      return fallbackPlural(resourceDefinition)
    })
    return queuedAsyncResult
  } else {
    const asyncResult = getApiResourceList().then((list) => {
      apiResourceList = list
      pendingPromise = undefined
      plural = getPluralFromCache(resourceDefinition)
      return plural ? plural : fallbackPlural(resourceDefinition)
    })
    pendingPromise = asyncResult
    return asyncResult
  }
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

export function getResourceNameApiPathTestHelper(options: {
  apiVersion: string
  kind?: string
  plural?: string
  metadata?: { name?: string; namespace?: string }
}) {
  let path = getResourceApiPathTestHelper(options)

  const name = options.metadata?.name
  if (name) {
    path = join(path, name)
  }

  return path.replace(/\\/g, '/')
}

export function getResourceApiPathTestHelper(options: {
  apiVersion: string
  kind?: string
  plural?: string
  metadata?: { name?: string; namespace?: string }
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
    const pluralName = fallbackPlural({ apiVersion: options.apiVersion, kind: options.kind })
    path = join(path, pluralName)
  }

  return path.replace(/\\/g, '/')
}
