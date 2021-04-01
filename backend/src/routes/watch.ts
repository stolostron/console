/* Copyright Contributors to the Open Cluster Management project */

import { readFileSync } from 'fs'
import { ClientRequest } from 'http'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent, request } from 'https'
import { parseCookies } from '../lib/cookies'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { unauthorized } from '../lib/respond'
import { ServerSideEvent, ServerSideEvents } from '../lib/server-side-events'
import { IResource } from '../resources/resource'

export function watch(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)
    ServerSideEvents.handleRequest(token, req, res)
}

interface WatchEvent {
    type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'BOOKMARK' | 'ERROR'
    object: IResource
}

type ServerSideEventData = WatchEvent | { type: 'START' | 'LOADED' }

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
    let token: string
    try {
        token = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token').toString()
    } catch (err) {
        if (process.env.NODE_ENV === 'production') {
            console.log('/var/run/secrets/kubernetes.io/serviceaccount/token not found')
            process.exit(1)
        } else {
            token = process.env.TOKEN
            if (!token) {
                logger.error('serviceaccount token not found')
                process.exit(1)
            }
        }
    }

    ServerSideEvents.eventFilter = eventFilter

    watchResource(token, 'v1', 'namespaces')
    watchResource(token, 'cluster.open-cluster-management.io/v1alpha1', 'managedClusterSets')
    watchResource(token, 'cluster.open-cluster-management.io/v1', 'managedClusters')
    watchResource(token, 'internal.open-cluster-management.io/v1beta1', 'managedClusterInfos')
    watchResource(token, 'inventory.open-cluster-management.io/v1alpha1', 'bareMetalAssets')
    watchResource(token, 'operator.open-cluster-management.io/v1', 'multiClusterHubs')
    watchResource(token, 'certificates.k8s.io/v1beta1', 'certificateSigningRequests', {
        labelSelector: {
            'open-cluster-management.io/cluster-name': '',
        },
    })
    watchResource(token, 'hive.openshift.io/v1', 'clusterDeployments')
    watchResource(token, 'hive.openshift.io/v1', 'clusterImageSets')
    watchResource(token, 'hive.openshift.io/v1', 'clusterProvisions')
    watchResource(token, 'addon.open-cluster-management.io/v1alpha1', 'clusterManagementAddons')
    watchResource(token, 'addon.open-cluster-management.io/v1alpha1', 'managedClusterAddons')
    watchResource(token, 'v1', 'secrets', {
        labelSelector: {
            'cluster.open-cluster-management.io/cloudconnection': '',
        },
    })
    watchResource(token, 'discovery.open-cluster-management.io/v1', 'discoveryConfigs')
    watchResource(token, 'config.openshift.io/v1', 'featureGates', {
        labelSelector: {
            'console.open-cluster-management.io': '',
        },
    })
    watchResource(token, 'v1', 'configmaps', {
        fieldSelector: {
            'metadata.namespace': 'openshift-config-managed',
            'metadata.name': 'console-public',
        },
    })
    watchResource(token, 'config.openshift.io/v1', 'featureGates')
}

const watchRequests: Record<string, ClientRequest> = {}

export function watchResource(
    token: string,
    apiVersion: string,
    kind: string,
    options?: {
        labelSelector?: Record<string, string>
        fieldSelector?: Record<string, string>
    },
    resourceVersion?: string
): void {
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

    // TODO - Handle resuming a watch
    // https://kubernetes.io/docs/reference/using-api/api-concepts/#efficient-detection-of-changes
    // required permissions to list resources

    // path += '&allowWatchBookmarks'

    // if (resourceVersion) {
    //     if (kind === 'managedClusterInfos') {
    //         path += `&resourceVersion=${resourceVersion}`
    //     }
    //     logger.debug(path)
    // }

    const url = `${process.env.CLUSTER_API_URL}${path}`

    let buffer: Buffer = Buffer.from('')
    const clientRequest = request(
        url,
        {
            headers: { authorization: `Bearer ${token}` },
            agent: new Agent({ rejectUnauthorized: false }),
        },
        (res) => {
            if (res.statusCode === 200) {
                logger.debug({ msg: 'watching start', kind, resourceVersion })

                /* Test code to simulate losing connection to kubernetes */
                // if (process.env.NODE_ENV === 'development') {
                //     if (kind === 'managedClusterInfos') {
                //         setTimeout(() => {
                //             logger.debug('res.destroy')
                //             res.destroy()
                //         }, 2000 + Math.floor(Math.random() * 10 * 1000))
                //     }
                // }

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
                                const eventResourceVersion = handleWatchEvent(watchEvent)
                                if (eventResourceVersion) resourceVersion = eventResourceVersion
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
                })
                    .on('error', (err: Error) => {
                        logger.error({ msg: 'watching error', kind, error: err.message })
                    })
                    .on('close', () => {
                        logger.debug({ msg: 'watching stop', kind })
                        if (stopping) return
                        watchResource(token, apiVersion, kind, options, resourceVersion)
                    })
            } else {
                logger.error({ msg: 'watch error', kind, statusCode: res.statusCode })
                setTimeout(() => watchResource(token, apiVersion, kind, options, resourceVersion), 30 * 1000)
            }
        }
    )
    watchRequests[kind] = clientRequest
    clientRequest.on('error', (err) => {
        logger.error({ msg: 'watch request error', error: err.message })
    })
    clientRequest.end()
}

function handleWatchEvent(watchEvent: WatchEvent): string {
    let { object: resource } = watchEvent

    if (watchEvent.type === 'ERROR') {
        logger.warn({ msg: 'watch error event', event: watchEvent })
        return
    }

    if (watchEvent.type === 'BOOKMARK') {
        return resource.metadata?.resourceVersion
    }

    logger.debug({
        msg: 'watch',
        type: watchEvent.type,
        kind: resource.kind,
        name: resource.metadata?.name,
        namespace: resource.metadata?.namespace,
        resourceVersion: resource.metadata?.resourceVersion,
    })

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
            return Promise.resolve(true)
        case 'DELETED':
            // TODO - Security issue: Only send delete events to clients who can access that item
            // - Problem is if the namespace goes away, access check will fail
            // - Need to track what is set to client and only send if they previously accessed this event
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
    return canAccess({ kind: resource.kind, apiVersion: resource.apiVersion }, 'list', token)
}

function canGetResource(resource: IResource, token: string): Promise<boolean> {
    return canAccess(resource, 'get', token)
}

function canAccess(resource: IResource, verb: 'get' | 'list', token: string): Promise<boolean> {
    // TODO make sure old cache items get cleaned up

    const key = `${resource.kind}:${resource.metadata?.namespace}:${resource.metadata?.name}`
    if (!accessCache[token]) accessCache[token] = {}
    const existing = accessCache[token][key]
    if (existing && existing.time > Date.now() - 60 * 1000) {
        return existing.promise
    }

    const promise = jsonPost(
        '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
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
    ).then((data: { status: { allowed: boolean } }) => {
        if (data.status.allowed) {
            logger.trace({
                msg: 'access',
                type: 'ALLOWED',
                verb,
                resource: resource.kind.toLowerCase() + 's',
                name: resource.metadata?.name,
                namespace: resource.metadata?.namespace,
            })
            return true
        } else return false
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
    for (const kind in watchRequests) {
        const clientRequest = watchRequests[kind]
        clientRequest.destroy()
    }
}
