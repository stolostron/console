/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { logger } from '../lib/logger'
import { respond, respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken, getManagedClusterToken } from '../lib/token'
import { canAccess } from './events'
import { fetchRetry } from '../lib/fetch-retry'
import { HeadersInit } from 'node-fetch'
import { Agent } from 'https'
import { getServiceCACertificate } from '../lib/serviceAccountToken'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'

const { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP2_HEADER_AUTHORIZATION, HTTP2_HEADER_CONTENT_TYPE } = constants

const proxyHeaders = [
  constants.HTTP2_HEADER_ACCEPT,
  constants.HTTP2_HEADER_ACCEPT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_TYPE,
]

export async function managedClusterProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (!token) return

  const serviceAccountToken = getServiceAccountToken()
  const chunks: string[] = []

  req.on('data', (chunk: string) => {
    chunks.push(chunk)
  })

  req.on('end', async () => {
    const path = req.url
    const managedCluster = req.url.split('/')[2]

    const hasAuth = await canAccess(
      {
        kind: 'ManagedClusterAction',
        apiVersion: 'action.open-cluster-management.io/v1beta1',
        metadata: { namespace: managedCluster },
      },
      'create',
      token
    )

    if (!hasAuth) {
      logger.error({ msg: 'Unauthorized request...' })
      return respond(res, 'Unauthorized request...', 401)
    }

    try {
      const managedClusterToken: string = await getManagedClusterToken(managedCluster, serviceAccountToken)
      // expected path is /managedclusterproxy/<managedClusterName>/<resourcePath>
      const splitURL = path.split('/')
      const resourcePath = splitURL.slice(3).join('/')
      const mce = await getMultiClusterEngine()
      const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
      const proxyURL = process.env.CLUSTER_PROXY_ADDON_USER_ROUTE || proxyService

      const resourceUri = `${proxyURL}/${managedCluster}/${resourcePath}`
      const responseHeaders: OutgoingHttpHeaders = { authorization: `Bearer ${managedClusterToken}` }
      for (const header of proxyHeaders) {
        if (req.headers[header]) responseHeaders[header] = req.headers[header]
      }

      const requestHeaders = { ...req.headers }
      requestHeaders[HTTP2_HEADER_CONTENT_TYPE] = 'application/json'
      if (managedClusterToken) requestHeaders[HTTP2_HEADER_AUTHORIZATION] = `Bearer ${managedClusterToken}`
      delete requestHeaders['host']
      const headers = { ...requestHeaders } as HeadersInit

      await fetchRetry(resourceUri, {
        method: 'GET',
        headers: headers,
        agent: new Agent({ ca: getServiceCACertificate() }),
      })
        .then((response) => response.json())
        .then((data: any) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        })
        .catch((err: Error): void => {
          logger.error({ msg: 'Error on managedcluster request', error: err.message })
          respondInternalServerError(req, res)
        })
        // await fetchRetry(resourceUri, {
        //   method: 'GET',
        //   headers: headers,
        //   agent: new Agent({ ca: getServiceCACertificate() }),
        // })
        //   .then((response) => response.blob())
        //   .then(async (blob: any) => {
        //     res.setHeader('Content-Type', 'application/octet-stream')
        //     res.end(Buffer.from(await blob.arrayBuffer()))
        //   })
        //   .catch((err: Error): void => {
        //     logger.error({ msg: 'Error on managedcluster request', error: err.message })
        //     respondInternalServerError(req, res)
        //   })
    } catch (err) {
      logger.error(err)
      respondInternalServerError(req, res)
    }
  })
}
