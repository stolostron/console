/* Copyright Contributors to the Open Cluster Management project */
import { Socket } from 'socket.io'
import { logger } from '../lib/logger'
import { noop } from '../lib/noop'
import { getTokenFromHeaders } from '../lib/token'
import { IResource } from './resource'
import { canAccessResource, resourceCache } from './watch'

export const clients: Record<string, Socket> = {}

export async function clientConnected(clientSocket: Socket) {
    clients[clientSocket.id] = clientSocket

    logger.debug({ msg: 'websocket connection', socketID: clientSocket.id })

    clientSocket.onAny((event: string, args: unknown[]) => {
        logger.debug({ msg: 'websocket recieved event', event, args, socketID: clientSocket.id })
    })

    clientSocket.onAnyOutgoing((event: string, resource: IResource) => {
        if (resource) {
            logger.debug({
                msg: 'websocket event',
                event,
                kind: resource.kind,
                name: resource.metadata.name,
                namespace: resource.metadata.namespace,
            })
        } else {
            logger.debug({ msg: 'websocket event', event })
        }
    })

    clientSocket.on('disconnect', () => {
        logger.debug({ msg: 'websocket disconnect', socketID: clientSocket.id })
        delete clients[clientSocket.id]
    })

    const token = getTokenFromHeaders(clientSocket.handshake.headers)
    const promises: Promise<unknown>[] = []
    for (const apiVersionKind in resourceCache) {
        const apiVersionKindMap = resourceCache[apiVersionKind]
        for (const uid in apiVersionKindMap) {
            const { resource } = apiVersionKindMap[uid]
            promises.push(
                canAccessResource(resource, token)
                    .then((canAccess) => {
                        if (canAccess) {
                            clientSocket.emit('MODIFIED', resource)
                        }
                    })
                    .catch(noop)
            )
        }
    }
    await Promise.all(promises)
    clientSocket.emit('LOADED')
}

export async function broadcast(event: string, resource: IResource) {
    for (const clientSocket of Object.values(clients)) {
        const token = getTokenFromHeaders(clientSocket.handshake.headers)
        if (event === 'DELETED') {
            clientSocket.emit(event, {
                kind: resource.kind,
                apiVersion: resource.apiVersion,
                metadata: { name: resource.metadata.name, namespace: resource.metadata.namespace },
            })
        } else if (await canAccessResource(resource, token)) {
            clientSocket.emit(event, resource)
        }
    }
}
