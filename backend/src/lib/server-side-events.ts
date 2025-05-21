/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Transform } from 'stream'
import { clearInterval } from 'timers'
import { Zlib } from 'zlib'
import { getEncodeStream } from './compression'
import { parseCookies, setCookie } from './cookies'
import { logger } from './logger'
import { randomString } from './random-string'
import { getGiganticEvents } from './gigantic'

// TODO - RESET EVENT
// TODO BOOKMARK EVENT

// If a client hasn't finished receiving a broadcast in PURGE_CLIENT_TIMEOUT
// assume the browser has been refreshed or closed
const PURGE_CLIENT_TIMEOUT = 4 * 60 * 60 * 1000

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
export interface WatchEvent {
  type: 'ADDED' | 'DELETED' | 'MODIFIED' | 'EOP'
  object: {
    kind: string
    apiVersion: string
    metadata: {
      name: string
      namespace: string
      resourceVersion: string
    }
  }
}

export interface ServerSideEventClient {
  token: string
  events?: Record<string, boolean>
  namespaces?: Record<string, boolean>
  writableStream: NodeJS.WritableStream
  compressionStream: Transform & Zlib
  eventQueue: Promise<ServerSideEvent | undefined>[]
  processing?: NodeJS.Timeout
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
      await new Promise<void>((resolve) => this.clients[clientID]?.writableStream.end(resolve))
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
        this.eventFilter(client.token, event)
          .then((shouldSendEvent) => (shouldSendEvent ? event : undefined))
          .catch(() => undefined) as Promise<ServerSideEvent<unknown>>
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
    // we will deactivate this browser's updates
    // if it hasn't accepted new stream data for
    // PURGE_CLIENT_TIMEOUT
    client.processing = setTimeout(() => {
      delete this.clients[clientID]
    }, PURGE_CLIENT_TIMEOUT)
    while (client.eventQueue.length) {
      try {
        const event = await client.eventQueue.shift()
        if (event) {
          const eventString = this.createEventString(event)

          if (client?.compressionStream) {
            const writeResult = client.compressionStream.write(eventString, 'utf8')
            if (!writeResult) await new Promise<void>((resolve) => client.compressionStream.once('drain', resolve))
          } else if (client?.writableStream) {
            const writeResult = client.writableStream.write(eventString, 'utf8')
            if (!writeResult) await new Promise<void>((resolve) => client.writableStream.once('drain', resolve))
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
            if (process.env.LOG_EVENTS === 'true') {
              logger.debug({ msg: 'event', type: watchEvent.type, kind, name, namespace })
            }
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
    clearTimeout(client.processing)
    delete client.processing
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

  public static getClients() {
    return this.clients
  }

  public static getEvents() {
    return this.events
  }

  public static handleRequest(token: string, req: Http2ServerRequest, res: Http2ServerResponse): ServerSideEventClient {
    const [writableStream, compressionStream, encoding] = getEncodeStream(
      res as unknown as NodeJS.WritableStream,
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
            .reduce(
              (events, event) => {
                events[event] = true
                return events
              },
              {} as Record<string, boolean>
            )
        } else if (part.startsWith('namespaces=')) {
          namespaces = part
            .substr(11)
            .split(',')
            .reduce(
              (namespaces, namespace) => {
                namespaces[namespace] = true
                return namespaces
              },
              {} as Record<string, boolean>
            )
        }
      }
    }
    const eventClient: ServerSideEventClient = {
      token,
      events,
      namespaces,
      writableStream,
      compressionStream,
      eventQueue: [],
    }
    const clientID = randomString(8)
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
      if (this.clients[clientID]?.writableStream === writableStream) {
        delete this.clients[clientID]
      }

      logger.info({ msg: 'event stream close' })
    })

    // SORT EVENTS INTO SMALLER PACKETS
    // SO THAT BROWSER PAGE LOADS QUICKER
    // split events into packets
    let parts = Object.values(this.events)

    // mock a large environment
    if (process.env.MOCK_CLUSTERS) {
      const loaded = parts.pop()
      parts = [...parts, ...getGiganticEvents()]
      parts.push(loaded)
    }

    // remove START, SETTINGS and LOADED from events
    const start = parts.shift()
    const end = parts.pop()
    const inx = parts.findIndex(({ data }) => {
      return (data as { type?: 'SETTINGS' }).type === 'SETTINGS'
    })
    const settings = parts.splice(inx, 1)[0]

    // separate resource by kind
    // we want to send the resources that populate the main console pages first
    // then send the details 2nd
    const clusters: ServerSideEvent<unknown>[] = []
    const policies: ServerSideEvent<unknown>[] = []
    const agents: ServerSideEvent<unknown>[] = []
    const infos: ServerSideEvent<unknown>[] = []
    const addons: ServerSideEvent<unknown>[] = []
    const other: ServerSideEvent<unknown>[] = []
    const remainder: ServerSideEvent<unknown>[] = []
    parts.forEach((event) => {
      const data = event.data as WatchEvent
      // see frontend/src/components/LoadPluginData.tsx for what pages are fast loaded
      switch (data.object.kind) {
        case 'ManagedCluster':
        case 'HostedCluster':
        case 'ClusterDeployment':
        case 'ManagedClusterSet':
          clusters.push(event)
          break
        case 'Policy':
        case 'PolicySet':
          policies.push(event)
          break
        case 'AgentClusterInstall':
          agents.push(event)
          break
        case 'ManagedClusterInfo':
          infos.push(event)
          break
        case 'ManagedClusterAddOn':
          addons.push(event)
          break
        case 'Search':
        case 'Secret':
        case 'ClusterPermission':
          other.push(event)
          break
        default:
          remainder.push(event)
          break
      }
    })

    // sort events alphabetically so that browser list fills from top to bottom
    const compareFn =
      (propName: 'name' | 'namespace') => (a: ServerSideEvent<unknown>, b: ServerSideEvent<unknown>) => {
        const adata = a.data as WatchEvent
        const bdata = b.data as WatchEvent
        return adata.object.metadata[propName].localeCompare(bdata.object.metadata[propName])
      }
    clusters.sort(compareFn('name'))
    infos.sort(compareFn('namespace'))
    policies.sort(compareFn('name'))
    addons.sort(compareFn('namespace'))

    // send packets of resources
    // with resources that fill main console pages first
    let sentCount = 0
    const sending = [start, settings]
    do {
      sending.push(...clusters.splice(0, 200))
      sending.push(...agents.splice(0, 200))
      sending.push(...infos.splice(0, 200))
      sending.push(...policies.splice(0, 200))
      sending.push(...addons.splice(0, 400))
      sending.push(...other.splice(0, 100))

      // EOP tells browser (LoadData) to process and recoil resources that have been sent so far
      sending.push({ id: '999999', data: { type: 'EOP' } }) // END OF PACKET
    } while (clusters.length || policies.length || addons.length || infos.length || agents.length)

    // send the remaining resources
    do {
      sending.push(...remainder.splice(0, 1978))
    } while (remainder.length)
    sending.push(end)
    sending.forEach((event) => {
      this.sendEvent(clientID, event)
      sentCount++
    })

    logger.info({ msg: 'event stream start', events: sentCount })

    return eventClient
  }

  private static keepAlivePing(): void {
    for (const clientID in this.clients) {
      const client = this.clients[clientID]
      if (client?.compressionStream) {
        try {
          client.compressionStream.write(':\n\n')
          client.compressionStream.flush()
        } catch (err) {
          logger.error(err)
        }
      } else if (client?.writableStream) {
        try {
          client.writableStream.write(':\n\n')
        } catch (err) {
          logger.error(err)
        }
      }
    }
  }
  private static intervalTimer: NodeJS.Timer | undefined = setInterval(() => {
    ServerSideEvents.keepAlivePing()
  }, 10 * 1000)
}
