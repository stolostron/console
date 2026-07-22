/* Copyright Contributors to the Open Cluster Management project */
import type { IncomingMessage } from 'node:http'
import type { Readable } from 'node:stream'
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { constants } from 'node:http2'
import rawBody from 'raw-body'
import { getDecodeStream } from './compression'

export const APPLICATION_JSON = 'application/json'

export async function parseJsonBody<T = unknown>(req: Http2ServerRequest | IncomingMessage): Promise<T> {
  const contentType = req.headers[constants.HTTP2_HEADER_CONTENT_TYPE]
  if (typeof contentType === 'string') {
    if (contentType.includes(':')) {
      const found = contentType.split(':').find((part) => part === APPLICATION_JSON)
      if (!found) throw new Error('Content type header not set to application/json')
    } else {
      if (contentType !== APPLICATION_JSON) throw new Error('Content type header not set to application/json')
    }
  } else {
    throw new Error('Content type header not set')
  }

  const bodyString = await rawBody(getDecodeStream(req, req.headers[constants.HTTP2_HEADER_CONTENT_ENCODING]), {
    length: req.headers['content-length'],
    limit: 1 * 1024 * 1024,
    encoding: true,
  })

  return JSON.parse(bodyString) as T
}

export async function parseBody(req: Http2ServerRequest | IncomingMessage): Promise<Buffer> {
  const contentType = req.headers[constants.HTTP2_HEADER_CONTENT_TYPE]
  if (typeof contentType === 'string') {
    if (contentType.includes(':')) {
      const found = contentType.split(':').find((part) => part === APPLICATION_JSON)
      if (!found) throw new Error('Content type header not set to application/json')
    } else {
      if (contentType !== APPLICATION_JSON) throw new Error('Content type header not set to application/json')
    }
  } else {
    throw new Error('Content type header not set')
  }

  const buffer = await rawBody(getDecodeStream(req, req.headers[constants.HTTP2_HEADER_CONTENT_ENCODING]), {
    length: req.headers['content-length'],
    limit: 1 * 1024 * 1024,
  })

  return buffer
}

export async function parseResponseJsonBody<T = Promise<Record<string, unknown>>>(r: Http2ServerResponse): Promise<T> {
  const contentType = r.getHeader(constants.HTTP2_HEADER_CONTENT_TYPE)
  if (typeof contentType === 'string') {
    if (contentType.includes(':')) {
      const found = contentType.split(':').find((part) => part === APPLICATION_JSON)
      if (!found) throw new Error('Content type header not set to application/json')
    } else {
      if (contentType !== APPLICATION_JSON) throw new Error('Content type header not set to application/json')
    }
  } else {
    throw new Error('Content type header not set')
  }

  const bodyString = await rawBody(getDecodeStream(r.stream, r.getHeader(constants.HTTP2_HEADER_CONTENT_ENCODING)), {
    length: r.getHeader('content-length'),
    limit: 1 * 1024 * 1024,
    encoding: true,
  })
  return JSON.parse(bodyString) as T
}

export async function parsePipedJsonBody<T = Promise<Record<string, unknown>>>(r: Http2ServerResponse): Promise<T> {
  const bodyString = await rawBody(getDecodeStream(r.stream, r.getHeader(constants.HTTP2_HEADER_CONTENT_ENCODING)), {
    length: r.getHeader('content-length'),
    limit: 1 * 1024 * 1024,
    encoding: true,
  })
  return JSON.parse(bodyString || '{}') as T
}

/** Maximum request body size accepted by readRequestBody (1 MiB, matching raw-body callers). */
const REQUEST_BODY_LIMIT = 1 * 1024 * 1024

/** Error thrown when the incoming body exceeds REQUEST_BODY_LIMIT. */
export class RequestBodyTooLargeError extends Error {
  constructor() {
    super(`Request body exceeds the ${REQUEST_BODY_LIMIT}-byte limit`)
    this.name = 'RequestBodyTooLargeError'
  }
}

/**
 * Read the full request body as a UTF-8 string.
 *
 * Calls `setEncoding('utf8')` on the request stream so that Node's internal
 * StringDecoder handles multi-byte character boundaries across chunks safely.
 * Rejects with {@link RequestBodyTooLargeError} if the accumulated body
 * exceeds 1 MiB.
 */
export function readRequestBody(req: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    req.setEncoding('utf8')
    const chunks: string[] = []
    let byteLength = 0
    req.on('data', (chunk: string) => {
      byteLength += Buffer.byteLength(chunk, 'utf8')
      if (byteLength > REQUEST_BODY_LIMIT) {
        req.destroy()
        reject(new RequestBodyTooLargeError())
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      resolve(chunks.join(''))
    })
    req.on('error', reject)
  })
}

/**
 * Read the full request body and parse it as JSON.
 *
 * Uses `readRequestBody` for safe UTF-8 decoding, then `JSON.parse`.
 */
export async function parseRequestJsonBody<T>(req: Readable): Promise<T> {
  const body = await readRequestBody(req)
  return JSON.parse(body) as T
}
