/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable no-constant-condition */

import eventStream from 'event-stream'
import get from 'get-value'
import got, { CancelError, HTTPError, TimeoutError } from 'got'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import pluralize from 'pluralize'
import { Stream } from 'stream'
import { promisify } from 'util'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { ServerSideEvent, ServerSideEvents } from '../lib/server-side-events'
import { getAuthenticatedToken } from '../lib/token'
import { IResource } from '../resources/resource'
import { getServiceAccountToken } from './serviceAccountToken'

const { map, split } = eventStream
const pipeline = promisify(Stream.pipeline)

export async function events(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    ServerSideEvents.handleRequest(token, req, res)
  }
}

interface WatchEvent {
  type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'BOOKMARK' | 'ERROR'
  object: IResource
}

export interface SettingsEvent {
  type: 'SETTINGS'
  settings: Record<string, string>
}

type ServerSideEventData = WatchEvent | SettingsEvent | { type: 'START' | 'LOADED' }

let requests: { cancel: () => void }[] = []

const resourceCache: {
  [apiVersionKind: string]: {
    [uid: string]: {
      resource: IResource
      eventID: number
    }
  }
} = {}

const accessCache: Record<string, Record<string, { time: number; promise: Promise<boolean> }>> = {}

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
  { kind: 'AppProject', apiVersion: 'argoproj.io/v1alpha1' },
  { kind: 'Application', apiVersion: 'argoproj.io/v1alpha1' },
  { kind: 'ApplicationSet', apiVersion: 'argoproj.io/v1alpha1' },
  { kind: 'ArgoCD', apiVersion: 'argoproj.io/v1alpha1' },
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
  { kind: 'MultiClusterHub', apiVersion: 'operator.open-cluster-management.io/v1' },
  { kind: 'MultiClusterEngine', apiVersion: 'multicluster.openshift.io/v1' },
  { kind: 'ClusterVersion', apiVersion: 'config.openshift.io/v1' },
  { kind: 'StorageClass', apiVersion: 'storage.k8s.io/v1' },
  { kind: 'PlacementBinding', apiVersion: 'policy.open-cluster-management.io/v1' },
  { kind: 'Policy', apiVersion: 'policy.open-cluster-management.io/v1' },
  { kind: 'PolicyAutomation', apiVersion: 'policy.open-cluster-management.io/v1beta1' },
  { kind: 'PolicySet', apiVersion: 'policy.open-cluster-management.io/v1beta1' },
  { kind: 'SubmarinerConfig', apiVersion: 'submarineraddon.open-cluster-management.io/v1alpha1' },
  { kind: 'AnsibleJob', apiVersion: 'tower.ansible.com/v1alpha1' },
  { kind: 'ConfigMap', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'insight-content-data' } },
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
  { kind: 'Namespace', apiVersion: 'v1' },
  { kind: 'Secret', apiVersion: 'v1', labelSelector: { 'cluster.open-cluster-management.io/credentials': '' } },
  // **Need to look for creds with: 'cluster.open-cluster-management.io/type': 'ans', for edit scenarios
  { kind: 'Secret', apiVersion: 'v1', labelSelector: { 'cluster.open-cluster-management.io/type': 'ans' } },
  { kind: 'Secret', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'auto-import-secret' } },
  { kind: 'PolicyReport', apiVersion: 'wgpolicyk8s.io/v1alpha2' },
  { kind: 'UserPreference', apiVersion: 'console.open-cluster-management.io/v1' },
  { kind: 'HostedCluster', apiVersion: 'hypershift.openshift.io/v1beta1' },
  { kind: 'NodePool', apiVersion: 'hypershift.openshift.io/v1beta1' },
  { kind: 'AgentMachine', apiVersion: 'capi-provider.agent-install.openshift.io/v1alpha1' },
  { kind: 'CustomResourceDefinition', apiVersion: 'apiextensions.k8s.io/v1' },
  { kind: 'ConfigMap', apiVersion: 'v1', labelSelector: { 'hypershift.openshift.io/supported-versions': 'true' } },
]

export function startWatching(): void {
  ServerSideEvents.eventFilter = eventFilter

  for (const definition of definitions) {
    void listAndWatch(definition)
  }
}

interface IWatchOptions {
  apiVersion: string
  kind: string
  labelSelector?: Record<string, string>
  fieldSelector?: Record<string, string>
}

// https://kubernetes.io/docs/reference/using-api/api-concepts/
async function listAndWatch(options: IWatchOptions) {
  while (!stopping) {
    try {
      const resourceVersion = await listKubernetesObjects(options)
      await watchKubernetesObjects(options, resourceVersion)
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
        if (err.message === 'Premature close') {
          // Do nothing
        } else {
          await new Promise((resolve) => setTimeout(resolve, 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref())
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref())
      }
    }
  }
}

async function listKubernetesObjects(options: IWatchOptions) {
  const serviceAccountToken = getServiceAccountToken()
  let resourceVersion = ''
  let _continue: string | undefined
  let items: IResource[] = []
  while (!stopping) {
    const url = resourceUrl(options, { limit: '100', continue: _continue })
    const request = got
      .get(url, {
        headers: { authorization: `Bearer ${serviceAccountToken}` },
        https: { rejectUnauthorized: false },
      })
      .json<{
        metadata: { _continue?: string; continue?: string; resourceVersion: string }
        items: IResource[]
      }>()
    try {
      requests.push(request)
      const body = await request
      items = items.concat(body.items)
      resourceVersion = body.metadata.resourceVersion
      _continue = body.metadata._continue ?? body.metadata.continue
    } finally {
      requests = requests.filter((r) => r !== request)
    }
    if (!_continue) break
  }

  logger.info({
    msg: 'list',
    kind: options.kind,
    labels: options.labelSelector,
    fields: options.fieldSelector,
    apiVersion: options.apiVersion,
    count: items.length,
  })

  items = items.map((resource) => {
    resource.kind = options.kind
    resource.apiVersion = options.apiVersion
    pruneResource(resource)
    return resource
  })

  for (const item of items) {
    cacheResource(item)
  }

  // Remove items that are no longer in kubernetes
  const apiVersionPlural = apiVersionPluralFn(options)
  const cache = resourceCache[apiVersionPlural]
  const removeUids: string[] = []
  for (const uid in cache) {
    const existing = cache[uid]
    if (options.fieldSelector && !matchesSelector(existing.resource, options.fieldSelector)) {
      // skip as this object would not be in the items result for this list operation
      continue
    }
    if (options.labelSelector && !matchesSelector(existing.resource.metadata?.labels, options.labelSelector)) {
      // skip as this object would not be in the items result for this list operation
      continue
    }
    if (!items.find((resource) => resource.metadata.uid === uid)) {
      removeUids.push(uid)
    }
  }
  for (const uid of removeUids) {
    const resource = cache[uid].resource
    deleteResource(resource)
  }

  return resourceVersion
}

async function watchKubernetesObjects(options: IWatchOptions, resourceVersion: string) {
  const serviceAccountToken = getServiceAccountToken()
  while (!stopping) {
    logger.debug({
      msg: 'watch',
      kind: options.kind,
      labels: options.labelSelector,
      fields: options.fieldSelector,
      apiVersion: options.apiVersion,
    })

    try {
      const url = resourceUrl(options, { watch: undefined, allowWatchBookmarks: undefined, resourceVersion })
      const request = got.stream(url, {
        headers: { authorization: `Bearer ${serviceAccountToken}` },
        https: { rejectUnauthorized: false },
        timeout: { socket: 5 * 60 * 1000 + Math.ceil(Math.random() * 10 * 1000) },
      })
      // TODO use abort signal when on node 16
      const cancelObj = { cancel: () => request.destroy() }
      requests.push(cancelObj)
      try {
        await pipeline(
          request,
          split('\n'),
          map(function (data: string) {
            const watchEvent = JSON.parse(data) as WatchEvent
            pruneResource(watchEvent.object)
            switch (watchEvent.type) {
              case 'ADDED':
              case 'MODIFIED':
                cacheResource(watchEvent.object)
                break
              case 'DELETED':
                deleteResource(watchEvent.object)
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
                resourceVersion = watchEvent.object.metadata.resourceVersion
                break
              case 'MODIFIED':
                logger.debug({
                  msg: 'modify',
                  kind: watchEvent.object.kind,
                  name: watchEvent.object.metadata.name,
                  namespace: watchEvent.object.metadata.namespace,
                  apiVersion: watchEvent.object.apiVersion,
                })
                resourceVersion = watchEvent.object.metadata.resourceVersion
                break
              case 'DELETED':
                logger.debug({
                  msg: 'delete',
                  kind: watchEvent.object.kind,
                  name: watchEvent.object.metadata.name,
                  namespace: watchEvent.object.metadata.namespace,
                  apiVersion: watchEvent.object.apiVersion,
                })
                resourceVersion = watchEvent.object.metadata.resourceVersion
                break
              case 'BOOKMARK':
                logger.trace({
                  msg: watchEvent.type.toLowerCase(),
                  kind: options.kind,
                  apiVersion: options.apiVersion,
                  message: (watchEvent.object as unknown as { message: string }).message,
                  reason: (watchEvent.object as unknown as { reason: string }).reason,
                })
                resourceVersion = watchEvent.object.metadata.resourceVersion
                break
              case 'ERROR':
                if (
                  (watchEvent.object as unknown as { message?: string }).message.startsWith('too old resource version')
                ) {
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
                break
            }
          })
        )
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

function cacheResource(resource: IResource) {
  const apiVersionPlural = apiVersionPluralFn(resource)
  let cache = resourceCache[apiVersionPlural]
  if (!cache) {
    cache = {}
    resourceCache[apiVersionPlural] = cache
  }

  const uid = resource.metadata.uid
  const existing = cache[uid]

  if (existing) {
    if (existing.resource.metadata.resourceVersion === resource.metadata.resourceVersion)
      return resource.metadata.resourceVersion
    ServerSideEvents.removeEvent(existing.eventID)
  }

  const eventID = ServerSideEvents.pushEvent({ data: { type: 'MODIFIED', object: resource } })
  cache[uid] = { resource, eventID }
}

function deleteResource(resource: IResource) {
  const apiVersionPlural = apiVersionPluralFn(resource)
  const cache = resourceCache[apiVersionPlural]
  if (!cache) return

  const uid = resource.metadata.uid

  const existing = cache[uid]
  if (existing) ServerSideEvents.removeEvent(existing.eventID)

  ServerSideEvents.pushEvent({
    data: {
      type: 'DELETED',
      object: {
        kind: resource.kind,
        apiVersion: resource.apiVersion,
        metadata: { name: resource.metadata.name, namespace: resource.metadata.namespace },
      },
    },
  })

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

function canAccess(
  resource: { kind: string; apiVersion: string; metadata?: { name?: string; namespace?: string } },
  verb: 'get' | 'list',
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

function pruneResource(resource: IResource) {
  switch (resource.kind) {
    case 'Policy':
      break
    default:
      delete resource.metadata.managedFields
  }
}
