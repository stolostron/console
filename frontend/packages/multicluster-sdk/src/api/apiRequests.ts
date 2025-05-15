/* Copyright Contributors to the Open Cluster Management project */
import {
  k8sCreate,
  k8sDelete,
  k8sGet,
  K8sModel,
  k8sPatch,
  k8sUpdate,
  Patch,
  QueryParams,
  Selector,
} from '@openshift-console/dynamic-plugin-sdk'
import { fetchRetry, getBackendUrl } from './utils/fetchRetry'
import { selectorToString } from './utils/requirements'

export type BaseOptions = {
  name?: string
  ns?: string
  path?: string
  cluster?: string
  queryParams?: QueryParams
}

export type OptionsCreate<R extends K8sResourceCommon> = BaseOptions & {
  model: K8sModel
  data: R
}

export type OptionsGet = BaseOptions & {
  model: K8sModel
  requestInit?: RequestInit
}

export type OptionsUpdate<R extends K8sResourceCommon> = BaseOptions & {
  model: K8sModel
  data: R
}

export type OptionsPatch<R> = BaseOptions & {
  model: K8sModel
  resource: R
  data: Patch[]
}

export type OptionsDelete<R> = BaseOptions & {
  model: K8sModel
  resource: R
  requestInit?: RequestInit
  json?: Record<string, any>
}

type GetResourceURL = (params: {
  model: K8sModel
  ns?: string
  name?: string
  cluster?: string
  queryParams?: QueryParams
}) => string

export type Options = {
  ns?: string
  name?: string
  path?: string
  queryParams?: QueryParams
  cluster?: string
}

const getK8sAPIPath = ({ apiGroup = 'core', apiVersion }: K8sModel): string => {
  const isLegacy = apiGroup === 'core' && apiVersion === 'v1'
  let p = isLegacy ? '/api/' : '/apis/'

  if (!isLegacy && apiGroup) {
    p += `${apiGroup}/`
  }

  p += apiVersion
  return p
}

export const getResourcePath = (model: K8sModel, options: Options): string => {
  let url = getK8sAPIPath(model)

  if (options.ns) {
    url += `/namespaces/${options.ns}`
  }
  url += `/${model.plural}`
  if (options.name) {
    // Some resources like Users can have special characters in the name.
    url += `/${encodeURIComponent(options.name)}`
  }
  if (options.path) {
    url += `/${options.path}`
  }
  if (Object.keys(options?.queryParams || {}).length > 0) {
    const queryString = new URLSearchParams(options.queryParams).toString()
    url += `?${queryString}`
  }

  return url
}

export const k8sBasePath = `api/kubernetes`

export const getResourceURL: GetResourceURL = ({ model, ns, name, cluster, queryParams }) => {
  const resourcePath = getResourcePath(model, { ns, name, queryParams, cluster })

  const resourceURL = `${getBackendUrl()}/managedclusterproxy/${cluster}${resourcePath}`

  return resourceURL
}

export async function fleetGet<R extends K8sResourceCommon>(options: OptionsGet): Promise<R> {
  const { model, name, ns, cluster } = options

  if (cluster === undefined) {
    return k8sGet<R>(options)
  }

  const requestPath = getResourceURL({ model, ns, name, cluster, queryParams: options.queryParams })

  const { data } = await fetchRetry<R>({
    method: 'GET',
    url: requestPath,
    disableRedirectUnauthorizedLogin: true,
  })

  return data
}

export async function fleetCreate<R extends K8sResourceCommon>(options: OptionsCreate<R>): Promise<R> {
  const { data, model, ns, name } = options

  const cluster = options.cluster || data.cluster

  if (cluster === undefined) {
    return k8sCreate<R>(options)
  }
  const requestPath = getResourceURL({
    model,
    ns: data?.metadata?.namespace || ns,
    name: data.metadata?.name || name,
    cluster,
    queryParams: options.queryParams,
  })

  const { data: createdData } = await fetchRetry<R>({
    method: 'POST',
    url: requestPath,
    data,
    disableRedirectUnauthorizedLogin: true,
  })

  return createdData
}

export async function fleetUpdateResource<R extends K8sResourceCommon>(options: OptionsUpdate<R>): Promise<R> {
  const { model, name, ns, data } = options

  const cluster = options.cluster || data.cluster

  if (cluster === undefined) {
    return k8sUpdate(options)
  }

  const requestPath = getResourceURL({
    model,
    ns: data?.metadata?.namespace || ns,
    name: data?.metadata?.name || name,
    cluster: cluster,
    queryParams: options.queryParams,
  })

  const { data: updatedData } = await fetchRetry<R>({
    method: 'PUT',
    url: requestPath,
    data,
    disableRedirectUnauthorizedLogin: true,
  })

  return updatedData
}

export async function fleetPatchResource<R extends K8sResourceCommon>(options: OptionsPatch<R>): Promise<R> {
  const { resource, model, ns, name } = options ?? {}

  const cluster = options.cluster || resource.cluster

  if (cluster === undefined) {
    return k8sPatch<R>(options)
  }

  const headers: Record<string, string> = {}
  if (Array.isArray(options.data)) {
    headers['Content-Type'] = 'application/json-patch+json'
  } else {
    headers['Content-Type'] = 'application/merge-patch+json'
  }

  const requestPath = getResourceURL({
    model,
    ns: resource?.metadata?.namespace || ns,
    name: resource?.metadata?.name || name,
    cluster,
    queryParams: options.queryParams,
  })

  const { data: updatedData } = await fetchRetry<R>({
    method: 'PATCH',
    url: requestPath,
    data: options.data,
    headers,
    disableRedirectUnauthorizedLogin: true,
  })

  return updatedData
}

export async function fleetDeleteResource<R extends K8sResourceCommon>(options: OptionsDelete<R>): Promise<R> {
  const { model, name, ns, json, resource } = options

  const cluster = resource?.cluster || options?.cluster

  if (cluster === undefined) {
    return k8sDelete(options)
  }

  const { propagationPolicy } = model
  const jsonData = json ?? (propagationPolicy && { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy })

  const requestPath = getResourceURL({
    model,
    ns: ns || resource?.metadata?.namespace,
    name: name || resource?.metadata?.name,
    cluster,
    queryParams: options?.queryParams,
  })

  const { data } = await fetchRetry<R>({
    method: 'DELETE',
    url: requestPath,
    data: jsonData,
    disableRedirectUnauthorizedLogin: true,
  })
  return data
}

export const isConnectionEncrypted = () => window.location.protocol === 'https:'

export const WS = 'ws'
export const WSS = 'wss'
export const SECURE = '443'
export const INSECURE = '80'

export const fleetWatch = (
  model: K8sModel,
  query: {
    labelSelector?: Selector
    resourceVersion?: string
    ns?: string
    fieldSelector?: string
    cluster?: string
  } = {}
) => {
  const queryParams: QueryParams = { watch: 'true' }

  const { labelSelector } = query
  if (labelSelector) {
    const encodedSelector = selectorToString(labelSelector)
    if (encodedSelector) {
      queryParams.labelSelector = encodedSelector
    }
  }

  if (query.fieldSelector) {
    queryParams.fieldSelector = query.fieldSelector
  }

  if (query.resourceVersion) {
    queryParams.resourceVersion = query.resourceVersion
  }

  const requestPath = getResourceURL({ model, cluster: query.cluster, queryParams, ns: query.ns })

  const host = `${isConnectionEncrypted() ? WSS : WS}://${window.location.hostname}:${
    window.location.port || (isConnectionEncrypted() ? SECURE : INSECURE)
  }`

  const socket = new WebSocket(new URL(requestPath, host))

  return socket
}
