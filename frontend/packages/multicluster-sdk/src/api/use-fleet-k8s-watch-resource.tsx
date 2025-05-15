/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon, useK8sWatchResource, WatchK8sResult } from '@openshift-console/dynamic-plugin-sdk'
import { useEffect, useState } from 'react'
import { Status, StatusKind } from './status'
import { noop } from 'lodash'
import { getResourceNameApiPath, getResourcePlural } from './resource'
import { MulticlusterSDKProvider } from '../internal'
import { FleetK8sResourceCommon, FleetWatchK8sResource } from '../types'

export async function tokenExpired() {
  if (process.env.NODE_ENV === 'production') {
    logout()
  } else {
    window.location.href = `${getBackendUrl()}/login`
  }
}

export function fetchGet<T = unknown>(url: string, signal?: AbortSignal) {
  return fetchRetry<T>({
    method: 'GET',
    url,
    signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
  })
}

export async function logout() {
  const tokenEndpointResult = await fetchGet<{ token_endpoint: string }>(getBackendUrl() + '/configure')
  await fetchGet(getBackendUrl() + '/logout').catch(noop)

  const iframe = document.createElement('iframe')
  iframe.setAttribute('type', 'hidden')
  iframe.name = 'hidden-form'
  document.body.appendChild(iframe)

  const form = document.createElement('form')
  form.method = 'POST'
  form.target = 'hidden-form'
  const url = new URL(tokenEndpointResult.data.token_endpoint)
  form.action = `${url.protocol}//${url.host}/logout`
  document.body.appendChild(form)

  form.submit()

  await new Promise((resolve) => setTimeout(resolve, 500))

  location.pathname = '/'
}

export function getBackendUrl() {
  return '/api/proxy/plugin/acm/console/multicloud'
  // if (process.env.NODE_ENV === 'test') {
  //   return process.env.JEST_DEFAULT_HOST ?? ''
  // }
  // if (process.env.MODE === 'plugin') {
  //   const proxyPath = process.env.PLUGIN_PROXY_PATH
  //   const value = proxyPath ? `${proxyPath}${process.env.REACT_APP_BACKEND_PATH}` : ''
  //   return value
  // }
  // /* istanbul ignore next */
  // return process.env.REACT_APP_BACKEND_PATH ?? ''
}

export enum ResourceErrorCode {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Timeout = 408,
  Conflict = 409,
  UnprocessableEntity = 422,
  TooManyRequests = 429,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  NetworkError = 700,
  RequestAborted = 800,
  ConnectionReset = 900,
  Unknown = 999,
}
const ResourceErrorCodes = Object.keys(ResourceErrorCode).map((k) => Number(ResourceErrorCode[k as any]))

export class ResourceError extends Error {
  constructor(
    public code: ResourceErrorCode,
    message?: string,
    public reason?: string
  ) {
    super(message || ResourceErrorCode[code])
    Object.setPrototypeOf(this, ResourceError.prototype)
    this.name = 'ResourceError'
  }
}

export function getCookie(name: string) {
  if (!document?.cookie) return undefined
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    const cookie = parts[parts.length - 1]
    if (cookie) return cookie.split(';').shift()
  }
}

export async function fetchRetry<T>(options: {
  method?: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'
  url: string
  signal?: AbortSignal
  data?: unknown
  retries?: number
  delay?: number
  headers?: Record<string, string>
  disableRedirectUnauthorizedLogin?: boolean
}): Promise<{ headers: Headers; status: number; data: T }> {
  let retries = options?.retries && Number.isInteger(options.retries) && options.retries >= 0 ? options.retries : 0
  let delay = options?.delay && Number.isInteger(options.delay) && options.delay > 0 ? options.delay : 100
  const headers: Record<string, string> = options.headers ?? {
    Accept: 'application/json',
  }

  const csrfToken = getCookie('csrf-token')
  if (csrfToken && (options.method ?? 'GET') !== 'GET' && options.url.startsWith('/')) {
    headers['X-CSRFToken'] = csrfToken
  }

  let fetchBody: string | undefined
  if (options.data) {
    try {
      fetchBody = JSON.stringify(options.data)
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }
    } catch {
      throw new ResourceError(ResourceErrorCode.BadRequest)
    }
  }

  while (true) {
    let response: Response | undefined
    try {
      response = await fetch(options.url, {
        method: options.method ?? 'GET',
        credentials: 'include',
        headers,
        body: fetchBody,
        signal: options.signal,
        redirect: 'manual',
      })
    } catch (err) {
      if (options.signal?.aborted) {
        throw new ResourceError(ResourceErrorCode.RequestAborted)
      }

      if (retries === 0) {
        if (err instanceof Error) {
          if (typeof (err as any)?.code === 'string') {
            switch ((err as any)?.code) {
              case 'ETIMEDOUT':
                throw new ResourceError(ResourceErrorCode.Timeout)
              case 'ECONNRESET':
                throw new ResourceError(ResourceErrorCode.ConnectionReset)
              case 'ENOTFOUND':
                throw new ResourceError(ResourceErrorCode.NotFound)
            }
          } else if (typeof (err as any)?.code === 'number') {
            if (ResourceErrorCodes.includes((err as any)?.code)) {
              throw new ResourceError((err as any)?.code, err.message)
            }
          } else if (err.message === 'Network Error') {
            throw new ResourceError(ResourceErrorCode.NetworkError)
          }
        }
        console.log(err)
        throw new ResourceError(ResourceErrorCode.Unknown, `Unknown error code: ${(err as any)?.code}`)
      }
    }

    if (response) {
      let responseData: T | string | undefined = undefined
      if (
        // Logs query sometimes loses response Content-Type header - so specifically looking for that url as well
        response.headers.get('content-type')?.includes('text/plain') ||
        (response.url.includes('/apis/proxy.open-cluster-management.io/v1beta1') &&
          response.url.endsWith('tailLines=1000'))
      ) {
        try {
          responseData = await response.text()
        } catch {
          console.error('Error getting resource text response.')
        }
      } else {
        try {
          responseData = (await response.json()) as T
        } catch {
          console.error('Error getting resource json response.')
        }
      }

      if ((responseData as any)?.kind === StatusKind) {
        const status = responseData as unknown as Status
        if (status.status !== 'Success') {
          if (status.code === 401) {
            // 401 is returned from kubernetes in a Status object if token is not valid
            tokenExpired()
            throw new ResourceError(status.code as number, status.message as string, status.reason)
          } else if (ResourceErrorCodes.includes(status.code as number)) {
            throw new ResourceError(status.code as number, status.message as string, status.reason)
          } else {
            throw new ResourceError(ResourceErrorCode.Unknown, status.message as string, status.reason)
          }
        }
      }

      if (response.status < 300) {
        return {
          headers: response.headers,
          status: response.status,
          data: responseData as T,
        }
      }

      switch (response.status) {
        case 302: // 302 is returned when token is valid but logged out
        case 401: // 401 is returned from the backend if no token cookie is on request
          if (!options.disableRedirectUnauthorizedLogin) {
            tokenExpired()
          }
          throw new ResourceError(ResourceErrorCode.Unauthorized)
        case 404:
          throw new ResourceError(ResourceErrorCode.NotFound)
        case 408: // Request Timeout
        case 429: // Too Many Requests
        case 500: // Internal Server Error
        case 502: // Bad Gateway
        case 503: // Service Unavailable
        case 504: // Gateway Timeout
        case 522: // Connection timed out
        case 524: // A Timeout Occurred
          try {
            const retryAfter = Number(response.headers.get('retry-after'))
            if (Number.isInteger(retryAfter)) delay = retryAfter
          } catch {}
          break

        default:
          retries = 0
          break
      }

      if (retries === 0) {
        if (ResourceErrorCodes.includes(response.status)) {
          throw new ResourceError(
            response.status,
            response.statusText,
            typeof responseData === 'string' ? responseData : undefined
          )
        } else {
          throw new ResourceError(ResourceErrorCode.Unknown, `Unknown error code: ${response.status}`)
        }
      }
    }

    const ms = delay
    await new Promise((resolve) => setTimeout(resolve, ms))
    delay *= 2
    retries--
  }
}

export const useFleetK8sWatchResource: MulticlusterSDKProvider['useFleetK8sWatchResource'] = <
  R extends FleetK8sResourceCommon | FleetK8sResourceCommon[],
>(
  hubClusterName: string,
  initResource: FleetWatchK8sResource | null
): WatchK8sResult<R> => {
  const { cluster, ...resource } = initResource ?? {}
  const useFleet = cluster && cluster !== hubClusterName
  const nullResource = resource === null
  const { isList, groupVersionKind, namespace, name } = resource ?? {}
  const { group, version, kind = '' } = groupVersionKind ?? {}

  const [data, setData] = useState<R>((isList ? [] : {}) as R)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      setError(undefined)
      if (!useFleet || nullResource) {
        setData((isList ? [] : {}) as R)
        setLoaded(false)
        return
      }
      try {
        const apiVersion = `${group ? `${group}/` : ''}${version}`

        const pluralResourceKind = await getResourcePlural({
          kind,
          apiVersion,
        })

        console.log('pluralResourceKind', pluralResourceKind)

        const resourcePath = await getResourceNameApiPath({
          kind,
          apiVersion,
          metadata: { namespace, name },
          plural: pluralResourceKind,
        })
        console.log('resourcePath', resourcePath)

        const requestPath = `${getBackendUrl()}/managedclusterproxy/${cluster}${resourcePath}`

        console.log('requestPath', requestPath)
        const headers: HeadersInit = { ['Content-Type']: 'application/json' }

        const { data, status } = await fetchRetry({
          method: 'GET',
          url: requestPath,
          headers: headers,
          retries: 0,
        })

        console.log('data', data)
        console.log('status', status)

        if (status === 200) {
          setData(
            (isList
              ? (data as { items: K8sResourceCommon[] }).items.map((i) => ({ cluster, ...i }))
              : { cluster, ...(data as K8sResourceCommon) }) as R
          )
        } else {
          throw new Error('Failed to fetch data')
        }
      } catch (err) {
        setError(err)
      } finally {
        setLoaded(true)
      }
    }
    fetchData()
  }, [cluster, group, isList, kind, name, namespace, nullResource, useFleet, version])

  console.log('useFleet', useFleet)
  const [defaultData, defaultLoaded, defaultError] = useK8sWatchResource<R>(useFleet ? null : resource)

  return useFleet ? [data, loaded, error] : [defaultData, defaultLoaded, defaultError]
}
