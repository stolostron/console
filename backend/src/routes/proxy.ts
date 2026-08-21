/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'node:http2'
import { constants } from 'node:http2'
import type { RequestOptions } from 'node:https'
import { request } from 'node:https'
import { pipeline } from 'node:stream'
import type { TLSSocket } from 'node:tls'
import { URL } from 'node:url'
import { logger } from '../lib/logger'
import { notFound, unauthorized } from '../lib/respond'
import { getToken } from '../lib/token'
import { getDefaultAgent, getStreamingAgent } from '../lib/agent'

const proxyHeaders = [
  constants.HTTP2_HEADER_ACCEPT,
  constants.HTTP2_HEADER_ACCEPT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_TYPE,
]
const proxyResponseHeaders = [
  constants.HTTP2_HEADER_CACHE_CONTROL,
  constants.HTTP2_HEADER_CONTENT_TYPE,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_ETAG,
]

// Cache cluster URL to avoid parsing on every request
let clusterUrl: URL
function getClusterUrl(): URL {
  if (!clusterUrl) {
    clusterUrl = new URL(process.env.CLUSTER_API_URL)
  }
  return clusterUrl
}

export function proxy(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const token = getToken(req)
  if (!token) return unauthorized(req, res)

  const url = req.url

  const isWatchRequest = url?.includes('watch=true') || url?.includes('watch%3Dtrue')

  const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}` }
  for (const header of proxyHeaders) {
    if (req.headers[header]) headers[header] = req.headers[header]
  }

  if (isWatchRequest) {
    // Prevent every layer from timing out the long-lived streaming
    // connection (same pattern as ServerSideEvents).
    req.setTimeout(2147483647)
    res.setTimeout(2147483647)
    const session = req.stream?.session
    session?.setTimeout(2147483647)
    if (session?.socket && 'setTimeout' in session.socket) {
      ;(session.socket as TLSSocket).setTimeout(0)
    }

    // Disable upstream compression for watch requests. Gzip encoders buffer
    // small writes internally, so individually-streamed watch events never
    // flush and the client never sees them after the initial batch.
    headers[constants.HTTP2_HEADER_ACCEPT_ENCODING] = 'identity'
  }

  const cluster = getClusterUrl()
  const options: RequestOptions = {
    protocol: cluster.protocol,
    hostname: cluster.hostname,
    port: cluster.port,
    path: url,
    method: req.method,
    headers,
    agent: isWatchRequest ? getStreamingAgent() : getDefaultAgent(),
  }
  pipeline(
    req,
    request(options, (response) => {
      if (!response) return notFound(req, res)
      const responseHeaders: OutgoingHttpHeaders = {}
      for (const header of proxyResponseHeaders) {
        if (response.headers[header]) responseHeaders[header] = response.headers[header]
      }
      res.writeHead(response.statusCode ?? 500, responseHeaders)

      if (isWatchRequest) {
        // For watch streams, disable Nagle's algorithm on both sides and
        // forward chunks directly instead of using pipeline(). pipe/pipeline
        // pauses the readable when the HTTP/2 writable buffer fills, and with
        // Nagle enabled the DATA frames aren't flushed promptly, so the drain
        // event never fires and the stream stalls after a few events.
        response.socket?.setNoDelay(true)
        response.socket?.setTimeout(0)
        const session = req.stream?.session
        if (session?.socket && 'setNoDelay' in session.socket) {
          ;(session.socket as TLSSocket).setNoDelay(true)
        }
        const endResponse = () => {
          if (!res.writableEnded) res.end()
        }
        response.on('data', (chunk: Buffer) => {
          res.write(chunk)
        })
        response.on('end', endResponse)
        // When the upstream connection drops, the response is destroyed
        // which emits 'close' but NOT 'end'. Without this, the HTTP/2
        // stream stays open and the browser blocks forever.
        response.on('close', endResponse)
        response.on('error', (err) => {
          logger.error(err)
          endResponse()
        })
      } else {
        pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
      }
    }),
    (err) => {
      if (err) logger.error(err)
    }
  )
}
