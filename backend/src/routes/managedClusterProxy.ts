/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { logger } from '../lib/logger'
import { respondInternalServerError } from '../lib/respond'
import { getAuthenticatedToken, isHttp2ServerResponse } from '../lib/token'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import proxy from 'http2-proxy'
import { TLSSocket } from 'tls'
import { getServiceCACertificate } from '../lib/serviceAccountToken'

export async function managedClusterProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void>
export async function managedClusterProxy(req: Http2ServerRequest, socket: TLSSocket, head: Buffer): Promise<void>
export async function managedClusterProxy(
  req: Http2ServerRequest,
  resOrSocket: Http2ServerResponse | TLSSocket,
  head?: Buffer
): Promise<void> {
  const token = await getAuthenticatedToken(req, resOrSocket)
  if (!token) return

  // expected path is /managedclusterproxy/<managedClusterName>/<apiPath>
  const path = req.url
  const splitPath = path.split('/')
  const managedCluster = splitPath[2]
  const apiPath = splitPath.slice(3).join('/')

  try {
    const mce = await getMultiClusterEngine()
    const proxyService = `cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local`
    const proxyHost = process.env.CLUSTER_PROXY_ADDON_USER_HOST || proxyService
    const proxyPort = process.env.CLUSTER_PROXY_ADDON_USER_HOST ? 443 : 9092

    req.url = `/${managedCluster}/${apiPath}`

    req.headers[constants.HTTP2_HEADER_AUTHORIZATION] = `Bearer ${token}`
    req.headers[constants.HTTP2_HEADER_HOST] = proxyHost
    req.headers['origin'] = `https://${proxyHost}`

    const proxyOptions = {
      protocol: 'https',
      hostname: proxyHost,
      port: proxyPort,
      // DO NOT use 'agent: getServiceAgent()' here; connection agent does not work with proxy
      ca: getServiceCACertificate(),
    } as const

    const proxyHandler = (err: Error) => {
      if (err) {
        logger.error(err)
        throw err
      }
    }

    if (isHttp2ServerResponse(resOrSocket)) {
      await proxy.web(req, resOrSocket, proxyOptions, proxyHandler)
    } else {
      await proxy.ws(req, resOrSocket, head, proxyOptions, proxyHandler)
    }
  } catch (err) {
    logger.error(err)
    if (isHttp2ServerResponse(resOrSocket)) {
      respondInternalServerError(req, resOrSocket)
    } else {
      resOrSocket.destroy()
    }
  }
}
