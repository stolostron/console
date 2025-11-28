/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sListOptions, FleetK8sResourceCommon } from '../types'
import { K8sModel, QueryParams, Selector } from '@openshift-console/dynamic-plugin-sdk'

import { BASE_K8S_API_PATH } from '../internal/constants'
import { getFleetK8sAPIPath } from '../api/getFleetK8sAPIPath'
import { selectorToString } from './requirements'

export type FleetK8sAPIOptions = {
  model: K8sModel
  name?: string
  ns?: string
  path?: string
  cluster?: string
  queryParams?: QueryParams
}

export type FleetK8sAPIOptionsWithData<R extends FleetK8sResourceCommon> = FleetK8sAPIOptions & { data: R }

export type FleetK8sAPIOptionsWithResource<R extends FleetK8sResourceCommon> = FleetK8sAPIOptions & { resource: R }

const isFleetK8sAPIOptionsWithData = (
  options: FleetK8sAPIOptions
): options is FleetK8sAPIOptionsWithData<FleetK8sResourceCommon> => {
  const data = (options as FleetK8sAPIOptionsWithData<FleetK8sResourceCommon>).data
  return typeof data === 'object' && !Array.isArray(data)
}

const isFleetK8sAPIOptionsWithResource = (
  options: FleetK8sAPIOptions
): options is FleetK8sAPIOptionsWithResource<FleetK8sResourceCommon> => {
  const resource = (options as FleetK8sAPIOptionsWithResource<FleetK8sResourceCommon>).resource
  return typeof resource === 'object' && !Array.isArray(resource)
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

const excludeEmptyQueryParams = (queryParams: QueryParams): Record<string, string> =>
  Object.fromEntries(
    Object.entries(queryParams || {}).filter(([, value]) => value !== undefined && value !== null && value !== '')
  ) as Record<string, string>

export const getResourcePath = (options: FleetK8sAPIOptions): string => {
  let url = getK8sAPIPath(options.model)

  if (options.ns) {
    url += `/namespaces/${options.ns}`
  }
  url += `/${options.model.plural}`
  if (options.name) {
    // Some resources like Users can have special characters in the name.
    url += `/${encodeURIComponent(options.name)}`
  }
  if (options.path) {
    url += `/${options.path}`
  }

  const queryParams = excludeEmptyQueryParams(options.queryParams || {})
  if (Object.keys(queryParams).length > 0) {
    const queryString = new URLSearchParams(queryParams).toString()
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
  const resourcePath = getResourcePath({ model, ns, name, queryParams, cluster })
  return `${basePath}${resourcePath}`
}

export function getClusterFromOptions(options: FleetK8sAPIOptions) {
  return (
    options.cluster ??
    ((isFleetK8sAPIOptionsWithData(options) && options.data.cluster) ||
      (isFleetK8sAPIOptionsWithResource(options) && options.resource.cluster) ||
      undefined)
  )
}

export function getNamespaceFromOptions(options: FleetK8sAPIOptions) {
  return (
    options.ns ??
    ((isFleetK8sAPIOptionsWithData(options) && options.data.metadata?.namespace) ||
      (isFleetK8sAPIOptionsWithResource(options) && options.resource.metadata?.namespace) ||
      options.queryParams?.ns ||
      undefined)
  )
}

export function getNameFromOptions(options: FleetK8sAPIOptions) {
  return (
    options.name ??
    ((isFleetK8sAPIOptionsWithData(options) && options.data.metadata?.name) ||
      (isFleetK8sAPIOptionsWithResource(options) && options.resource.metadata?.name) ||
      undefined)
  )
}

export function getOptionsWithoutCluster<O extends FleetK8sAPIOptions>(options: O) {
  const { cluster: _optionsCluster, ...optionsWithoutCluster } = options
  if (isFleetK8sAPIOptionsWithData(options)) {
    const { cluster: _dataCluster, ...dataWithoutCluster } = options.data
    return { ...optionsWithoutCluster, data: dataWithoutCluster }
  } else if (isFleetK8sAPIOptionsWithResource(options)) {
    const { cluster: _resourceCluster, ...resourceWithoutCluster } = options.resource
    return { ...optionsWithoutCluster, resource: resourceWithoutCluster }
  }
  return optionsWithoutCluster
}

export async function getResourceURLFromOptions<O extends FleetK8sAPIOptions | FleetK8sListOptions>(
  options: O,
  collection: boolean | undefined = false
) {
  const basePath = await getFleetK8sAPIPath(getClusterFromOptions(options))
  return buildResourceURL({
    basePath,
    ...options,
    cluster: getClusterFromOptions(options),
    ns: getNamespaceFromOptions(options),
    name: collection ? undefined : getNameFromOptions(options),
  })
}

export const fleetWatch = (
  model: K8sModel,
  query: {
    labelSelector?: Selector
    resourceVersion?: string
    allowWatchBookmarks?: boolean
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

  if (query.allowWatchBookmarks) {
    queryParams.allowWatchBookmarks = 'true'
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
