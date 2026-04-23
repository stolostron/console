/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'node:http2'
import { constants } from 'node:http2'
import type { RequestOptions } from 'node:https'
import { request } from 'node:https'
import { URL } from 'node:url'
import { getServiceAgent } from '../lib/agent'
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

const defaultServiceHost = 'cluster-manager-placement.open-cluster-management-hub.svc.cluster.local'
const defaultPlacementDebugUrl = `https://${defaultServiceHost}:9443/debug/placements/`

const MAX_BODY_SIZE = 1024 * 1024 // 1MB

function collectBody(req: Http2ServerRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_SIZE) {
        req.destroy()
        reject(new Error('Request body too large'))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export async function placementDebug(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return

  let body: Buffer
  try {
    body = await collectBody(req)
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(413, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'Request body too large' }))
    }
    return
  }

  const headers: OutgoingHttpHeaders = {
    authorization: `Bearer ${token}`,
  }
  for (const header of proxyHeaders) {
    if (req.headers[header]) headers[header] = req.headers[header]
  }
  headers['content-type'] = 'application/json'
  headers['content-length'] = body.length

  const url = new URL(process.env.PLACEMENT_DEBUG_URL || defaultPlacementDebugUrl)
  headers.host = url.hostname

  const options: RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers,
    agent: getServiceAgent(),
  }

  const upstream = request(options, (response) => {
    if (!response) return respondInternalServerError(req, res)
    res.writeHead(response.statusCode ?? 500, {
      'content-type': 'application/json',
    })
    response.pipe(res as unknown as NodeJS.WritableStream)
  })

  upstream.on('error', (err) => {
    logger.error({ msg: 'placement debug upstream error', error: err.message })
    if (!res.headersSent) respondInternalServerError(req, res)
  })

  upstream.write(body)
  upstream.end()
}
