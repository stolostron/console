/* Copyright Contributors to the Open Cluster Management project */
import {
  consoleFetchJSON,
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
import { selectorToString } from './utils/requirements'
import { BASE_K8S_API_PATH } from '../internal/constants'
import { getFleetK8sAPIPath } from './useFleetK8sAPIPath'

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
}) => Promise<string>

export type Options = {
  ns?: string
  name?: string
  path?: string
  queryParams?: QueryParams
  cluster?: string
}

const commonHeaders = {
  'Content-Type': 'application/json',
}

export const getBackendUrl = () => '/api/proxy/plugin/acm/console/multicloud'

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

export const buildResourceURL = (params: {
  model: K8sModel
  ns?: string
  name?: string
  cluster?: string
  queryParams?: QueryParams
  basePath: string
}): string => {
  const { model, ns, name, cluster, queryParams, basePath = BASE_K8S_API_PATH } = params
  const resourcePath = getResourcePath(model, { ns, name, queryParams, cluster })
  return `${basePath}${resourcePath}`
}

export const getResourceURL: GetResourceURL = async (params) => {
  const basePath = await getFleetK8sAPIPath(params?.cluster)
  return buildResourceURL({ ...params, basePath })
}

export async function fleetK8sGet<R extends K8sResourceCommon>(options: OptionsGet): Promise<R> {
  const { model, name, ns, cluster } = options

  if (cluster === undefined) {
    return k8sGet<R>(options)
  }

  const requestPath = await getResourceURL({ model, ns, name, cluster, queryParams: options.queryParams })

  return consoleFetchJSON(requestPath, 'GET') as Promise<R>
}

export async function fleetK8sUpdate<R extends K8sResourceCommon>(options: OptionsUpdate<R>): Promise<R> {
  const { model, name, ns, data } = options

  const cluster = options.cluster || data.cluster

  if (cluster === undefined) {
    return k8sUpdate(options)
  }

  const requestPath = await getResourceURL({
    model,
    ns: data?.metadata?.namespace || ns,
    name: data?.metadata?.name || name,
    cluster: cluster,
    queryParams: options.queryParams,
  })

  return consoleFetchJSON(requestPath, 'PUT') as Promise<R>
}

export async function fleetK8sPatch<R extends K8sResourceCommon>(options: OptionsPatch<R>): Promise<R> {
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

  const requestPath = await getResourceURL({
    model,
    ns: resource?.metadata?.namespace || ns,
    name: resource?.metadata?.name || name,
    cluster,
    queryParams: options.queryParams,
  })

  return consoleFetchJSON(requestPath, 'PATCH', { body: JSON.stringify(options.data), headers }) as Promise<R>
}

export async function fleetK8sCreate<R extends K8sResourceCommon>(options: OptionsCreate<R>): Promise<R> {
  const { data, model, ns } = options

  const cluster = options.cluster || data.cluster

  if (cluster === undefined) {
    return k8sCreate<R>(options)
  }
  const requestPath = await getResourceURL({
    model,
    ns: data?.metadata?.namespace || ns,
    cluster,
    queryParams: options.queryParams,
  })

  const requestData = {
    ...data,
  }

  delete requestData.cluster

  return consoleFetchJSON(requestPath, 'POST', {
    body: JSON.stringify(requestData),
    headers: commonHeaders,
  }) as Promise<R>
}

export async function fleetK8sDelete<R extends K8sResourceCommon>(options: OptionsDelete<R>): Promise<R> {
  const { model, name, ns, json, resource } = options

  const cluster = resource?.cluster || options?.cluster

  if (cluster === undefined) {
    return k8sDelete(options)
  }

  const { propagationPolicy } = model
  const jsonData = json ?? (propagationPolicy && { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy })

  const requestPath = await getResourceURL({
    model,
    ns: ns || resource?.metadata?.namespace,
    name: name || resource?.metadata?.name,
    cluster,
    queryParams: options?.queryParams,
  })

  return consoleFetchJSON(requestPath, 'DELETE', {
    headers: commonHeaders,
    body: JSON.stringify(jsonData),
  }) as Promise<R>
}

export const fleetWatch = (
  model: K8sModel,
  query: {
    labelSelector?: Selector
    resourceVersion?: string
    ns?: string
    fieldSelector?: string
    cluster?: string
  } = {},
  backendURL: string
): WebSocket => {
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

  const requestPath = buildResourceURL({
    model,
    cluster: query.cluster,
    queryParams,
    ns: query.ns,
    basePath: backendURL,
  })

  return new WebSocket(requestPath)
}
