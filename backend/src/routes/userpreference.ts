/* Copyright Contributors to the Open Cluster Management project */

import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { logger } from '../lib/logger'
import { notFound } from '../lib/respond'
import { getServiceAccountToken } from './serviceAccountToken'

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

export function userpreference(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const serviceAccountToken = getServiceAccountToken()
  let path = '/apis/console.open-cluster-management.io/v1/userpreferences'
  const headers: OutgoingHttpHeaders = { authorization: `Bearer ${serviceAccountToken}` }
  for (const header of proxyHeaders) {
    if (req.headers[header]) headers[header] = req.headers[header]
  }

  if (req.method === 'PATCH' || req.method === 'GET') {
    path = path + '/' + req.url.split('/')[2]
  }

  const clusterUrl = new URL(process.env.CLUSTER_API_URL)
  const options: RequestOptions = {
    protocol: clusterUrl.protocol,
    hostname: clusterUrl.hostname,
    port: clusterUrl.port,
    path,
    method: req.method,
    headers,
    rejectUnauthorized: false,
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
      pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
    }),
    (err) => {
      if (err) logger.error(err)
    }
  )
}
