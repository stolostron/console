/* Copyright Contributors to the Open Cluster Management project */
import AbortController from 'abort-controller'
import { IncomingMessage, STATUS_CODES } from 'http'
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { noop } from '../lib/noop'
import { requestRetry } from '../lib/request-retry'
import { unauthorized } from '../lib/respond'
import { ServerSideEvent, ServerSideEvents } from '../lib/server-side-events'
import { getToken } from '../lib/token'
import { IResource } from '../resources/resource'
import { serviceAcccountToken, setDead } from './liveness'

const { HTTP_STATUS_OK, HTTP_STATUS_FORBIDDEN, HTTP_STATUS_NOT_FOUND, HTTP2_HEADER_AUTHORIZATION } = constants

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

const abortControllers: Record<string, AbortController> = {}

const resourceCache: {
    [kind: string]: {
        [namespace: string]: {
            [name: string]: {
                resource: IResource
                eventID: number
            }
        }
    }
} = {}

export function startWatching(): void {
    const token = serviceAcccountToken

    ServerSideEvents.eventFilter = eventFilter

    watchResource(token, 'addon.open-cluster-management.io/v1alpha1', 'clusterManagementAddons')
    watchResource(token, 'addon.open-cluster-management.io/v1alpha1', 'managedClusterAddons')
    watchResource(token, 'agent-install.openshift.io/v1beta1', 'agents')
    watchResource(token, 'agent-install.openshift.io/v1beta1', 'infraenvs')
    watchResource(token, 'app.k8s.io/v1beta1', 'applications')
    watchResource(token, 'apps.open-cluster-management.io/v1', 'channels')
    // watchResource(token, 'apps.open-cluster-management.io/v1', 'deployables')
    watchResource(token, 'apps.open-cluster-management.io/v1alpha1', 'gitOpsClusters')
    // watchResource(token, 'apps.open-cluster-management.io/v1', 'helmReleases')
    watchResource(token, 'apps.open-cluster-management.io/v1', 'placementRules')
    watchResource(token, 'apps.open-cluster-management.io/v1', 'subscriptions')
    watchResource(token, 'argoproj.io/v1alpha1', 'appProjects')
    watchResource(token, 'argoproj.io/v1alpha1', 'applications')
    watchResource(token, 'argoproj.io/v1alpha1', 'applicationSets')
    watchResource(token, 'argoproj.io/v1alpha1', 'argoCDs')
    watchResource(token, 'config.openshift.io/v1', 'infrastructures')
    watchResource(token, 'certificates.k8s.io/v1beta1', 'certificateSigningRequests', {
        labelSelector: { 'open-cluster-management.io/cluster-name': '' },
    })
    watchResource(token, 'cluster.open-cluster-management.io/v1', 'managedClusters')
    watchResource(token, 'cluster.open-cluster-management.io/v1beta1', 'managedClusterSetBindings')
    watchResource(token, 'cluster.open-cluster-management.io/v1beta1', 'managedClusterSets')
    watchResource(token, 'cluster.open-cluster-management.io/v1beta1', 'clusterCurators')
    watchResource(token, 'discovery.open-cluster-management.io/v1alpha1', 'discoveredClusters')
    watchResource(token, 'discovery.open-cluster-management.io/v1alpha1', 'discoveryConfigs')
    watchResource(token, 'extensions.hive.openshift.io/v1beta1', 'agentclusterinstalls')
    watchResource(token, 'hive.openshift.io/v1', 'clusterClaims')
    watchResource(token, 'hive.openshift.io/v1', 'clusterDeployments')
    watchResource(token, 'hive.openshift.io/v1', 'clusterImageSets')
    watchResource(token, 'hive.openshift.io/v1', 'clusterPools')
    watchResource(token, 'hive.openshift.io/v1', 'clusterProvisions')
    watchResource(token, 'hive.openshift.io/v1', 'machinePools')
    watchResource(token, 'internal.open-cluster-management.io/v1beta1', 'managedClusterInfos')
    watchResource(token, 'inventory.open-cluster-management.io/v1alpha1', 'bareMetalAssets')
    watchResource(token, 'metal3.io/v1alpha1', 'baremetalhosts')
    watchResource(token, 'operator.open-cluster-management.io/v1', 'multiClusterHubs')
    watchResource(token, 'policy.open-cluster-management.io/v1', 'placementBindings')
    watchResource(token, 'policy.open-cluster-management.io/v1', 'policies')
    watchResource(token, 'submarineraddon.open-cluster-management.io/v1alpha1', 'submarinerconfigs')
    watchResource(token, 'tower.ansible.com/v1alpha1', 'ansiblejobs')
    watchResource(token, 'v1', 'configmaps', { fieldSelector: { 'metadata.name': 'insight-content-data' } })
    watchResource(token, 'v1', 'configmaps', {
        fieldSelector: { 'metadata.namespace': 'assisted-installer', 'metadata.name': 'assisted-service-config' },
    })
    watchResource(token, 'v1', 'configmaps', {
        fieldSelector: { 'metadata.namespace': 'rhacm', 'metadata.name': 'assisted-service' },
    })
    watchResource(token, 'v1', 'configmaps', {
        fieldSelector: { 'metadata.namespace': 'open-cluster-management', 'metadata.name': 'assisted-service' },
    })
    watchResource(token, 'v1', 'configmaps', {
        fieldSelector: { 'metadata.namespace': 'openshift-config-managed', 'metadata.name': 'console-public' },
    })
    watchResource(token, 'v1', 'namespaces')
    watchResource(token, 'v1', 'secrets', { labelSelector: { 'cluster.open-cluster-management.io/credentials': '' } })
    watchResource(token, 'v1', 'secrets', { fieldSelector: { 'metadata.name': 'auto-import-secret' } })
    watchResource(token, 'wgpolicyk8s.io/v1alpha2', 'policyreports')
}

export function watchResource(
    token: string,
    apiVersion: string,
    kind: string,
    options?: {
        labelSelector?: Record<string, string>
        fieldSelector?: Record<string, string>
    }
): void {
    if (stopping) return

    let path = apiVersion.includes('/') ? '/apis' : '/api'
    path += `/${apiVersion}/${kind.toLowerCase()}`
    path += `?watch`

    if (options?.labelSelector) {
        path += Object.keys(options.labelSelector).map((key) =>
            options.labelSelector[key]
                ? `&labelSelector=${key}=${options.labelSelector[key]}`
                : `&labelSelector=${key}=`
        )
    }

    if (options?.fieldSelector) {
        path += '&fieldSelector='
        path += Object.keys(options.fieldSelector).map((key) => `${key}=${options.fieldSelector[key]}`)
    }

    path += '&allowWatchBookmarks'

    const url = `${process.env.CLUSTER_API_URL}${path}`

    let buffer: Buffer = Buffer.from('')
    const abortController = new AbortController()

    function onWatchResponse(res: IncomingMessage) {
        if (res.statusCode === HTTP_STATUS_OK) {
            if (process.env.LOG_WATCH === 'true') {
                logger.info({ ...{ msg: 'watch start', kind }, ...(options ?? {}) })
            }
            res.on('data', (chunk) => {
                if (chunk instanceof Buffer) {
                    let oldBuffer = buffer
                    buffer = Buffer.concat([buffer, chunk])
                    oldBuffer.fill(0)
                    chunk.fill(0)

                    let index = buffer.indexOf('\n')
                    while (index !== -1) {
                        // TODO - Security: Search for secret and zero out secret

                        const data = buffer.slice(0, index)
                        try {
                            const watchEvent = JSON.parse(data.toString()) as WatchEvent
                            handleWatchEvent(watchEvent)
                        } catch (err) {
                            logger.error(err)
                        }
                        buffer = buffer.slice(index + 1)
                        index = buffer.indexOf('\n')
                    }

                    oldBuffer = buffer
                    buffer = Buffer.from(buffer)
                    oldBuffer.fill(0)
                }
            }).on('end', () => {
                if (process.env.LOG_WATCH === 'true') logger.info({ msg: 'watch stop', kind })
                // setTimeout(() => {
                //     watchResource(token, apiVersion, kind, options)
                // }, 1000)
            })
        } else {
            res.on('data', () => noop)
            res.on('end', () => noop)
        }
    }

    function onWatchError(err: Error) {
        if (stopping) return
        logger.error({
            msg: 'watching error',
            error: err.message,
            code: (err as unknown as { code: string })?.code,
            kind,
            apiVersion,
        })
        switch ((err as unknown as { code: string }).code) {
            case 'ENOTFOUND':
                setDead()
                break
        }
    }

    function onClose(statusCode?: number) {
        if (process.env.LOG_WATCH === 'true') logger.info({ msg: 'watch stop', kind })
        if (stopping) return
        switch (statusCode) {
            case HTTP_STATUS_OK:
                watchResource(token, apiVersion, kind, options)
                break
            case HTTP_STATUS_FORBIDDEN:
                logger.error({
                    msg: 'watch error',
                    error: STATUS_CODES[statusCode],
                    code: statusCode,
                    kind,
                    apiVersion,
                })
                break
            default:
                if (statusCode === HTTP_STATUS_NOT_FOUND) {
                    setTimeout(() => {
                        watchResource(token, apiVersion, kind, options)
                    }, 5 * 60 * 1000)
                } else {
                    logger.error({
                        msg: 'watch error',
                        error: STATUS_CODES[statusCode],
                        code: statusCode,
                        kind,
                        apiVersion,
                    })
                    setTimeout(() => {
                        watchResource(token, apiVersion, kind, options)
                    }, 1000)
                }
                break
        }
    }

    requestRetry({
        url,
        token,
        timeout: 4 * 60 * 1000 + Math.floor(Math.random() * 30 * 1000),
        onResponse: onWatchResponse,
        onError: onWatchError,
        onClose: onClose,
        signal: abortController.signal,
    })

    abortControllers[kind] = abortController
}

function handleWatchEvent(watchEvent: WatchEvent): string {
    let { object: resource } = watchEvent

    if (watchEvent.type === 'ERROR') {
        if ((watchEvent.object as { code?: number })?.code !== 410) {
            logger.warn({ msg: 'watch error event', event: watchEvent })
        }
        return
    }

    if (watchEvent.type === 'BOOKMARK') {
        return resource.metadata?.resourceVersion
    }

    if (process.env.LOG_WATCH === 'true') {
        logger.trace({
            msg: 'watch',
            type: watchEvent.type,
            kind: resource.kind,
            name: resource.metadata?.name,
            namespace: resource.metadata?.namespace,
        })
    }

    if (!resource.kind) return undefined
    if (!resource.metadata?.name) return undefined

    // Remove undesired fields
    delete resource.metadata.managedFields
    delete resource.metadata.selfLink

    // Limit resource to just what is needed for DELETED
    if (watchEvent.type === 'DELETED') {
        resource = {
            kind: resource.kind,
            apiVersion: resource.apiVersion,
            metadata: {
                name: resource.metadata.name,
                namespace: resource.metadata.namespace,
            },
        }
        watchEvent.object = resource
    }

    let kindCache = resourceCache[resource.kind]
    if (!kindCache) {
        kindCache = {}
        resourceCache[resource.kind] = kindCache
    }

    const namespace = resource.metadata.namespace?.toString()
    let namespaceCache = kindCache[namespace]
    if (!namespaceCache) {
        namespaceCache = {}
        kindCache[namespace] = namespaceCache
    }

    const name = resource.metadata.name
    const existing = namespaceCache[name]
    if (existing) {
        if (existing.resource.metadata.resourceVersion === resource.metadata.resourceVersion)
            return resource.metadata.resourceVersion
        ServerSideEvents.removeEvent(existing.eventID)
    }

    const eventID = ServerSideEvents.pushEvent({ data: watchEvent })
    namespaceCache[name] = { resource, eventID }

    return resource.metadata.resourceVersion
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

const accessCache: Record<string, Record<string, { time: number; promise: Promise<boolean> }>> = {}

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
    for (const kind in abortControllers) {
        abortControllers[kind].abort()
    }
}
