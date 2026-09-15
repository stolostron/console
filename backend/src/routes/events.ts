/* Copyright Contributors to the Open Cluster Management project */

import get from 'get-value'
import got, { CancelError, HTTPError, TimeoutError } from 'got'
import { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import pluralize from 'pluralize'
import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream'
import { batchPromiseAll } from '../lib/batch-promise-all'
import { createDictionary, deflateResource, inflateResource } from '../lib/compression'
import { logger } from '../lib/logger'
import {
  type EventResourceMeta,
  type ServerSideEvent,
  ServerSideEvents,
  getEventResourceMeta,
} from '../lib/server-side-events'
import { getCACertificate, getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import type { IResource } from '../resources/resource'
import type { IWatchOptions } from '../resources/watch-options'
import { polledAggregation } from './aggregator'
import { getAppDict, type ICompressedResource, type ITransformedResource } from './aggregators/applications'
import { canAccess, canGetResource, canListClusterScopedKind, canListNamespacedScopedKind } from './eventsAccess'
import { definitions } from './eventsDefinitions'
import { startAccessCacheCleanup, stopAccessCacheCleanup } from './eventsCache'

export {
  ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN,
  ACCESS_CACHE_MAX_TOKENS,
  ACCESS_CACHE_TTL,
  cleanupAccessCache,
  getAccessCache,
  hashAccessToken,
  resetAccessCache,
} from './eventsCache'
export { canAccess, canGetResource } from './eventsAccess'

export async function events(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    await ServerSideEvents.handleRequest(token, req, res)
  }
}

interface WatchEvent {
  type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'BOOKMARK' | 'ERROR' | 'EOP'
  object: IResource
}

export interface SettingsEvent {
  type: 'SETTINGS'
  settings: Record<string, string>
}

type ServerSideEventData = WatchEvent | SettingsEvent | { type: 'START' | 'LOADED' | 'EOP' }

let requests: { cancel: () => void }[] = []

/**
 * Policy flap throttling: limits cache/SSE churn when Policies update too often.
 * More than FLAP_THRESHOLD updates in FLAP_WINDOW_MS (after FLAP_SETTLING_MS) sets `throttled` and
 * allows at most one cached update per FLAP_COOLDOWN_MS. Throttle clears on spec change or after P
 * with no updates (see startMonitoringThrottled). Overridable via FLAP_* / THROTTLING_CHECK_INTERVAL env vars.
 */
export const FLAP_THRESHOLD = Number(process.env.FLAP_THRESHOLD) || 5 // N: updates within M that trigger throttling
export const FLAP_WINDOW_MS = Number(process.env.FLAP_WINDOW_MS) || 60 * 1000 // M: sliding window for counting calls
export const FLAP_COOLDOWN_MS = Number(process.env.FLAP_COOLDOWN_MS) || 60 * 1000 // P: min interval between allowed updates; silence to exit
export const FLAP_SETTLING_MS = Number(process.env.FLAP_SETTLING_MS) || 60 * 1000 // S: grace period before marking resource.throttled
const THROTTLING_CHECK_INTERVAL = Number(process.env.THROTTLING_CHECK_INTERVAL) || 60 * 1000

interface FlapTrackerEntry {
  timestamps: number[]
  lastCachedAt: number
  settling: number
  throttled?: boolean
  lastSpec?: string
  resource?: string
}

const flapTracker: Record<string, FlapTrackerEntry> = {}

/** Clear flap tracker state. Used for test isolation. */
export function resetFlapTracker(): void {
  for (const key in flapTracker) {
    delete flapTracker[key]
  }
}

export function getFlapTracker() {
  return flapTracker
}

export function resourceFlapKey(
  resource: Pick<IResource, 'kind'> & { metadata?: { namespace?: string; name?: string } }
) {
  return `${resource.kind}/${resource.metadata?.namespace ?? ''}/${resource.metadata?.name ?? ''}`
}

function resourceSpecKey(resource: IResource): string {
  return JSON.stringify(get(resource, 'spec') ?? {})
}

export function formatFlappingMessage(kind: string, namespace: string, name: string): string {
  const windowMinutes = Math.max(1, Math.round(FLAP_WINDOW_MS / 60_000))
  const timesPerMinute = Math.max(1, Math.round(60_000 / FLAP_COOLDOWN_MS))
  return `${kind} ${name} in namespace ${namespace} has been modified more than ${FLAP_THRESHOLD} times in the last ${windowMinutes} minutes. Verify this resource is configured correctly. Updates are being limited to ${timesPerMinute} times per minute.`
}

export function formatFlappingRecoveredMessage(kind: string, namespace: string, name: string): string {
  return `${kind} ${name} in namespace ${namespace} is no longer being throttled; policy updates will resume normally.`
}

//
// If a watched resource has too many updates pre minute
// put it into a polling mode where it just allows one update per minute
//
export function shouldThrottleResource(resource: IResource, now = Date.now()): boolean {
  if (resource.kind !== 'Policy') {
    return false
  }

  // every resource is tracked
  const key = resourceFlapKey(resource)
  let entry = flapTracker[key]
  if (!entry) {
    entry = {
      timestamps: [],
      lastCachedAt: 0,
      settling: now,
    }
    flapTracker[key] = entry
  }

  // if resource's spec has changed, immediately remove from polling mode
  const specKey = resourceSpecKey(resource)
  if (entry.lastSpec !== undefined && entry.lastSpec !== specKey) {
    delete entry.resource
    delete entry.throttled
    delete entry.lastSpec
    return false
  } else {
    // else determine if resource is flapping if it updates more then FLAP_THRESHOLD in FLAP_WINDOW_MS ms
    entry.timestamps.push(now)
    entry.timestamps = entry.timestamps.filter((t) => now - t <= FLAP_WINDOW_MS)
    if (entry.timestamps.length > FLAP_THRESHOLD) {
      // when a resource is first created, it might flap at first
      // so allow a settling time before actually throttling
      if (now - entry.settling > FLAP_SETTLING_MS) {
        if (!entry.throttled) {
          logger.warn({
            msg: formatFlappingMessage(
              resource.kind,
              resource.metadata?.namespace ?? '',
              resource.metadata?.name ?? ''
            ),
          })
        }
        entry.resource = JSON.stringify(resource)
        resource.throttled = true
        entry.throttled = true
      }
    }
  }
  entry.lastSpec = specKey

  // if resource is in polling mode, allow one update per cooldown interval; suppress all others while polling.
  if (entry.throttled) {
    // Allow one update per cooldown interval; suppress all others while polling.
    if (entry.lastCachedAt === 0 || now - entry.lastCachedAt >= FLAP_COOLDOWN_MS) {
      entry.lastCachedAt = now
    } else {
      return true
    }
  } else {
    entry.lastCachedAt = 0
  }

  return false
}

//
// Periodically check resources that are throttled to
// see if they are still flapping and if not, reset
//
let monitoringThrottledTimer: NodeJS.Timeout | undefined

export async function checkThrottleStatus(now = Date.now()): Promise<void> {
  const throttledEntries = Object.values(flapTracker).filter((e) => e.throttled)
  for (const entry of throttledEntries) {
    if (entry.timestamps.length > 0) {
      const lastCall = entry.timestamps[entry.timestamps.length - 1]
      if (now - lastCall > FLAP_COOLDOWN_MS) {
        const resource = entry.resource ? (JSON.parse(entry.resource) as IResource) : undefined
        if (resource) {
          await cacheResource(resource, true)
          logger.warn({
            msg: formatFlappingRecoveredMessage(
              resource.kind,
              resource.metadata?.namespace ?? '',
              resource.metadata?.name ?? ''
            ),
          })
        }
        delete entry.resource
        entry.throttled = false
        entry.lastCachedAt = 0
      }
    }
  }
}

function startMonitoringThrottled(): void {
  if (monitoringThrottledTimer) return

  monitoringThrottledTimer = setInterval(() => {
    void checkThrottleStatus().catch((err: unknown) => {
      logger.error({ msg: 'throttling check failed', error: err })
    })
  }, THROTTLING_CHECK_INTERVAL)

  monitoringThrottledTimer.unref()
  logger.info({ msg: 'throttling check started', interval: THROTTLING_CHECK_INTERVAL })
}

function stopMonitoringThrottled(): void {
  if (monitoringThrottledTimer) {
    clearInterval(monitoringThrottledTimer)
    monitoringThrottledTimer = undefined
    logger.info({ msg: 'monitoring throttled stopped' })
  }
}

export async function getKubeResources(kind: string, apiVersion: string) {
  const option = { apiVersion, kind }
  const apiVersionPlural = apiVersionPluralFn(option)
  const entries = Object.values(resourceCache[apiVersionPlural] || {})
  return batchPromiseAll(entries, (event) =>
    event.compressed.then((compressed) => inflateResource(compressed, eventDict))
  )
}

let hubClusterName = 'local-cluster'
export function getHubClusterName() {
  return hubClusterName
}

/** Reset hub cluster name to default. Used for test isolation. */
export function resetHubClusterName() {
  hubClusterName = 'local-cluster'
}

let isHubSelfManaged: boolean = false
export function getIsHubSelfManaged() {
  return isHubSelfManaged
}

let isObservabilityInstalled: boolean = false
export function getIsObservabilityInstalled() {
  return isObservabilityInstalled
}
export function resetIsObservabilityInstalled() {
  isObservabilityInstalled = false
}

// because rbac checks are expensive,
// run them only on the resources requested by the UI
export async function getAuthorizedResources(
  token: string,
  resources: ICompressedResource[],
  startInx: number,
  stopInx: number
): Promise<ITransformedResource[]> {
  const authorized: ITransformedResource[] = []

  // check every resource until we have reached just the requested number of items
  // anything more is a waste of response time
  let inx = 0
  const chunkSize = stopInx > 100 ? 100 : 50
  while (resources.length > inx && authorized.length < stopInx) {
    // perform it in item chunks
    const _resources = (await Promise.all(
      resources.slice(inx, inx + chunkSize).map(async (compressedResource) => {
        const { compressed, transform, remoteClusters } = compressedResource
        const resource = await inflateResource(compressed, getAppDict())
        return { ...resource, transform, remoteClusters }
      })
    )) as ITransformedResource[]
    const queue = _resources.map((resource) => {
      return (
        resource.remoteClusters
          ? canAccessRemoteResource(token, resource.remoteClusters)
          : canListResources(token, resource)
      )
        .then((allowResource) => (allowResource ? resource : undefined))
        .catch(() => {}) as Promise<IResource>
    })
    while (queue.length) {
      const resource = await queue.shift()
      if (resource) {
        authorized.push(resource)
      }
    }
    inx += chunkSize
  }
  return authorized.slice(startInx, stopInx)
}

function canListResources(token: string, resource: IResource): Promise<boolean> {
  return canListClusterScopedKind(resource, token).then((allowed) => {
    if (allowed) return true
    return canListNamespacedScopedKind(resource, token)
  })
}

// can this user access at least one of these remote clusters
function canAccessRemoteResource(token: string, clusterNames: string[]): Promise<boolean> {
  const promises = clusterNames.map((namespace) => {
    return canAccess(
      {
        kind: 'ManagedClusterView',
        apiVersion: 'view.open-cluster-management.io/v1beta1',
        metadata: { namespace },
      },
      'create',
      token
    )
  })
  return Promise.allSettled(promises).then((results) => {
    return results.some((result) => result.status == 'fulfilled' && result.value)
  })
}

export interface ResourceCache {
  [apiVersionKind: string]: {
    [uid: string]: {
      compressed: Promise<Buffer>
      eventID: Promise<number>
    }
  }
}

const resourceCache: ResourceCache = {}
export function getEventCache() {
  return resourceCache
}

/** Clear all cached resources. Used for test isolation. */
export function resetResourceCache() {
  for (const key in resourceCache) {
    delete resourceCache[key]
  }
}

const eventDict = createDictionary()
export function getEventDict() {
  return eventDict
}

export function startWatching(): void {
  ServerSideEvents.eventFilter = eventFilter
  startAccessCacheCleanup()
  startMonitoringThrottled()

  for (const definition of definitions) {
    void listAndWatch(definition)
  }
}
// https://kubernetes.io/docs/reference/using-api/api-concepts/
export async function listAndWatch(options: IWatchOptions) {
  const serviceAccountToken = getServiceAccountToken()
  while (!stopping) {
    try {
      const { resourceVersion } = await listKubernetesObjects(serviceAccountToken, options)
      if (options.isPolled) {
        await pollKubernetesObjects(serviceAccountToken, options)
      } else {
        await watchKubernetesObjects(serviceAccountToken, options, resourceVersion)
      }
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        // Happens when the response body is not JSON
        // Such as the case when the resource version if too old
        // fall through to rerun the list function
      } else if (err instanceof HTTPError) {
        switch (err.response.statusCode) {
          case 403:
            logger.error({ msg: 'watch', ...options, status: 'Forbidden' })
            await new Promise((resolve) =>
              setTimeout(resolve, 1 * 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref()
            )
            break
          case 404:
            logger.trace({ msg: 'watch', ...options, status: 'Not found' })
            await new Promise((resolve) =>
              setTimeout(resolve, 1 * 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref()
            )
            break
        }
      } else if (err instanceof Error) {
        if (err.message === 'Premature close' || err.message.startsWith('too old resource version')) {
          // Retry list and watch/poll immediately
        } else {
          await new Promise((resolve) => setTimeout(resolve, 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref())
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref())
      }
    }
  }
}

async function listKubernetesObjects(serviceAccountToken: string, options: IWatchOptions) {
  let resourceVersion = ''
  let _continue: string | undefined
  let itemCount = 0
  let items: IResource[] = []
  const { isPolled } = options
  while (!stopping) {
    const url = resourceUrl(options, { limit: '100', continue: _continue })
    const request = got
      .get(url, {
        headers: { authorization: `Bearer ${serviceAccountToken}` },
        https: { certificateAuthority: getCACertificate() },
      })
      .json<{
        metadata: { _continue?: string; continue?: string; resourceVersion: string }
        items: IResource[]
      }>()
    try {
      requests.push(request)
      const body = await request
      _continue = body.metadata._continue ?? body.metadata.continue
      const pruned = pruneResources(options, body.items)
      if (isPolled) {
        await polledAggregation(options, pruned, !_continue)
        itemCount += pruned.length
      } else {
        items = items.concat(pruned)
        resourceVersion = body.metadata.resourceVersion
      }
    } finally {
      requests = requests.filter((r) => r !== request)
    }
    if (!_continue) break
  }

  if (!isPolled || itemCount > 1000) {
    logger.info({
      msg: isPolled ? 'polled' : 'list',
      kind: options.kind,
      labels: options.labelSelector,
      fields: options.fieldSelector,
      apiVersion: options.apiVersion,
      count: itemCount || items.length,
    })
  }
  if (isPolled) {
    return { size: itemCount }
  }

  const forward = options.forwardEventsToClients !== false
  await batchPromiseAll(items, (item) => cacheResource(item, forward))

  // Remove items that are no longer in kubernetes
  const apiVersionPlural = apiVersionPluralFn(options)
  const cache = resourceCache[apiVersionPlural]
  const removeResources: IResource[] = []
  for (const uid in cache) {
    const existing = cache[uid]
    const resource = await existing.compressed.then((compressed) => inflateResource(compressed, eventDict))
    if (options.fieldSelector && !matchesSelector(resource, options.fieldSelector)) {
      // skip as this object would not be in the items result for this list operation
      continue
    }
    if (options.labelSelector && !matchesSelector(resource.metadata?.labels, options.labelSelector)) {
      // skip as this object would not be in the items result for this list operation
      continue
    }
    if (!items.find((resource) => resource.metadata.uid === uid)) {
      removeResources.push(resource)
    }
  }
  await batchPromiseAll(removeResources, (resource) => deleteResource(resource, forward))

  return { resourceVersion, size: items.length }
}

async function pollKubernetesObjects(serviceAccountToken: string, options: IWatchOptions) {
  while (!stopping) {
    logger.debug({
      msg: 'poll',
      kind: options.kind,
      labels: options.labelSelector,
      fields: options.fieldSelector,
      apiVersion: options.apiVersion,
    })

    let size = 2000
    try {
      ;({ size } = await listKubernetesObjects(serviceAccountToken, options))
    } catch (e) {
      logger.error(`poll kubernetes exception ${e}`)
    }

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'test') {
      // polling interval starting at minTimeout and increasing up to maxTimeout seconds
      // where anything above maxApp will get the maximum maxTimeout
      // for larger kube resource lists
      const maxApps = 5000
      const minTimeout = 15000
      const maxTimeout = 45000
      const timeout = Math.round(
        size > maxApps ? maxTimeout : (size * (maxTimeout - minTimeout)) / maxApps + minTimeout
      )
      await new Promise((r) => setTimeout(r, timeout))
    } else {
      stopping = true
    }
  }
}

/**
 * Creates a Transform stream that splits incoming data by newline characters
 */
export function createSplitStream() {
  let buffer = ''
  return new Transform({
    objectMode: true,
    transform(chunk: Buffer, _encoding, callback) {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || ''
      // Push all complete lines
      for (const line of lines) {
        if (line.trim()) {
          this.push(line)
        }
      }
      callback()
    },
    flush(callback) {
      // Push any remaining data in buffer
      if (buffer.trim()) {
        this.push(buffer)
      }
      callback()
    },
  })
}

/**
 * Helper to convert unknown error to string
 */
export function errorToString(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'string') {
    return err
  }
  return JSON.stringify(err)
}

/**
 * Creates a Transform stream that processes watch events with async operations
 */
export function createWatchEventProcessor(options: IWatchOptions, url: string, resourceVersionRef: { value: string }) {
  const forward = options.forwardEventsToClients !== false
  return new Transform({
    objectMode: true,
    async transform(data: string, _encoding, callback): Promise<void> {
      try {
        let watchEvent: WatchEvent
        try {
          watchEvent = JSON.parse(data) as WatchEvent
        } catch (err: unknown) {
          logger.error({
            msg: 'JSON.parse failed',
            error: errorToString(err),
            data,
            url,
          })
          throw err
        }
        pruneResources(options, [watchEvent.object])
        // Track flapping Policy updates but skip caching/broadcasting suppressed events.
        if (
          (watchEvent.type === 'ADDED' || watchEvent.type === 'MODIFIED') &&
          shouldThrottleResource(watchEvent.object)
        ) {
          callback()
          return
        }
        switch (watchEvent.type) {
          case 'ADDED':
          case 'MODIFIED':
            try {
              await cacheResource(watchEvent.object, forward)
            } catch (err: unknown) {
              logger.error({
                msg: 'cacheResource failed',
                error: errorToString(err),
              })
              throw err
            }
            break
          case 'DELETED':
            try {
              await deleteResource(watchEvent.object, forward)
            } catch (err: unknown) {
              logger.error({
                msg: 'deleteResource failed',
                error: errorToString(err),
              })
              throw err
            }
            break
        }

        switch (watchEvent.type) {
          case 'ADDED':
            logger.debug({
              msg: 'added',
              kind: watchEvent.object.kind,
              name: watchEvent.object.metadata.name,
              namespace: watchEvent.object.metadata.namespace,
              apiVersion: watchEvent.object.apiVersion,
            })
            resourceVersionRef.value = watchEvent.object.metadata.resourceVersion
            break
          case 'MODIFIED':
            logger.debug({
              msg: 'modify',
              kind: watchEvent.object.kind,
              name: watchEvent.object.metadata.name,
              namespace: watchEvent.object.metadata.namespace,
              apiVersion: watchEvent.object.apiVersion,
            })
            resourceVersionRef.value = watchEvent.object.metadata.resourceVersion
            break
          case 'DELETED':
            logger.debug({
              msg: 'delete',
              kind: watchEvent.object.kind,
              name: watchEvent.object.metadata.name,
              namespace: watchEvent.object.metadata.namespace,
              apiVersion: watchEvent.object.apiVersion,
            })
            resourceVersionRef.value = watchEvent.object.metadata.resourceVersion
            break
          case 'BOOKMARK':
            logger.trace({
              msg: watchEvent.type.toLowerCase(),
              kind: options.kind,
              apiVersion: options.apiVersion,
              message: (watchEvent.object as unknown as { message: string }).message,
              reason: (watchEvent.object as unknown as { reason: string }).reason,
            })
            resourceVersionRef.value = watchEvent.object.metadata.resourceVersion
            break
          case 'ERROR':
            if ((watchEvent.object as unknown as { message?: string }).message.startsWith('too old resource version')) {
              logger.warn({
                msg: 'watch',
                warning: (watchEvent.object as unknown as { message?: string }).message,
                action: 'retrying watch',
                kind: options.kind,
                apiVersion: options.apiVersion,
              })
            } else {
              logger.warn({
                msg: 'watch',
                action: 'retrying watch',
                kind: options.kind,
                apiVersion: options.apiVersion,
                event: watchEvent,
              })
            }
            throw new Error((watchEvent.object as unknown as { message?: string }).message)
        }

        // Don't push anything downstream - we're just processing events
        callback()
      } catch (err: unknown) {
        // Catch any unexpected errors and pass them to the callback
        callback(err instanceof Error ? err : new Error(errorToString(err)))
      }
    },
  })
}

async function watchKubernetesObjects(
  serviceAccountToken: string,
  options: IWatchOptions,
  initialResourceVersion: string
) {
  const resourceVersionRef = { value: initialResourceVersion }
  while (!stopping) {
    logger.debug({
      msg: 'watch',
      kind: options.kind,
      labels: options.labelSelector,
      fields: options.fieldSelector,
      apiVersion: options.apiVersion,
    })

    try {
      const url = resourceUrl(options, {
        watch: undefined,
        allowWatchBookmarks: undefined,
        resourceVersion: resourceVersionRef.value,
      })
      const request = got.stream(url, {
        headers: { authorization: `Bearer ${serviceAccountToken}` },
        https: { certificateAuthority: getCACertificate() },
        timeout: { socket: 5 * 60 * 1000 + Math.ceil(Math.random() * 10 * 1000) },
      })
      // TODO use abort signal when on node 16
      const cancelObj = { cancel: () => request.destroy() }
      requests.push(cancelObj)
      try {
        await pipeline(request, createSplitStream(), createWatchEventProcessor(options, url, resourceVersionRef))
      } finally {
        requests = requests.filter((r) => r !== cancelObj)
      }
    } catch (err: unknown) {
      if (err instanceof TimeoutError) {
        // Timeout when we have not recieved an event in 5 min
        // Do nothing - retry the watch
      } else if (err instanceof CancelError) {
        // Aborting the list/watch causes a CancelError
        // Do nothing - fall through to allow exit
      } else if (err instanceof SyntaxError) {
        // Happens when the response body is not JSON
        // Such as the case when the resource version if too old
        // Need to throw error to cause a list function to rerun
        logger.trace({ msg: 'SyntaxError', ...options })
        throw err
      } else if (err instanceof HTTPError) {
        switch (err.response.statusCode) {
          case 410:
            // https://kubernetes.io/docs/reference/using-api/api-concepts/
            // A given Kubernetes server will only preserve a historical record of changes for a limited time.
            // Clusters using etcd 3 preserve changes in the last 5 minutes by default.
            // When the requested watch operations fail because the historical version of that resource is not available,
            // clients must handle the case by recognizing the status code 410 Gone, clearing their local cache,
            // performing a new get or list operation, and starting the watch from the resourceVersion that was returned.
            //
            // Throw error fall through to perform a list and reconcile
            throw err
          default:
            logger.warn({
              msg: 'watch',
              warning: (err as Error)?.message,
              ...options,
              errorName: (err as Error)?.name,
            })
            throw err
        }
      } else {
        if ((err as Error)?.message === 'Premature close') {
          // Do nothing
        } else {
          logger.warn({
            msg: 'watch',
            warning: (err as Error)?.message,
            ...options,
            errorName: (err as Error)?.name,
          })
          throw err
        }
      }
    }
  }
}

function apiVersionPluralFn(options: { apiVersion: string; kind: string }) {
  return `/${options.apiVersion}/${pluralize(options.kind.toLowerCase())}`
}

function resourceUrl(options: IWatchOptions, query: Record<string, string>) {
  let url = process.env.CLUSTER_API_URL ?? ''
  url += options.apiVersion.includes('/') ? '/apis' : '/api'
  url += apiVersionPluralFn(options)

  const queryStrings: string[] = []
  for (const key in query) {
    const value = query[key]
    if (value === undefined) {
      queryStrings.push(`${key}`)
    } else {
      queryStrings.push(`${key}=${value}`)
    }
  }

  if (options?.labelSelector) {
    let labelSelector = 'labelSelector='
    labelSelector += Object.keys(options.labelSelector)
      .map((key) => `${key}=${options.labelSelector[key] ?? ''}`)
      .join(',')
    queryStrings.push(labelSelector)
  }

  if (options?.fieldSelector) {
    let fieldSelector = 'fieldSelector='
    fieldSelector += Object.keys(options.fieldSelector)
      .map((key) => `${key}=${options.fieldSelector[key] ?? ''}`)
      .join(',')
    queryStrings.push(fieldSelector)
  }

  if (queryStrings.length) {
    url += '?' + queryStrings.join('&')
  }

  return url
}

const NO_BROADCAST_EVENT_ID = Promise.resolve(-1)

export async function cacheResource(resource: IResource, forwardEventsToClients = true) {
  const apiVersionPlural = apiVersionPluralFn(resource)
  let cache = resourceCache[apiVersionPlural]
  if (!cache) {
    cache = {}
    resourceCache[apiVersionPlural] = cache
  }

  const uid = resource.metadata.uid

  let existing = cache[uid]
  while (existing) {
    if (
      (await inflateResource(await existing.compressed, eventDict)).metadata.resourceVersion ===
      resource.metadata.resourceVersion
    ) {
      return resource.metadata.resourceVersion
    }
    const eventID = await existing.eventID
    const latestExisting = cache[uid]
    if (latestExisting === existing) {
      // if no other cacheResource call updated the cache while we were awaiting, we can replace the cache entry and event
      if (eventID > 0) ServerSideEvents.removeEvent(eventID)
      break
    }
    // if a deleteResource ran while we were awaiting, we will exit the loop because the resource is no longer existing
    // if another cacheResource call updated the cache while we were awaiting, we will check again if the resourceVersion is the same
    existing = latestExisting
  }
  const compressed = deflateResource(resource, eventDict)
  const meta: EventResourceMeta = {
    kind: resource.kind,
    apiVersion: resource.apiVersion,
    name: resource.metadata?.name,
    namespace: resource.metadata?.namespace,
  }
  const eventID = forwardEventsToClients
    ? compressed.then((compressed) =>
        ServerSideEvents.pushEvent({
          data: { type: 'MODIFIED', object: compressed, meta },
        })
      )
    : NO_BROADCAST_EVENT_ID
  cache[uid] = { compressed, eventID }

  if (resource.kind === 'ManagedCluster') {
    if (resource?.metadata?.labels?.['local-cluster'] === 'true') {
      hubClusterName = resource?.metadata?.name
      isHubSelfManaged = true
    }
  }

  if (
    resource.kind === 'ManagedClusterAddOn' &&
    resource.apiVersion.startsWith('addon.open-cluster-management.io/') &&
    (resource.metadata?.name === 'observability-controller' ||
      resource.metadata?.name == 'multicluster-observability-addon')
  ) {
    isObservabilityInstalled = true
  }
}

async function deleteResource(resource: IResource, forwardEventsToClients = true) {
  const apiVersionPlural = apiVersionPluralFn(resource)
  const cache = resourceCache[apiVersionPlural]
  if (!cache) return

  const uid = resource.metadata.uid

  const existing = cache[uid]
  if (existing) {
    const eventID = await existing.eventID
    if (eventID > 0) ServerSideEvents.removeEvent(eventID)
  }

  if (forwardEventsToClients) {
    const deletedID = await ServerSideEvents.pushEvent({
      data: {
        type: 'DELETED',
        object: {
          kind: resource.kind,
          apiVersion: resource.apiVersion,
          metadata: { name: resource.metadata.name, namespace: resource.metadata.namespace },
        },
        meta: {
          kind: resource.kind,
          apiVersion: resource.apiVersion,
          name: resource.metadata.name,
          namespace: resource.metadata.namespace,
        },
      },
    })
    // after deletion has been broadcast to current clients, no need to retain
    ServerSideEvents.removeEvent(deletedID)
  }
  delete cache[uid]
}

function matchesSelector(target: object | undefined, selector: Record<string, string>) {
  if (target === undefined) return false
  for (const key in selector) {
    const value = selector[key]
    const targetValue = get(target, key) as unknown
    if (targetValue !== value) return false
  }
  return true
}

function eventFilter(token: string, serverSideEvent: ServerSideEvent<ServerSideEventData>): Promise<boolean> {
  switch (serverSideEvent.data?.type) {
    case 'START':
    case 'EOP':
    case 'LOADED':
    case 'SETTINGS':
      return Promise.resolve(true)

    case 'DELETED':
      // TODO - Security issue: Only send delete events to clients who can access that item
      // - Problem is if the namespace goes away, access check will fail
      // - Need to track what is sent to client and only send if they previously accessed this event
      return Promise.resolve(true)
    case 'ADDED':
    case 'MODIFIED': {
      const meta = getEventResourceMeta(serverSideEvent)
      if (!meta?.kind || !meta.apiVersion) {
        return Promise.resolve(false)
      }
      const resource = {
        kind: meta.kind,
        apiVersion: meta.apiVersion,
        metadata: { name: meta.name, namespace: meta.namespace },
      }
      // Fast path: cluster-scoped list (admins / broad ClusterRoles).
      return canListClusterScopedKind(resource, token).then((allowed) => {
        if (allowed) return true
        // After cluster list is denied, use SelfSubjectRulesReview instead of O(N) SSARs.
        return canGetResource(resource, token)
      })
    }
    default:
      logger.warn({ msg: 'unhandled server side event data type', serverSideEvent })
      return Promise.resolve(false)
  }
}

let stopping = false
export function stopWatching(): void {
  stopping = true
  stopAccessCacheCleanup()
  stopMonitoringThrottled()
  for (const request of requests) {
    request.cancel()
  }
}

function pruneResources(option: IWatchOptions, items: IResource[]) {
  return items.map((resource) => {
    resource.kind = option.kind
    resource.apiVersion = option.apiVersion
    switch (resource.kind) {
      case 'Policy':
        break
      default:
        delete resource.metadata.managedFields
    }
    return resource
  })
}
