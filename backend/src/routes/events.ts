/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable no-constant-condition */

import get from 'get-value'
import got, { CancelError, HTTPError, TimeoutError } from 'got'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import pluralize from 'pluralize'
import { pipeline } from 'node:stream/promises'
import { Transform } from 'node:stream'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { ServerSideEvent, ServerSideEvents } from '../lib/server-side-events'
import { getCACertificate, getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import { IResource } from '../resources/resource'
import { polledAggregation } from './aggregator'
import { createDictionary, deflateResource, inflateResource } from '../lib/compression'
import { getAppDict, ICompressedResource, ITransformedResource } from './aggregators/applications'
import { IWatchOptions } from '../resources/watch-options'

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

type ServerSideEventData = WatchEvent | SettingsEvent | { type: 'START' | 'LOADED' }

let requests: { cancel: () => void }[] = []

export async function getKubeResources(kind: string, apiVersion: string) {
  const option = { apiVersion, kind }
  const apiVersionPlural = apiVersionPluralFn(option)
  return await Promise.all(
    Object.values(resourceCache[apiVersionPlural] || {}).map((event) => {
      return event.compressed.then((compressed) => inflateResource(compressed, eventDict))
    })
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

let isHubSelfManaged: boolean | undefined = undefined
export function getIsHubSelfManaged() {
  return isHubSelfManaged
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

const accessCache: Record<string, Record<string, { time: number; promise: Promise<boolean> }>> = {}

/** Clear all cached RBAC access checks. Used for test isolation. */
export function resetAccessCache() {
  for (const key in accessCache) {
    delete accessCache[key]
  }
}

const definitions: IWatchOptions[] = [
  { kind: 'ClusterManagementAddOn', apiVersion: 'addon.open-cluster-management.io/v1alpha1' },
  { kind: 'ManagedClusterAddOn', apiVersion: 'addon.open-cluster-management.io/v1alpha1' },
  { kind: 'Agent', apiVersion: 'agent-install.openshift.io/v1beta1' },
  { kind: 'AgentServiceConfig', apiVersion: 'agent-install.openshift.io/v1beta1' },
  { kind: 'InfraEnv', apiVersion: 'agent-install.openshift.io/v1beta1' },
  { kind: 'NMStateConfig', apiVersion: 'agent-install.openshift.io/v1beta1' },
  { kind: 'Application', apiVersion: 'app.k8s.io/v1beta1' },
  { kind: 'Channel', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'GitOpsCluster', apiVersion: 'apps.open-cluster-management.io/v1beta1' },
  { kind: 'HelmRelease', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'PlacementRule', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'Subscription', apiVersion: 'apps.open-cluster-management.io/v1' },
  { kind: 'SubscriptionReport', apiVersion: 'apps.open-cluster-management.io/v1alpha1' },
  { kind: 'Application', apiVersion: 'argoproj.io/v1alpha1', isPolled: true },
  { kind: 'ApplicationSet', apiVersion: 'argoproj.io/v1alpha1', isPolled: true },
  { kind: 'ArgoCD', apiVersion: 'argoproj.io/v1alpha1' },
  { kind: 'MulticlusterApplicationSetReport', apiVersion: 'apps.open-cluster-management.io/v1alpha1' },
  { kind: 'Infrastructure', apiVersion: 'config.openshift.io/v1' },
  {
    kind: 'CertificateSigningRequest',
    apiVersion: 'certificates.k8s.io/v1',
    labelSelector: { 'open-cluster-management.io/cluster-name': '' },
  },
  { kind: 'ManagedCluster', apiVersion: 'cluster.open-cluster-management.io/v1' },
  { kind: 'Placement', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
  { kind: 'Placement', apiVersion: 'cluster.open-cluster-management.io/v1alpha1' },
  { kind: 'PlacementDecision', apiVersion: 'cluster.open-cluster-management.io/v1alpha1' },
  { kind: 'PlacementDecision', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
  { kind: 'ManagedClusterSetBinding', apiVersion: 'cluster.open-cluster-management.io/v1beta2' },
  { kind: 'ManagedClusterSet', apiVersion: 'cluster.open-cluster-management.io/v1beta2' },
  { kind: 'ClusterCurator', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
  { kind: 'Subscription', apiVersion: 'operators.coreos.com/v1alpha1' },
  { kind: 'DiscoveredCluster', apiVersion: 'discovery.open-cluster-management.io/v1' },
  { kind: 'DiscoveryConfig', apiVersion: 'discovery.open-cluster-management.io/v1' },
  { kind: 'AgentClusterInstall', apiVersion: 'extensions.hive.openshift.io/v1beta1' },
  { kind: 'ClusterClaim', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ClusterDeployment', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ClusterImageSet', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ClusterPool', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ClusterProvision', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'MachinePool', apiVersion: 'hive.openshift.io/v1' },
  { kind: 'ManagedClusterInfo', apiVersion: 'internal.open-cluster-management.io/v1beta1' },
  { kind: 'BareMetalHost', apiVersion: 'metal3.io/v1alpha1' },
  { kind: 'MultiClusterEngine', apiVersion: 'multicluster.openshift.io/v1' },
  { kind: 'ClusterVersion', apiVersion: 'config.openshift.io/v1' },
  { kind: 'StorageClass', apiVersion: 'storage.k8s.io/v1' },
  { kind: 'PlacementBinding', apiVersion: 'policy.open-cluster-management.io/v1' },
  { kind: 'Policy', apiVersion: 'policy.open-cluster-management.io/v1' },
  { kind: 'PolicyAutomation', apiVersion: 'policy.open-cluster-management.io/v1beta1' },
  { kind: 'PolicySet', apiVersion: 'policy.open-cluster-management.io/v1beta1' },
  { kind: 'SubmarinerConfig', apiVersion: 'submarineraddon.open-cluster-management.io/v1alpha1' },
  { kind: 'AnsibleJob', apiVersion: 'tower.ansible.com/v1alpha1' },
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.name': 'assisted-service' },
  },
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.namespace': 'openshift-config-managed', 'metadata.name': 'console-public' },
  },
  { kind: 'ConfigMap', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'console-search-config' } },
  { kind: 'Namespace', apiVersion: 'v1' },
  { kind: 'Secret', apiVersion: 'v1', labelSelector: { 'cluster.open-cluster-management.io/credentials': '' } },
  // **Need to look for creds with: 'cluster.open-cluster-management.io/type': 'ans', for edit scenarios
  { kind: 'Secret', apiVersion: 'v1', labelSelector: { 'cluster.open-cluster-management.io/type': 'ans' } },
  { kind: 'Secret', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'auto-import-secret' } },
  { kind: 'PolicyReport', apiVersion: 'wgpolicyk8s.io/v1alpha2' },
  { kind: 'HostedCluster', apiVersion: 'hypershift.openshift.io/v1beta1' },
  { kind: 'NodePool', apiVersion: 'hypershift.openshift.io/v1beta1' },
  { kind: 'AgentMachine', apiVersion: 'capi-provider.agent-install.openshift.io/v1alpha1' },
  { kind: 'ConfigMap', apiVersion: 'v1', labelSelector: { 'hypershift.openshift.io/supported-versions': 'true' } },
  { kind: 'Search', apiVersion: 'search.open-cluster-management.io/v1alpha1' },
  // Configmaps that contain Grafana dashboard IDs
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.name': 'grafana-dashboard-acm-openshift-virtualization-clusters-overview' },
  },
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    fieldSelector: { 'metadata.name': 'grafana-dashboard-acm-openshift-virtualization-single-vm-view' },
  },
  { kind: 'ClusterPermission', apiVersion: 'rbac.open-cluster-management.io/v1alpha1' },
]

export function startWatching(): void {
  ServerSideEvents.eventFilter = eventFilter

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

  await Promise.all(items.map((item) => cacheResource(item)))

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
  await Promise.all(removeResources.map((resource) => deleteResource(resource)))

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
        switch (watchEvent.type) {
          case 'ADDED':
          case 'MODIFIED':
            try {
              await cacheResource(watchEvent.object)
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
              await deleteResource(watchEvent.object)
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

export async function cacheResource(resource: IResource) {
  const apiVersionPlural = apiVersionPluralFn(resource)
  let cache = resourceCache[apiVersionPlural]
  if (!cache) {
    cache = {}
    resourceCache[apiVersionPlural] = cache
  }

  const uid = resource.metadata.uid
  const existing = cache[uid]

  if (existing) {
    if (
      (await inflateResource(await existing.compressed, eventDict)).metadata.resourceVersion ===
      resource.metadata.resourceVersion
    ) {
      return resource.metadata.resourceVersion
    }
    ServerSideEvents.removeEvent(await existing.eventID)
  }
  const compressed = deflateResource(resource, eventDict)
  const eventID = compressed.then((compressed) =>
    ServerSideEvents.pushEvent({ data: { type: 'MODIFIED', object: compressed } })
  )
  cache[uid] = { compressed, eventID }

  if (resource.kind === 'ManagedCluster') {
    if (resource?.metadata?.labels?.['local-cluster'] === 'true') {
      hubClusterName = resource?.metadata?.name
      isHubSelfManaged = true
    }
  }
}

async function deleteResource(resource: IResource) {
  const apiVersionPlural = apiVersionPluralFn(resource)
  const cache = resourceCache[apiVersionPlural]
  if (!cache) return

  const uid = resource.metadata.uid

  const existing = cache[uid]
  if (existing) ServerSideEvents.removeEvent(await existing.eventID)

  const deletedID = await ServerSideEvents.pushEvent({
    data: {
      type: 'DELETED',
      object: {
        kind: resource.kind,
        apiVersion: resource.apiVersion,
        metadata: { name: resource.metadata.name, namespace: resource.metadata.namespace },
      },
    },
  })
  // after deletion has been broadcast to current clients, no need to retain
  ServerSideEvents.removeEvent(deletedID)
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
      const watchEvent = serverSideEvent.data
      const resource = watchEvent.object
      return canListClusterScopedKind(resource, token).then((allowed) => {
        if (allowed) return true
        return canListNamespacedScopedKind(resource, token).then((allowed) => {
          if (allowed) return true
          return canGetResource(resource, token)
        })
      })
    }
    default:
      logger.warn({ msg: 'unhandled server side event data type', serverSideEvent })
      return Promise.resolve(false)
  }
}

function canListClusterScopedKind(resource: IResource, token: string): Promise<boolean> {
  return canAccess({ kind: resource.kind, apiVersion: resource.apiVersion }, 'list', token)
}

function canListNamespacedScopedKind(resource: IResource, token: string): Promise<boolean> {
  if (!resource.metadata?.namespace) return Promise.resolve(false)
  return canAccess(
    {
      kind: resource.kind,
      apiVersion: resource.apiVersion,
      metadata: { namespace: resource.metadata.namespace },
    },
    'list',
    token
  )
}

function canGetResource(resource: IResource, token: string): Promise<boolean> {
  return canAccess(resource, 'get', token)
}

export function canAccess(
  resource: { kind: string; apiVersion: string; metadata?: { name?: string; namespace?: string } },
  verb: 'get' | 'list' | 'create',
  token: string
): Promise<boolean> {
  // TODO make sure old cache items get cleaned up

  const key = `${resource.kind}:${resource.metadata?.namespace}:${resource.metadata?.name}`
  if (!accessCache[token]) accessCache[token] = {}
  const existing = accessCache[token][key]
  if (existing && existing.time > Date.now() - 60 * 1000) {
    return existing.promise
  }

  const promise = jsonPost<{ status: { allowed: boolean } }>(
    process.env.CLUSTER_API_URL + '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
    {
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      metadata: {},
      spec: {
        resourceAttributes: {
          group: resource.apiVersion.includes('/') ? resource.apiVersion.split('/')[0] : '',
          name: resource.metadata?.name,
          namespace:
            resource.metadata?.namespace ?? (resource.kind === 'Namespace' ? resource.metadata?.name : undefined),
          resource: pluralize(resource.kind.toLowerCase()),
          verb,
        },
      },
    },
    token
  ).then((result) => {
    if (process.env.LOG_ACCESS === 'true') {
      logger.debug({
        msg: 'access',
        allowed: result.body.status.allowed,
        verb,
        resource: pluralize(resource.kind.toLowerCase()),
        name: resource.metadata?.name,
        namespace: resource.metadata?.namespace,
      })
    }
    return result.body.status.allowed
  })

  accessCache[token][key] = {
    time: Date.now(),
    promise,
  }
  return promise
}

let stopping = false
export function stopWatching(): void {
  stopping = true
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
