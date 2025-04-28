/* Copyright Contributors to the Open Cluster Management project */

import * as jsonpatch from 'fast-json-patch'
import { noop } from 'lodash'
import { getCookie } from './utils'
import { ApplicationKind, NamespaceKind, SubscriptionApiVersion, SubscriptionKind } from '../'
import { tokenExpired } from '../../logout'
import { getSubscriptionsFromAnnotation } from '../../routes/Applications/helpers/resource-helper'
import { isLocalSubscription } from '../../routes/Applications/helpers/subscriptions'
import { AnsibleTowerJobTemplate, AnsibleTowerJobTemplateList } from '../ansible-job'
import { getResourceApiPath, getResourceName, getResourceNameApiPath, IResource, ResourceList } from '../resource'
import { Status, StatusKind } from '../status'
import { AnsibleTowerInventory, AnsibleTowerInventoryList } from '../ansible-inventory'

// must match ansiblePaths in backend/src/routes/ansibletower.ts
const ansiblePaths = ['/api/v2/job_templates/', '/api/v2/workflow_job_templates/']

export interface IRequestResult<ResultType = unknown> {
  promise: Promise<ResultType>
  abort: () => void
}

export function resultsSettled<T>(results: IRequestResult<T>[]): IRequestResult<PromiseSettledResult<T>[]> {
  return {
    promise: Promise.allSettled(results.map((result) => result.promise)),
    abort: () => results.forEach((result) => result.abort()),
  }
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

export function isRequestAbortedError(error: any) {
  return error instanceof ResourceError && error.code === ResourceErrorCode.RequestAborted
}

export function getBackendUrl() {
  if (process.env.NODE_ENV === 'test') {
    return process.env.JEST_DEFAULT_HOST ?? ''
  }
  if (process.env.MODE === 'plugin') {
    const proxyPath = process.env.PLUGIN_PROXY_PATH
    const value = proxyPath ? `${proxyPath}${process.env.REACT_APP_BACKEND_PATH}` : ''
    return value
  }
  /* istanbul ignore next */
  return process.env.REACT_APP_BACKEND_PATH ?? ''
}

export async function reconcileResources(
  desiredResources: IResource[],
  existingResources: IResource[],
  options?: { abortController?: AbortController }
) {
  const abortController = options?.abortController

  const namespaceResources = desiredResources
    .filter((desired) => !existingResources.find((existing) => existing.metadata?.uid === desired.metadata?.uid))
    .filter((resource) => resource.kind === NamespaceKind)

  const addedResources = desiredResources
    .filter((desired) => !existingResources.find((existing) => existing.metadata?.uid === desired.metadata?.uid))
    .filter((resource) => resource.kind !== NamespaceKind)

  const modifiedResources = desiredResources
    .filter((desired) => existingResources.find((existing) => existing.metadata?.uid === desired.metadata?.uid))
    .filter((resource) => resource.kind !== NamespaceKind)

  const deletedResources = existingResources.filter(
    (existing) => !desiredResources.find((desired) => desired.metadata?.uid === existing.metadata?.uid)
  )

  let namespaceCreated = false
  try {
    try {
      await createResources(namespaceResources)
      namespaceCreated = true
    } catch (err) {
      if (err instanceof ResourceError) {
        switch (err.code) {
          case 409: // Conflict - already exists
            // continue on as the namespace already exists
            break
          default:
            throw err
        }
      } else {
        throw err
      }
    }

    // Dry Run - Added Resources
    await createResources(addedResources, { dryRun: true, abortController })

    // Dry Run - Modified Resources
    for (const resource of modifiedResources) {
      const existing = existingResources.find((existing) => existing.metadata?.uid === resource.metadata?.uid)
      if (existing) {
        const patch = jsonpatch.compare(existing, resource)
        if (patch.length) {
          await patchResource(existing, patch, { dryRun: true })
        }
      }
    }

    // Dry Run - Deleted Resources
    await deleteResources(deletedResources, { dryRun: true, abortController })

    // Create Resources
    await createResources(addedResources, { deleteCreatedOnError: true, abortController })

    // Update Resources
    try {
      for (const resource of modifiedResources) {
        const existing = existingResources.find((existing) => existing.metadata?.uid === resource.metadata?.uid)
        if (existing) {
          const patch = jsonpatch.compare(existing, resource)
          if (patch.length) {
            await patchResource(existing, patch)
          }
        }
      }
    } catch (err) {
      // modifications failed, delete the previously created
      void deleteResources(addedResources).catch(noop)
      throw err
    }

    // Delete Resources
    await deleteResources(deletedResources, { abortController })
  } catch (err) {
    if (namespaceCreated) {
      // Delete created namespaces as we have an error
      void deleteResources(namespaceResources).catch(noop)
    }
    throw err
  }
}

export async function createResources(
  resources: IResource[],
  options?: {
    dryRun?: boolean
    abortController?: AbortController
    deleteCreatedOnError?: boolean
  }
): Promise<void> {
  const abortController = options?.abortController
  const createdResources: IResource[] = []
  try {
    for (const resource of resources) {
      const requestResult = createResource(resource, options)
      abortController?.signal.addEventListener('abort', requestResult.abort)
      try {
        await requestResult.promise
        createdResources.push(resource)
      } finally {
        abortController?.signal.removeEventListener('abort', requestResult.abort)
      }
    }
  } catch (err) {
    if (options?.dryRun !== true && options?.deleteCreatedOnError) {
      for (const createdResource of createdResources) {
        deleteResource(createdResource).promise.catch(noop)
      }
    }
    throw err
  }
}

export async function updateResources(
  resources: IResource[],
  options?: {
    dryRun?: boolean
    abortController?: AbortController
  }
): Promise<void> {
  const abortController = options?.abortController
  for (const resource of resources) {
    const requestResult = replaceResource(resource, options)
    abortController?.signal.addEventListener('abort', requestResult.abort)
    try {
      await requestResult.promise
    } finally {
      abortController?.signal.removeEventListener('abort', requestResult.abort)
    }
  }
}

export async function deleteResources(
  resources: IResource[],
  options?: {
    dryRun?: boolean
    abortController?: AbortController
  }
): Promise<void> {
  const abortController = options?.abortController
  for (const resource of resources) {
    const requestResult = deleteResource(resource, options)
    abortController?.signal.addEventListener('abort', requestResult.abort)
    try {
      await requestResult.promise
    } finally {
      abortController?.signal.removeEventListener('abort', requestResult.abort)
    }
  }
}

export async function updateAppResources(resources: IResource[]): Promise<void> {
  const subscriptionResources = resources.filter((resource) => resource.kind === SubscriptionKind)
  let subscriptions: any[] = []
  for (const resource of resources) {
    try {
      const existingResource = await getResource(resource).promise
      if (existingResource.kind === ApplicationKind) {
        const existingSubscriptions = getSubscriptionsFromAnnotation(existingResource)

        subscriptions = existingSubscriptions.filter(
          (subscription) => !isLocalSubscription(subscription, existingSubscriptions)
        )
      }
      const patch = jsonpatch.compare(existingResource, resource)
      if (patch.length) {
        await patchResource(existingResource, patch)
      }
    } catch {
      // if the resource does not exist, create the resource
      await createResource(resource).promise
    }
  }
  if (subscriptionResources.length < subscriptions.length) {
    const subNames: string[] = []
    subscriptionResources.forEach((sub) => {
      const subName = sub.metadata?.namespace + '/' + sub.metadata?.name
      subNames.push(subName)
    })
    // delete any removed subscription resources
    subscriptions.forEach((sub) => {
      if (!subNames.includes(sub)) {
        const [namespace, name] = sub.split('/')
        deleteResource({
          apiVersion: SubscriptionApiVersion,
          kind: SubscriptionKind,
          metadata: {
            name,
            namespace,
          },
        })
      }
    })
  }
}

export function createResource<Resource extends IResource, ResultType = Resource>(
  resource: Resource | Promise<Resource>,
  options?: { dryRun?: boolean }
): IRequestResult<ResultType> {
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceApiPath(resource).then((path) => {
      let url = getBackendUrl() + path
      if (options?.dryRun) url += '?dryRun=All'
      return url
    })
  })
  return postRequest<Resource, ResultType>(url, resource)
}

export function replaceResource<Resource extends IResource, ResultType = Resource>(
  resource: Resource,
  options?: { dryRun?: boolean }
): IRequestResult<ResultType> {
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceNameApiPath(resource).then((path) => {
      let url = getBackendUrl() + path
      if (options?.dryRun) url += '?dryRun=All'
      return url
    })
  })
  return putRequest<Resource, ResultType>(url, resource)
}

export function patchResource<Resource extends IResource, ResultType = Resource>(
  resource: Resource | Promise<Resource>,
  data: unknown,
  options?: { dryRun?: boolean }
): IRequestResult<ResultType> {
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceNameApiPath(resource).then((path) => {
      let url = getBackendUrl() + path
      if (options?.dryRun) url += '?dryRun=All'
      return url
    })
  })

  const headers: Record<string, string> = {}
  if (Array.isArray(data)) {
    headers['Content-Type'] = 'application/json-patch+json'
  } else {
    headers['Content-Type'] = 'application/merge-patch+json'
  }
  return patchRequest<unknown, ResultType>(url, data, headers)
}

function checkForName<Resource extends IResource>(resource: Resource): void {
  if (getResourceName(resource) === undefined) {
    throw new ResourceError(ResourceErrorCode.BadRequest, 'Resource name is required.')
  }
}

export function deleteResource<Resource extends IResource>(
  resource: Resource,
  options?: { dryRun?: boolean }
): IRequestResult {
  checkForName(resource)
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceNameApiPath(resource).then((path) => {
      let url = getBackendUrl() + path
      if (options?.dryRun) url += '?dryRun=All'
      return url
    })
  })
  return deleteRequest(url)
}

export function getResource<Resource extends IResource>(
  resource: Resource,
  options?: {
    labelSelector?: Record<string, string>
    fieldSelector?: Record<string, unknown>
  }
): IRequestResult<Resource> {
  checkForName(resource)
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceNameApiPath(resource).then((path) => {
      let url = getBackendUrl() + path
      let queryString = undefined

      if (options?.labelSelector) {
        const labels: string[] = []
        for (const key in options.labelSelector) {
          const value = options.labelSelector[key] !== undefined ? options.labelSelector[key] : ''
          labels.push(`${key}=${value}`)
        }
        queryString = 'labelSelector=' + labels.map((label) => label).join(',')
      }

      if (options?.fieldSelector) {
        const fields: string[] = []
        for (const key in options.fieldSelector) {
          const value = options.fieldSelector[key] !== undefined ? options.fieldSelector[key] : ''
          fields.push(`${key}=${value}`)
        }
        if (queryString) queryString += '&'
        else queryString = ''
        queryString += 'fieldSelector=' + fields.map((field) => field).join(',')
      }

      if (queryString) url += '?' + queryString

      return url
    })
  })

  return getRequest<Resource>(url)
}

export function listResources<Resource extends IResource>(
  resource: { apiVersion: string; kind: string; metadata?: { namespace?: string } },
  labels?: string[],
  query?: Record<string, string>
): IRequestResult<Resource[]> {
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceApiPath(resource).then((resourcePath) => {
      let url = getBackendUrl() + resourcePath
      if (labels) {
        url += '?labelSelector=' + labels.join(',')
        if (query)
          url += `&${Object.keys(query)
            .map((key) => `${key}=${query[key]}`)
            .join('&')}`
      } else {
        if (query)
          url += `?${Object.keys(query)
            .map((key) => `${key}=${query[key]}`)
            .join('&')}`
      }
      return url
    })
  })

  const result = getRequest<ResourceList<Resource>>(url)
  return {
    promise: result.promise.then((result) => {
      if (Array.isArray(result.items)) {
        return (result.items as Resource[]).map((item) => ({
          ...item,
          ...{
            apiVersion: resource.apiVersion,
            kind: resource.kind,
          },
        }))
      } else {
        return []
      }
    }),
    abort: result.abort,
  }
}

export function listClusterResources<Resource extends IResource>(
  resource: { apiVersion: string; kind: string },
  labels?: string[]
): IRequestResult<Resource[]> {
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceApiPath(resource).then((path) => {
      let url = getBackendUrl() + path
      if (labels) url += '?labelSelector=' + labels.join(',')
      return url
    })
  })
  const result = getRequest<ResourceList<Resource>>(url)
  return {
    promise: result.promise.then((result) => result.items as Resource[]),
    abort: result.abort,
  }
}

export function listNamespacedResources<Resource extends IResource>(
  resource: {
    apiVersion: string
    kind: string
    metadata: { namespace: string }
  },
  labels?: string[]
): IRequestResult<Resource[]> {
  const url = Promise.resolve(resource).then((resource) => {
    return getResourceApiPath(resource).then((path) => {
      let url = getBackendUrl() + path
      if (labels) url += '?labelSelector=' + labels.join(',')
      return url
    })
  })
  const result = getRequest<ResourceList<Resource>>(url)
  return {
    promise: result.promise.then((result) => result.items as Resource[]),
    abort: result.abort,
  }
}

async function getAnsibleTemplates(
  backendURLPath: string,
  ansibleHostUrl: string,
  token: string,
  abortController: AbortController
) {
  const ansibleJobs: AnsibleTowerJobTemplate[] = []

  for (const path of ansiblePaths) {
    let jobUrl: string = ansibleHostUrl + path
    while (jobUrl) {
      const result = await fetchGetAnsibleJobs(backendURLPath, jobUrl, token, abortController.signal)
      if (result.data.results) {
        ansibleJobs.push(...result.data.results)
      }
      const { next } = result.data
      if (next) {
        jobUrl = ansibleHostUrl + next
      } else {
        jobUrl = ''
      }
    }
  }

  return {
    results: ansibleJobs?.map((ansibleJob: { name: string; type?: string; description?: string; id: string }) => {
      return {
        name: ansibleJob.name,
        type: ansibleJob.type!,
        description: ansibleJob.description,
        id: ansibleJob.id,
      }
    }),
  }
}
// TODO: validation for URL input
// Code assumes protocol is present & ansiblehosturl ends without a /
export function listAnsibleTowerJobs(
  ansibleHostUrl: string,
  token: string
): IRequestResult<AnsibleTowerJobTemplateList> {
  const backendURLPath = getBackendUrl() + '/ansibletower'
  const abortController = new AbortController()
  return {
    promise: getAnsibleTemplates(backendURLPath, ansibleHostUrl, token, abortController).then((item) => {
      return item as AnsibleTowerJobTemplateList
    }),
    abort: () => abortController.abort(),
  }
}

export function fetchGetAnsibleJobs(
  backendUrlPath: string,
  ansibleJobsUrl: string,
  token: string,
  signal: AbortSignal
) {
  return fetchRetry<AnsibleTowerJobTemplateList>({
    method: 'POST',
    url: backendUrlPath,
    signal,
    data: {
      towerHost: ansibleJobsUrl,
      token: token,
    },
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    disableRedirectUnauthorizedLogin: true,
  })
}

async function getAnsibleInventories(
  backendURLPath: string,
  ansibleHostUrl: string,
  token: string,
  abortController: AbortController
) {
  const ansibleInventories: AnsibleTowerInventory[] = []
  const inventoryUrl: string = ansibleHostUrl + '/api/v2/inventories/'
  const result = await fetchGetAnsibleInventories(backendURLPath, inventoryUrl, token, abortController.signal)
  if (result.data.results) {
    ansibleInventories.push(...result.data.results)
  }

  return {
    results: ansibleInventories?.map(
      (ansibleInventory: { name?: string; type?: string; description?: string; id?: string }) => {
        return {
          name: ansibleInventory.name,
          type: ansibleInventory.type!,
          description: ansibleInventory.description,
          id: ansibleInventory.id,
        }
      }
    ),
  }
}

export function listAnsibleTowerInventories(
  ansibleHostUrl: string,
  token: string
): IRequestResult<AnsibleTowerInventoryList> {
  const backendURLPath = getBackendUrl() + '/ansibletower'
  const abortController = new AbortController()
  return {
    promise: getAnsibleInventories(backendURLPath, ansibleHostUrl, token, abortController).then((item) => {
      return item as AnsibleTowerInventoryList
    }),
    abort: () => abortController.abort(),
  }
}

export function fetchGetAnsibleInventories(
  backendUrlPath: string,
  ansibleInventoriesUrl: string,
  token: string,
  signal: AbortSignal
) {
  return fetchRetry<AnsibleTowerInventoryList>({
    method: 'POST',
    url: backendUrlPath,
    signal,
    data: {
      towerHost: ansibleInventoriesUrl,
      token: token,
    },
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    disableRedirectUnauthorizedLogin: true,
  })
}

export function getRequest<ResultT>(url: string | Promise<string>): IRequestResult<ResultT> {
  const abortController = new AbortController()
  return {
    promise: Promise.resolve(url).then((url) =>
      fetchGet<ResultT>(url, abortController.signal).then((result) => result.data)
    ),
    abort: () => abortController.abort(),
  }
}

export function putRequest<DataT, ResultT>(url: string | Promise<string>, data: DataT): IRequestResult<ResultT> {
  const abortController = new AbortController()
  return {
    promise: Promise.resolve(url).then((url) =>
      fetchPut<ResultT>(url, data, abortController.signal).then((result) => result.data)
    ),
    abort: () => abortController.abort(),
  }
}

export function postRequest<DataT, ResultT>(
  url: string | Promise<string>,
  data: DataT | Promise<DataT>
): IRequestResult<ResultT> {
  const abortController = new AbortController()
  return {
    promise: Promise.all([data, url]).then(([data, url]) =>
      fetchPost<ResultT>(url, data, abortController.signal).then((result) => result.data)
    ),
    abort: () => abortController.abort(),
  }
}

export function patchRequest<DataT, ResultT>(
  url: string | Promise<string>,
  data: DataT,
  headers?: Record<string, string>
): IRequestResult<ResultT> {
  const abortController = new AbortController()
  return {
    promise: Promise.resolve(url).then((url) => {
      return fetchPatch<ResultT>(url, data, abortController.signal, headers).then((result) => result.data)
    }),
    abort: () => abortController.abort(),
  }
}

export function deleteRequest(url: string | Promise<string>): IRequestResult {
  const abortController = new AbortController()
  return {
    promise: Promise.resolve(url).then((url) => fetchDelete(url, abortController.signal)),
    abort: () => abortController.abort(),
  }
}

// --- FETCH FUNCTIONS ---

export function fetchGet<T = unknown>(url: string, signal?: AbortSignal) {
  return fetchRetry<T>({
    method: 'GET',
    url,
    signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
  })
}

export function fetchPut<T = unknown>(url: string, data: unknown, signal: AbortSignal) {
  return fetchRetry<T>({ method: 'PUT', url, signal, data })
}

export function fetchPost<T = unknown>(url: string, data?: unknown, signal?: AbortSignal) {
  return fetchRetry<T>({ method: 'POST', url, signal, data })
}

export function fetchPatch<T = unknown>(
  url: string,
  data: unknown,
  signal: AbortSignal,
  headers?: Record<string, string>
) {
  return fetchRetry<T>({ method: 'PATCH', url, signal, data, headers })
}

export function fetchDelete(url: string, signal: AbortSignal) {
  return fetchRetry<unknown>({ method: 'DELETE', url, signal })
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
