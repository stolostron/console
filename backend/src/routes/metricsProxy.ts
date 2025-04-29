/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { getServiceAgent } from '../lib/agent'
import { logger } from '../lib/logger'
import { notFound, respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken } from '../lib/token'

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

export function prometheusProxy(req: Http2ServerRequest, res: Http2ServerResponse) {
  const token = getToken(req)
  if (!token) unauthorized(req, res)

  const prometheusProxyService = 'https://prometheus-k8s.openshift-monitoring.svc.cluster.local:9091'
  const promURL = process.env.PROMETHEUS_ROUTE || prometheusProxyService

  metricsProxy(req, res, token, promURL)
}

export function observabilityProxy(req: Http2ServerRequest, res: Http2ServerResponse) {
  const token = getToken(req)
  if (!token) unauthorized(req, res)

  const obsProxyService = 'https://rbac-query-proxy.open-cluster-management-observability.svc.cluster.local:8443'
  const obsURL = process.env.OBSERVABILITY_ROUTE || obsProxyService

  metricsProxy(req, res, token, obsURL)
}

function metricsProxy(req: Http2ServerRequest, res: Http2ServerResponse, token: string, route: string): void {
  const path = req.url.replace('/observability', '/api/v1').replace('/prometheus', '/api/v1')
  const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}` }
  for (const header of proxyHeaders) {
    if (req.headers[header]) headers[header] = req.headers[header]
  }

  if (!route) return respondInternalServerError(req, res)
  const rbacQueryProxyUrl = new URL(route)
  const options: RequestOptions = {
    protocol: rbacQueryProxyUrl.protocol,
    hostname: rbacQueryProxyUrl.hostname,
    port: rbacQueryProxyUrl.port,
    path,
    method: req.method,
    headers,
    agent: getServiceAgent(),
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
