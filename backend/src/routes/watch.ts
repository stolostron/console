/* Copyright Contributors to the Open Cluster Management project */
import { readFileSync } from 'fs'
import { ClientRequest } from 'http'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent, request } from 'https'
import { STATUS_CODES } from 'http'
import { parseCookies } from '../lib/cookies'
import { jsonPost } from '../lib/json-request'
import { logger } from '../lib/logger'
import { unauthorized } from '../lib/respond'
import { ServerSideEvents } from '../lib/server-side-events'

// https://kubernetes.io/docs/reference/using-api/api-concepts/#efficient-detection-of-changes

let watching = false
const resources: Record<string, Record<string, number>> = {}
const watchRequests: Record<string, ClientRequest> = {}

interface WatchEvent {
    type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'BOOKMARK' | 'START'
    object: {
        kind: string
        apiVersion: string
        metadata: {
            name: string
            namespace: string
            resourceVersion?: string
            managedFields?: unknown
            selfLink?: string
        }
        data?: unknown
    }
}

let serviceAccountToken: string
function readToken() {
    try {
        serviceAccountToken = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/token').toString()
        startWatching(serviceAccountToken)
    } catch (err) {
        if (process.env.NODE_ENV === 'production') {
            logger.error('/var/run/secrets/kubernetes.io/serviceaccount/token not found')
        } else {
            serviceAccountToken = process.env.TOKEN
            startWatching(serviceAccountToken)
            if (!serviceAccountToken) {
                logger.error('serviceaccount token not found')
            }
        }
    }
}
readToken()

export function watch(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)
    ServerSideEvents.handleRequest(token, req, res)
}

const accessCache: Record<string, Record<string, { time: number; promise: Promise<boolean> }>> = {}

function canAccess(
    resource: { apiVersion: string; kind: string; metadata?: { name?: string; namespace?: string } },
    verb: 'get' | 'list',
    token: string
): Promise<boolean> {
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
                    group: resource.apiVersion.includes('/') ? resource.apiVersion.split('/')[0] : undefined,
                    name: resource.metadata?.name,
                    namespace: resource.metadata?.namespace,
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

export function startWatching(token: string): void {
    if (watching) return
    watching = true

    ServerSideEvents.eventFilter = (token, event) => {
        const watchEvent = event.data as WatchEvent
        if (watchEvent.type === 'START') return Promise.resolve(event)
        if (watchEvent.type === 'BOOKMARK') return Promise.resolve(event)
        if (watchEvent.type === 'DELETED') return Promise.resolve(event)
        // TODO - track what is sent to s specific token and only send delete

        if (!watchEvent.object) {
            console.log(watchEvent)
            return Promise.reject()
        }

        return canAccess(
            { kind: watchEvent.object.kind, apiVersion: watchEvent.object.apiVersion },
            'list',
            token
        ).then((allowed) => {
            if (allowed) return event
            if (watchEvent.object.metadata.namespace) {
                return canAccess(
                    {
                        kind: watchEvent.object.kind,
                        apiVersion: watchEvent.object.apiVersion,
                        metadata: { namespace: watchEvent.object.metadata.namespace },
                    },
                    'list',
                    token
                ).then((allowed) => {
                    if (allowed) return event
                    return canAccess(watchEvent.object, 'get', token).then((allowed) => {
                        if (allowed) return event
                        return undefined
                    })
                })
            } else {
                return canAccess(watchEvent.object, 'get', token).then((allowed) => {
                    if (allowed) return event
                    return undefined
                })
            }
        })
    }

    watchResource(token, 'v1', 'namespaces')
    watchResource(token, 'cluster.open-cluster-management.io/v1', 'managedClusters')
    watchResource(token, 'internal.open-cluster-management.io/v1beta1', 'managedClusterInfos')
    watchResource(token, 'inventory.open-cluster-management.io/v1alpha1', 'bareMetalAssets')
    watchResource(token, 'certificates.k8s.io/v1beta1', 'certificateSigningRequests', {
        'open-cluster-management.io/cluster-name': '',
    })
    watchResource(token, 'hive.openshift.io/v1', 'clusterDeployments')
    watchResource(token, 'hive.openshift.io/v1', 'clusterImageSets')
    watchResource(token, 'addon.open-cluster-management.io/v1alpha1', 'clusterManagementAddons')
    watchResource(token, 'addon.open-cluster-management.io/v1alpha1', 'managedClusterAddons')
    watchResource(token, 'v1', 'secrets', { 'cluster.open-cluster-management.io/cloudconnection': '' })
    watchResource(token, 'discovery.open-cluster-management.io/v1', 'discoveryConfigs')
    watchResource(token, 'config.openshift.io/v1', 'featureGates', {
        'open-cluster-management': '',
    })
    watchResource(token, 'v1', 'configmaps', undefined, {
        'metadata.namespace': 'openshift-config-managed',
        'metadata.name': 'console-public',
    })
}

export function watchResource(
    token: string,
    apiVersion: string,
    kind: string,
    labelSelector?: Record<string, string>,
    fieldSelector?: Record<string, string>
): void {
    let path = apiVersion.includes('/') ? '/apis' : '/api'
    path += `/${apiVersion}/${kind.toLowerCase()}`
    path += `?watch`
    if (labelSelector) {
        path += Object.keys(labelSelector).map((key) =>
            labelSelector[key] ? `&labelSelector=${key}=${labelSelector[key]}` : `&labelSelector=${key}=`
        )
    }

    if (fieldSelector) {
        path += '&fieldSelector='
        path += Object.keys(fieldSelector).map((key) => `${key}=${fieldSelector[key]}`)
    }

    const resourceEvents: Record<string, number> = {}
    resources[kind] = resourceEvents

    const url = `${process.env.CLUSTER_API_URL}${path}`

    let data = ''
    const clientRequest = request(
        url,
        { headers: { authorization: `Bearer ${token}` }, agent: new Agent({ rejectUnauthorized: false }) },
        (res) => {
            if (res.statusCode === 200) {
                res.on('data', (chunk) => {
                    if (chunk instanceof Buffer) {
                        data += chunk.toString()
                        while (data.includes('\n')) {
                            // TODO - use buffers and zero fill secrets
                            const parts = data.split('\n')
                            data = parts.slice(1).join('\n')
                            try {
                                const eventData = JSON.parse(parts[0]) as WatchEvent
                                if (eventData.object) {
                                    delete eventData.object.metadata.managedFields
                                    delete eventData.object.metadata.selfLink
                                    if (eventData.object.kind === 'Secret') delete eventData.object.data
                                    if (eventData.type === 'DELETED') {
                                        eventData.object = {
                                            kind: eventData.object.kind,
                                            apiVersion: eventData.object.apiVersion,
                                            metadata: {
                                                name: eventData.object.metadata.name,
                                                namespace: eventData.object.metadata.namespace,
                                            },
                                        }
                                    }
                                    logger.trace({
                                        msg: 'watch',
                                        type: eventData.type,
                                        kind: eventData.object.kind,
                                        name: eventData.object.metadata.name,
                                        namespace: eventData.object.metadata.namespace,
                                    })
                                    const eventID = ServerSideEvents.pushEvent({ data: eventData })
                                    const resourceKey = `${eventData.object.metadata.name}:${eventData.object.metadata.namespace}`
                                    if (resourceEvents[resourceKey]) {
                                        ServerSideEvents.removeEvent(resourceEvents[resourceKey])
                                    }
                                    if (eventData.type !== 'DELETED') {
                                        resourceEvents[resourceKey] = eventID
                                    }
                                } else {
                                    console.log(eventData)
                                }
                            } catch (err) {
                                logger.error(err)
                            }
                        }
                    }
                })
                    .on('error', console.error)
                    .on('end', () => {
                        // TODO handle 410
                        // TODO request using last resourceVersion - ?resourceVersion=10245
                        // TODO handle BOOKMARKS for resourceVersion window - ?allowWatchBookmarks=true
                        // {
                        //     "type": "BOOKMARK",
                        //     "object": {"kind": "Pod", "apiVersion": "v1", "metadata": {"resourceVersion": "12746"} }
                        // }
                        if (stopping) return
                        watchResource(token, apiVersion, kind, labelSelector)
                    })
            } else {
                logger.error({
                    msg: 'watch error',
                    kind,
                    statusCode: res.statusCode,
                    message: STATUS_CODES[res.statusCode],
                })
            }
        }
    )
    watchRequests[kind] = clientRequest
    clientRequest.on('error', logger.error)
    clientRequest.end()
}

let stopping = false
export function stopWatching(): void {
    stopping = true
    for (const kind in watchRequests) {
        const clientRequest = watchRequests[kind]
        clientRequest.destroy()
    }
}
