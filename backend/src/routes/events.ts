/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable no-constant-condition */

import * as eventStream from 'event-stream'
import { readFileSync } from 'fs'
import * as get from 'get-value'
import got, { CancelError, HTTPError, TimeoutError } from 'got'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import * as pluralize from 'pluralize'
import { Stream } from 'stream'
import { promisify } from 'util'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { unauthorized } from '../lib/respond'
import { ServerSideEvent, ServerSideEvents } from '../lib/server-side-events'
import { getToken } from '../lib/token'
import { IResource } from '../resources/resource'

export function getServiceAcccountToken(): string {
    if (serviceAcccountToken === undefined) {
        try {
            serviceAcccountToken = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token').toString()
        } catch (err) {
            serviceAcccountToken = process.env.TOKEN
            if (!serviceAcccountToken) {
                logger.error('service account token not found')
                process.exit(1)
            }
        }
    }
    return serviceAcccountToken
}
let serviceAcccountToken: string

const { map, split } = eventStream
const pipeline = promisify(Stream.pipeline)

export function events(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = getToken(req)
    if (!token) return unauthorized(req, res)
    ServerSideEvents.handleRequest(token, req, res)
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
    { kind: 'InfraEnv', apiVersion: 'agent-install.openshift.io/v1beta1' },
    { kind: 'Infrastructure', apiVersion: 'config.openshift.io/v1' },
    {
        kind: 'CertificateSigningRequest',
        apiVersion: 'certificates.k8s.io/v1',
        labelSelector: { 'open-cluster-management.io/cluster-name': '' },
    },
    { kind: 'ManagedCluster', apiVersion: 'cluster.open-cluster-management.io/v1' },
    { kind: 'ManagedClusterSetBinding', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
    { kind: 'ManagedClusterSet', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
    { kind: 'ClusterCurator', apiVersion: 'cluster.open-cluster-management.io/v1beta1' },
    { kind: 'DiscoveredCluster', apiVersion: 'discovery.open-cluster-management.io/v1alpha1' },
    { kind: 'DiscoveryConfig', apiVersion: 'discovery.open-cluster-management.io/v1alpha1' },
    { kind: 'AgentClusterInstall', apiVersion: 'extensions.hive.openshift.io/v1beta1' },
    { kind: 'ClusterClaim', apiVersion: 'hive.openshift.io/v1' },
    { kind: 'ClusterDeployment', apiVersion: 'hive.openshift.io/v1' },
    { kind: 'ClusterImageSet', apiVersion: 'hive.openshift.io/v1' },
    { kind: 'ClusterPool', apiVersion: 'hive.openshift.io/v1' },
    { kind: 'ClusterProvision', apiVersion: 'hive.openshift.io/v1' },
    { kind: 'MachinePool', apiVersion: 'hive.openshift.io/v1' },
    { kind: 'ManagedClusterInfo', apiVersion: 'internal.open-cluster-management.io/v1beta1' },
    { kind: 'BareMetalAsset', apiVersion: 'inventory.open-cluster-management.io/v1alpha1' },
    { kind: 'BareMetalHost', apiVersion: 'metal3.io/v1alpha1' },
    { kind: 'MultiClusterHub', apiVersion: 'operator.open-cluster-management.io/v1' },
    { kind: 'SubmarinerConfig', apiVersion: 'submarineraddon.open-cluster-management.io/v1alpha1' },
    { kind: 'AnsibleJob', apiVersion: 'tower.ansible.com/v1alpha1' },
    { kind: 'ConfigMap', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'insight-content-data' } },
    {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        fieldSelector: { 'metadata.namespace': 'assisted-installer', 'metadata.name': 'assisted-service-config' },
    },
    {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        fieldSelector: { 'metadata.namespace': 'rhacm', 'metadata.name': 'assisted-service' },
    },
    {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        fieldSelector: { 'metadata.namespace': 'open-cluster-management', 'metadata.name': 'assisted-service' },
    },
    {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        fieldSelector: { 'metadata.namespace': 'openshift-config-managed', 'metadata.name': 'console-public' },
    },
    { kind: 'Namespace', apiVersion: 'v1' },
    { kind: 'Secret', apiVersion: 'v1', labelSelector: { 'cluster.open-cluster-management.io/credentials': '' } },
    { kind: 'Secret', apiVersion: 'v1', fieldSelector: { 'metadata.name': 'auto-import-secret' } },
    { kind: 'PolicyReport', apiVersion: 'wgpolicyk8s.io/v1alpha2' },
]

export function startWatching(): void {
    ServerSideEvents.eventFilter = eventFilter

    for (const definition of definitions) {
        void watch(definition)
    }
}

interface IWatchOptions {
    apiVersion: string
    kind: string
    labelSelector?: Record<string, string>
    fieldSelector?: Record<string, string>
}

// https://kubernetes.io/docs/reference/using-api/api-concepts/
async function watch(options: IWatchOptions) {
    while (!stopping) {
        try {
            const resourceVersion = await listKubernetesObjects(options)
            await watchKubernetesObjects(options, resourceVersion)
        } catch (err: unknown) {
            if (err instanceof HTTPError) {
                switch (err.response.statusCode) {
                    case 404:
                        logger.warn({ msg: 'watch', ...options, error: err.message, name: err.name })
                        await new Promise((resolve) =>
                            setTimeout(resolve, 5 * 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref()
                        )
                        break
                }
            } else if (err instanceof Error) {
                if (err.message === 'Premature close') {
                    // Do nothing
                } else {
                    logger.warn({ msg: 'watch', error: err.message, name: err.name, ...options })
                    await new Promise((resolve) =>
                        setTimeout(resolve, 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref()
                    )
                }
            } else {
                logger.warn({ msg: 'watch', err, ...options })
                await new Promise((resolve) =>
                    setTimeout(resolve, 60 * 1000 + Math.ceil(Math.random() * 10 * 1000)).unref()
                )
            }
        }
    }
}

async function listKubernetesObjects(options: IWatchOptions) {
    const serviceAcccountToken = getServiceAcccountToken()
    let resourceVersion = ''
    let _continue: string | undefined
    let items: IResource[] = []
    while (!stopping) {
        const url = resourceUrl(options, { limit: '100', continue: _continue })
        const request = got
            .get(url, {
                headers: { authorization: `Bearer ${serviceAcccountToken}` },
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

    logger.debug({ msg: 'list', ...options, count: items.length })

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
        if (!matchesSelector(existing.resource, options.fieldSelector)) continue
        if (!matchesSelector(existing.resource, options.labelSelector)) continue
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
    const serviceAcccountToken = getServiceAcccountToken()
    while (!stopping) {
        logger.debug({ msg: 'watch', ...options })
        try {
            const url = resourceUrl(options, { watch: undefined, allowWatchBookmarks: undefined, resourceVersion })
            const request = got.stream(url, {
                headers: { authorization: `Bearer ${serviceAcccountToken}` },
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
                            case 'BOOKMARK':
                                break
                        }

                        logger.trace({
                            msg: 'watch',
                            type: watchEvent.type,
                            kind: watchEvent.object.kind,
                            apiVersion: watchEvent.object.apiVersion,
                            name: watchEvent.object.metadata.name,
                            namespace: watchEvent.object.metadata.namespace,
                        })

                        resourceVersion = watchEvent.object.metadata.resourceVersion
                    })
                )
            } finally {
                requests = requests.filter((r) => r !== cancelObj)
            }
        } catch (err: unknown) {
            if (err instanceof TimeoutError) {
                // Do Nothing
            } else if (err instanceof CancelError) {
                // Do Nothing
            } else if (err instanceof HTTPError) {
                switch (err.response.statusCode) {
                    case 410:
                        logger.warn({ msg: 'watch retry', error: err.message, name: err.name, ...options })
                        break
                    default:
                        throw err
                }
            } else {
                throw err
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

    const uid = resource.metadata.uid ?? ''
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

function matchesSelector(resource: IResource, selector?: Record<string, string>) {
    if (selector === undefined) return true
    for (const key in selector) {
        const value = selector[key]
        const resourceValue = get(resource, key) as unknown
        if (resourceValue !== value) return false
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
                        resource.metadata?.namespace ??
                        (resource.kind === 'Namespace' ? resource.metadata?.name : undefined),
                    resource: resource.kind.toLowerCase() + 's',
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
                resource: resource.kind.toLowerCase() + 's',
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
    delete resource.metadata.managedFields
}
