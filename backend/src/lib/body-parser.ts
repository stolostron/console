/* Copyright Contributors to the Open Cluster Management project */
import { IncomingMessage } from 'http'
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
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
