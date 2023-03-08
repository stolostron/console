/* Copyright Contributors to the Open Cluster Management project */
import { readFileSync } from 'fs'
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { logger } from '../lib/logger'
import { notFound } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { getMultiClusterHub } from '../lib/multi-cluster-hub'

const proxyHeaders = [
  constants.HTTP2_HEADER_ACCEPT,
  constants.HTTP2_HEADER_ACCEPT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_TYPE,
]

let namespace: string
function getNamespace(): string {
  if (namespace === undefined) {
    try {
      namespace = readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace', 'utf-8')
    } catch (err: unknown) {
      if (!process.env.SEARCH_API_URL) {
        if (err instanceof Error) {
          logger.error('Error reading service account namespace', err && err.message)
        } else {
          logger.error({ msg: 'Error reading service account namespace', err: err })
        }
      }
    }
  }
  return namespace
}

export async function search(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}` }
    for (const header of proxyHeaders) {
      if (req.headers[header]) headers[header] = req.headers[header]
    }

    const mch = await getMultiClusterHub()
    const namespace = getNamespace()
    const searchService =
      mch && namespace && namespace !== mch.metadata.namespace
        ? `https://search-search-api.${mch.metadata.namespace}.svc.cluster.local:4010`
        : undefined

    const searchUrl = process.env.SEARCH_API_URL || searchService || 'https://search-search-api:4010'

    const url = new URL(searchUrl + '/searchapi/graphql')
    headers.authorization = `Bearer ${token}`
    headers.host = url.hostname
    const options: RequestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: req.method,
      headers,
      rejectUnauthorized: false,
    }

    pipeline(
      req,
      request(options, (response) => {
        if (!response) return notFound(req, res)
        res.writeHead(response.statusCode, response.headers)
        pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
      }),
      () => logger.error
    )
  }
}
