/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Transform } from 'stream'
import { clearInterval } from 'timers'
import { Zlib } from 'zlib'
import { getEncodeStream } from './compression'
import { parseCookies, setCookie } from './cookies'
import { logger } from './logger'
import { randomString } from './random-string'

// TODO - RESET EVENT
// TODO BOOKMARK EVENT

const instanceID = randomString(8)

const {
    HTTP2_HEADER_CONTENT_TYPE,
    HTTP_STATUS_OK,
    HTTP2_HEADER_CACHE_CONTROL,
    HTTP2_HEADER_CONTENT_ENCODING,
    HTTP2_HEADER_ACCEPT_ENCODING,
} = constants

export interface ServerSideEvent<DataT = unknown> {
    id?: string
    name?: string
    namespace?: string
    data?: DataT
}

export interface ServerSideEventClient {
    events?: Record<string, boolean>
    namespaces?: Record<string, boolean>
    writableStream: NodeJS.WritableStream
    compressionStream: Transform & Zlib
    eventQueue: Promise<ServerSideEvent>[]
    processing?: boolean
}

export class ServerSideEvents {
    private static eventID = 2
    private static lastLoadedID = 2
    private static events: Record<number, ServerSideEvent> = {
        1: { id: '1', data: { type: 'START' } },
        2: { id: '2', data: { type: 'LOADED' } },
    }
    private static clients: Record<string, ServerSideEventClient> = {}

    public static eventFilter: (clientID: string, event: Readonly<ServerSideEvent>) => Promise<boolean>

    public static async dispose(): Promise<void> {
        if (ServerSideEvents.intervalTimer !== undefined) {
            clearInterval(ServerSideEvents.intervalTimer)
            ServerSideEvents.intervalTimer = undefined
        }

        for (const clientID in this.clients) {
            const compressionStream = this.clients[clientID].compressionStream
            if (compressionStream) compressionStream.end()
            await new Promise<void>((resolve) => this.clients[clientID].writableStream.end(resolve))
        }

        this.clients = {}

        return Promise.resolve()
    }

    public static pushEvent(event: ServerSideEvent): number {
        const eventID = ++this.eventID
        event.id = eventID.toString()
        this.events[eventID] = event
        this.broadcastEvent(event)

        this.removeEvent(this.lastLoadedID)
        this.lastLoadedID = ++this.eventID
        const loadedEvent = {
            id: this.lastLoadedID.toString(),
            data: { type: 'LOADED' },
        }
        this.events[this.lastLoadedID] = loadedEvent
        this.broadcastEvent(loadedEvent)

        return eventID
    }

    private static broadcastEvent(event: ServerSideEvent): void {
        for (const clientID in this.clients) {
            this.sendEvent(clientID, event)
        }
    }

    private static sendEvent(clientID: string, event: ServerSideEvent): void {
        const client = this.clients[clientID]
        if (!client) return
        if (client.events && !client.events[event.name]) return
        if (client.namespaces && !client.namespaces[event.namespace]) return
        if (this.eventFilter) {
            client.eventQueue.push(
                this.eventFilter(clientID, event)
                    .then((shouldSendEvent) => (shouldSendEvent ? event : undefined))
                    .catch((err) => undefined)
            )
        } else {
            client.eventQueue.push(Promise.resolve(event))
        }
        void this.processClient(clientID)
    }

    private static async processClient(clientID: string): Promise<void> {
        const client = this.clients[clientID]
        if (!client) return
        if (client.processing) return
        client.processing = true
        while (client.eventQueue.length) {
            try {
                const event = await client.eventQueue.shift()
                if (event) {
                    const eventString = this.createEventString(event)

                    if (client.compressionStream) {
                        const writeResult = client.compressionStream.write(eventString, 'utf8')
                        if (!writeResult)
                            await new Promise<void>((resolve) => client.compressionStream.once('drain', resolve))
                    } else {
                        const writeResult = client.writableStream.write(eventString, 'utf8')
                        if (!writeResult)
                            await new Promise<void>((resolve) => client.writableStream.once('drain', resolve))
                    }

                    const watchEvent = event.data as {
                        type: string
                        object: {
                            apiVersion: string
                            kind: string
                            metadata: { name: string; namespace: string }
                        }
                    }

                    if (watchEvent?.object) {
                        const { kind, metadata } = watchEvent.object
                        const name = metadata?.name
                        const namespace = metadata?.namespace
                        logger.trace({ msg: 'event', type: watchEvent.type, kind, name, namespace })
                    }
                }
            } catch (err) {
                logger.error(err)
            }
        }
        try {
            if (client.compressionStream) client.compressionStream.flush()
        } catch (err) {
            logger.error(err)
        }
        client.processing = false
    }

    private static createEventString(event: ServerSideEvent): string {
        let eventString = `id:${event.id}\n`
        if (event.name) eventString += `event:${event.name}\n`
        switch (typeof event.data) {
            case 'string':
            case 'number':
            case 'bigint':
                eventString += `data:${event.data}\n`
                break
            case 'boolean':
                eventString += `data:${event.data ? 'true' : 'false'}\n`
                break
            case 'object':
                try {
                    eventString += `data:${JSON.stringify(event.data)}\n`
                } catch (err) {
                    logger.error(err)
                    return ''
                }
                break
            default:
                return ''
        }
        eventString += '\n'
        return eventString
    }

    public static removeEvent(eventID: number): void {
        delete this.events[eventID]
    }

    public static handleRequest(
        clientID: string,
        req: Http2ServerRequest,
        res: Http2ServerResponse
    ): ServerSideEventClient {
        const [writableStream, compressionStream, encoding] = getEncodeStream(
            (res as unknown) as NodeJS.WritableStream,
            req.headers[HTTP2_HEADER_ACCEPT_ENCODING] as string,
            process.env.DISABLE_STREAM_COMPRESSION === 'true'
        )

        let events: Record<string, boolean>
        let namespaces: Record<string, boolean>
        const queryStringIndex = req.url.indexOf('?')
        if (queryStringIndex !== -1) {
            const queryString = req.url.substr(queryStringIndex + 1)
            const parts = queryString.split('&')
            for (const part of parts) {
                if (part.startsWith('events=')) {
                    events = part
                        .substr(7)
                        .split(',')
                        .reduce((events, event) => {
                            events[event] = true
                            return events
                        }, {} as Record<string, boolean>)
                } else if (part.startsWith('namespaces=')) {
                    namespaces = part
                        .substr(11)
                        .split(',')
                        .reduce((namespaces, namespace) => {
                            namespaces[namespace] = true
                            return namespaces
                        }, {} as Record<string, boolean>)
                }
            }
        }
        const eventClient: ServerSideEventClient = {
            events,
            namespaces,
            writableStream,
            compressionStream,
            eventQueue: [],
        }
        this.clients[clientID] = eventClient

        res.setTimeout(2147483647)
        req.setTimeout(2147483647)

        setCookie(res, 'watch', instanceID)

        res.writeHead(HTTP_STATUS_OK, {
            [HTTP2_HEADER_CONTENT_TYPE]: 'text/event-stream',
            [HTTP2_HEADER_CACHE_CONTROL]: 'no-store, no-transform',
            [HTTP2_HEADER_CONTENT_ENCODING]: encoding,
        })
        res.on('close', () => {
            if (this.clients[clientID].writableStream === writableStream) {
                delete this.clients[clientID]
            }
        })

        let lastEventID = 0
        if (req.headers['last-event-id']) {
            const last = Number(req.headers['last-event-id'])
            if (Number.isInteger(last)) {
                const cookies = parseCookies(req)
                if (cookies['watch'] === instanceID) {
                    lastEventID = last
                }
            }
        }

        let sentCount = 0
        for (const eventID in this.events) {
            if (Number(eventID) <= lastEventID) continue
            this.sendEvent(clientID, this.events[eventID])
            sentCount++
        }

        logger.info({
            msg: 'stream start',
            status: 200,
            method: req.method,
            path: req.url,
            events: sentCount,
        })

        return eventClient
    }

    private static keepAlivePing(): void {
        for (const clientID in this.clients) {
            const compressionStream = this.clients[clientID].compressionStream
            if (compressionStream) {
                try {
                    compressionStream.write(':\n\n')
                    compressionStream.flush()
                } catch (err) {
                    logger.error(err)
                }
            } else {
                const clientStream = this.clients[clientID].writableStream
                try {
                    clientStream.write(':\n\n')
                } catch (err) {
                    logger.error(err)
                }
            }
        }
    }
    private static intervalTimer: NodeJS.Timer | undefined = setInterval(() => {
        ServerSideEvents.keepAlivePing()
    }, 110 * 1000)
}
