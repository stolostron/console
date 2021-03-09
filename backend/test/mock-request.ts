/* Copyright Contributors to the Open Cluster Management project */
import {
    constants,
    Http2ServerRequest,
    Http2ServerResponse,
    IncomingHttpHeaders,
    OutgoingHttpHeaders,
    ServerHttp2Stream,
    ServerStreamResponseOptions,
} from 'http2'
import { Duplex } from 'stream'
import { requestHandler, stop } from '../src/app'
import * as nock from 'nock'

export async function request(
    method: 'GET' | 'PUT' | 'POST' | 'DELETE',
    path: string,
    body?: Record<string, unknown>
): Promise<Http2ServerResponse> {
    const stream = createReadWriteStream()
    const headers: IncomingHttpHeaders = {
        [constants.HTTP2_HEADER_METHOD]: method,
        [constants.HTTP2_HEADER_PATH]: path,
    }
    if (body) {
        headers[constants.HTTP2_HEADER_CONTENT_TYPE] = 'application/json'
    }
    const req = new Http2ServerRequest(stream as ServerHttp2Stream, headers, {}, [])
    const res = mockResponse()
    const result = requestHandler(req, res)
    if (body) {
        stream.write(Buffer.from(JSON.stringify(body)))
        stream.end()
    }
    await result
    return res
}

export function mockResponse(): Http2ServerResponse {
    const stream = createReadWriteStream() as ServerHttp2Stream
    const res = new Http2ServerResponse(stream)
    stream.respond = (headers?: OutgoingHttpHeaders, _options?: ServerStreamResponseOptions) => {
        if (headers) {
            res.statusCode = Number(headers[constants.HTTP2_HEADER_STATUS])
        }
    }
    return res
}

beforeAll(nock.disableNetConnect)
afterAll(stop)

function createReadWriteStream() {
    const chunks: unknown[] = []
    let destroy = false
    let write = false
    const stream = new Duplex({
        autoDestroy: false,
        write: (chunk: unknown, _encoding: BufferEncoding, next: (error?: Error | null) => void) => {
            if (write) {
                write = false
                stream.push(chunk)
            } else {
                chunks.push(chunk)
            }
            next()
        },
        final: (done: (error?: Error | null) => void) => {
            if (write) {
                stream.push(null) // No more data
            } else {
                destroy = true
            }
            done()
        },
        read: (_size: number) => {
            if (chunks.length > 0) {
                stream.push(chunks.shift())
            } else if (destroy) {
                stream.push(null)
            } else {
                write = true
            }
        },
    })
    return stream
}

export async function waitUntil(callback: () => Promise<boolean> | boolean): Promise<void> {
    return new Promise<void>((resolve) => {
        function attempt() {
            const result = callback()
            if (result instanceof Promise) {
                result
                    .then((success) => {
                        if (success) resolve()
                        else setTimeout(attempt, 1)
                    })
                    .catch(() => {
                        setTimeout(attempt, 1)
                    })
            } else {
                if (result) resolve()
                setTimeout(attempt, 1)
            }
        }
        attempt()
    })
}
