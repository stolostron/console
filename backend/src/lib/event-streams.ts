import { constants, Http2ServerResponse } from 'http2'
import { clearInterval } from 'timers'

const { HTTP2_HEADER_CONTENT_TYPE, HTTP_STATUS_OK, HTTP2_HEADER_CACHE_CONTROL } = constants
// const MAXINT = 2147483647

export class EventStreams {
    static responseKey = 1
    static eventID = 1

    private static eventStreams: { [namespace: string]: { [userID: string]: Http2ServerResponse } } | undefined = {}

    public static dispose(): Promise<void> {
        for (const namespace in this.eventStreams) {
            const namespaceStreams = this.eventStreams[namespace]
            for (const responseID in namespaceStreams) {
                const response: Http2ServerResponse = namespaceStreams[responseID]
                if (response !== undefined) {
                    response.stream.destroy()
                }
            }
        }
        this.eventStreams = undefined

        if (intervalTimer !== undefined) {
            clearInterval(intervalTimer)
            intervalTimer = undefined
        }

        return Promise.resolve()
    }

    public static broadCast(namespace: string, event: string, data: string): void {
        // logger.debug({ msg: 'broadcast', namespace: namespace, event: event, data: data })
        if (!this.eventStreams) return

        const namespaceStreams = this.eventStreams[namespace]
        if (namespaceStreams) {
            for (const responseID in namespaceStreams) {
                const response: Http2ServerResponse = namespaceStreams[responseID]
                try {
                    response.stream.write(`id:${this.eventID++}\nevent:${event}\ndata:${data}\n\n`, 'utf8')
                } catch (err) {
                    // console.error(err)
                }
            }
        }

        const globalStreams = this.eventStreams['*']
        if (globalStreams !== undefined) {
            for (const responseID in globalStreams) {
                if (namespaceStreams && namespaceStreams[responseID]) continue
                const response: Http2ServerResponse = globalStreams[responseID]
                try {
                    response.stream.write(`id:${this.eventID++}\nevent:${event}\ndata:${data}\n\n`, 'utf8')
                } catch (err) {
                    // console.error(err)
                }
            }
        }
    }

    public static addClientEventStream(namespace: string, res: Http2ServerResponse): void {
        if (this.eventStreams === undefined) return

        // TODO HANDLE HEADER - Last-Event-ID

        let namespaceStream = this.eventStreams[namespace]
        if (!namespaceStream) {
            namespaceStream = {}
            this.eventStreams[namespace] = namespaceStream
        }

        const responseID = this.responseKey++
        namespaceStream[responseID] = res

        // res.stream.setTimeout(MAXINT)
        res.writeHead(HTTP_STATUS_OK, {
            [HTTP2_HEADER_CONTENT_TYPE]: 'text/event-stream',
            [HTTP2_HEADER_CACHE_CONTROL]: 'no-store',
        })
        res.on('close', () => {
            delete namespaceStream[responseID]
        })
    }

    static keepAlivePing(): void {
        // TODO this makes duplicate pings is listinging to more than one event
        for (const namespace in this.eventStreams) {
            const namespaceStreams = this.eventStreams[namespace]
            for (const responseID in namespaceStreams) {
                const response = namespaceStreams[responseID]
                response.stream.write('\n\n')
            }
        }
    }
}

let intervalTimer: NodeJS.Timer | undefined = setInterval(() => {
    EventStreams.keepAlivePing()
}, 110 * 1000)

export interface Event {
    id?: number
    event?: string
    data?: Record<string, unknown>
}

export function parseEventString(eventString: string): Event {
    const event: Event = {}
    const parts = eventString.split('\n')
    for (const part of parts) {
        if (part.startsWith('id:')) event.id = Number(part.substr(3))
        else if (part.startsWith('event:')) event.event = part.substr(6)
        else if (part.startsWith('data:')) event.data = JSON.parse(part.substr(5)) as Record<string, unknown>
    }
    return event
}
