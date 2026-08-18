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

export type WatchErrorGone = { type: 'GONE'; status: 410 }

export type FleetWatchCallbacks = {
  onEvent: (eventData: { type: string; object: any }) => void
  onError: (err: any) => void
  onClose: () => void
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined' || !document?.cookie) return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookie = parts[parts.length - 1]
    if (cookie) return cookie.split(';').shift()
  }
}

async function processWatchStream(
  url: string,
  abortController: AbortController,
  callbacks: FleetWatchCallbacks
): Promise<void> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-transform',
    }

    const csrfToken = getCookie('csrf-token')
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken
    }

    const response = await fetch(url, {
      signal: abortController.signal,
      credentials: 'same-origin',
      headers,
    })

    if (response.status === 410) {
      callbacks.onError({ type: 'GONE', status: 410 } satisfies WatchErrorGone)
      return
    }

    if (!response.ok) {
      callbacks.onError(new Error(`Watch request failed with status ${response.status}`))
      return
    }
    if (!response.body) {
      callbacks.onError(new Error('Watch response has no body'))
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      debugger
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()!

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed) {
          try {
            const event = JSON.parse(trimmed)
            debugger
            if (event.type === 'ERROR' && event.object?.code === 410) {
              callbacks.onError({ type: 'GONE', status: 410 } satisfies WatchErrorGone)
              abortController.abort()
              return
            }
            callbacks.onEvent(event)
          } catch (e) {
            console.error('Failed to parse watch event:', e)
          }
        }
      }
    }

    if (buffer.trim()) {
      try {
        callbacks.onEvent(JSON.parse(buffer.trim()))
      } catch {
        // incomplete data at end of stream
      }
    }

    callbacks.onClose()
  } catch (err) {
    debugger
    if (!abortController.signal.aborted) {
      callbacks.onError(err)
    }
  }
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
  backendURL: string,
  callbacks: FleetWatchCallbacks
): AbortController => {
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

  const abortController = new AbortController()
  processWatchStream(requestPath, abortController, callbacks)
  return abortController
}
