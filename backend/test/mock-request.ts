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
import nock from 'nock'
import { Duplex } from 'stream'
import { requestHandler, stop } from '../src/app'

export async function request(
  method: 'GET' | 'PUT' | 'POST' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
  extraHeaders?: IncomingHttpHeaders
): Promise<Http2ServerResponse> {
  const stream = createReadWriteStream()
  const headers: IncomingHttpHeaders = {
    ...extraHeaders,
    [constants.HTTP2_HEADER_METHOD]: method,
    [constants.HTTP2_HEADER_PATH]: path,
    [constants.HTTP2_HEADER_AUTHORIZATION]: 'Bearer <token>',
  }
  if (body) {
    headers[constants.HTTP2_HEADER_CONTENT_TYPE] = 'application/json'
  }

  const result = new Promise<Http2ServerResponse>((resolve) => {
    const req = new Http2ServerRequest(stream as ServerHttp2Stream, headers, {}, [])
    const res = mockResponse(resolve)
    void requestHandler(req, res)
  })

  if (body) {
    stream.write(Buffer.from(JSON.stringify(body)))
  }
  stream.end()

  return result
}

export function mockResponse(resolve: (value: Http2ServerResponse) => void): Http2ServerResponse {
  const stream = createReadWriteStream() as ServerHttp2Stream
  const res = new Http2ServerResponse(stream)
  stream.respond = (headers?: OutgoingHttpHeaders, _options?: ServerStreamResponseOptions) => {
    if (headers) {
      res.statusCode = Number(headers[constants.HTTP2_HEADER_STATUS])
    }
    resolve(res)
  }
  setTimeout(() => resolve(res), 2000) // time out after 2 seconds
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
