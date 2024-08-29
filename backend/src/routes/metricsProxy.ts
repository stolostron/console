/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { notFound, respondInternalServerError, unauthorized } from '../lib/respond'
import { getCACertificate } from '../lib/serviceAccountToken'
import { getToken } from '../lib/token'
import { IResource } from '../resources/resource'

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

interface Route extends IResource {
  spec: {
    host?: string
    path?: string
    to?: {
      kind?: 'Service'
      name?: string
      weight?: number
    }
    port?: {
      targetPort?: string
    }
    tls?: {
      termination?: 'edge' | 'passthrough' | 'reencrypt'
      insecureEdgeTerminationPolicy?: 'Allow' | 'Disable' | 'Redirect'
    }
    wildcardPolicy?: 'Subdomain' | 'None'
  }
}

export async function prometheusProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = getToken(req)
  if (!token) return unauthorized(req, res)

  const prometheusProxyRoute = await jsonRequest(
    process.env.CLUSTER_API_URL + '/apis/route.openshift.io/v1/namespaces/openshift-monitoring/routes/prometheus-k8s',
    token
  )
    .then((response: Route) => {
      const scheme = response?.spec?.tls?.termination ? 'https' : 'http'
      return response?.spec && response.spec?.host ? `${scheme}://${response.spec.host}` : ''
    })
    .catch((err: Error): undefined => {
      logger.error({ msg: 'Error getting Prometheus Route', error: err.message })
      return undefined
    })

  metricsProxy(req, res, token, prometheusProxyRoute)
}

export async function observabilityProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = getToken(req)
  if (!token) return unauthorized(req, res)

  const observabilityProxyRoute = await jsonRequest(
    process.env.CLUSTER_API_URL +
      `/apis/route.openshift.io/v1/namespaces/open-cluster-management-observability/routes/rbac-query-proxy`,
    token
  )
    .then((response: Route) => {
      const scheme = response?.spec?.tls?.termination ? 'https' : 'http'
      return response?.spec && response.spec?.host ? `${scheme}://${response.spec.host}` : ''
    })
    .catch((err: Error): undefined => {
      logger.error({ msg: 'Error getting Observability Route', error: err.message })
      return undefined
    })

  metricsProxy(req, res, token, observabilityProxyRoute)
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
    ca: getCACertificate(),
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
