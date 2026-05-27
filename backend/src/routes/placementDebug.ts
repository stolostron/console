/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'node:http2'
import { constants } from 'node:http2'
import type { RequestOptions } from 'node:https'
import { request } from 'node:https'
import { pipeline } from 'node:stream'
import { URL } from 'node:url'
import { getPlacementDebugAgent } from '../lib/agent'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'

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

const defaultServiceHost = 'cluster-manager-placement.open-cluster-management-hub.svc.cluster.local'
const defaultPlacementDebugUrl = `https://${defaultServiceHost}:9443/debug/placements/`

export async function placementDebug(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return

  const headers: OutgoingHttpHeaders = {
    authorization: `Bearer ${token}`,
  }
  for (const header of proxyHeaders) {
    if (req.headers[header]) headers[header] = req.headers[header]
  }

  const url = new URL(process.env.PLACEMENT_DEBUG_URL || defaultPlacementDebugUrl)
  headers.host = url.hostname

  const options: RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers,
    agent: getPlacementDebugAgent(),
  }

  pipeline(
    req,
    request(options, (response) => {
      if (!response) return respondInternalServerError(req, res)
      const responseHeaders: OutgoingHttpHeaders = {}
      for (const header of proxyResponseHeaders) {
        if (response.headers[header]) responseHeaders[header] = response.headers[header]
      }
      responseHeaders['content-type'] = 'application/json'
      res.writeHead(response.statusCode ?? 500, responseHeaders)
      pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
    }),
    (err) => {
      if (err) {
        logger.error({ msg: 'placement debug upstream error', error: err.message })
        if (!res.headersSent) respondInternalServerError(req, res)
      }
    }
  )
}
