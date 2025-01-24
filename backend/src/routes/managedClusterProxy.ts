/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { logger } from '../lib/logger'
import { respond, respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken, getManagedClusterToken, isHttp2ServerResponse } from '../lib/token'
import { canAccess } from './events'
import { getServiceCACertificate } from '../lib/serviceAccountToken'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import proxy from 'http2-proxy'
import { TLSSocket } from 'tls'

const REMOVE_HEADERS = [constants.HTTP2_HEADER_HOST, 'origin']

export async function managedClusterProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void>
export async function managedClusterProxy(req: Http2ServerRequest, socket: TLSSocket, head: Buffer): Promise<void>
export async function managedClusterProxy(
  req: Http2ServerRequest,
  resOrSocket: Http2ServerResponse | TLSSocket,
  head?: Buffer
): Promise<void> {
  const token = await getAuthenticatedToken(req, resOrSocket)
  if (!token) return

  const serviceAccountToken = getServiceAccountToken()

  // expected path is /managedclusterproxy/<managedClusterName>/<apiPath>
  const path = req.url
  const splitPath = path.split('/')
  const managedCluster = splitPath[2]
  const apiPath = splitPath.slice(3).join('/')

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
    if (isHttp2ServerResponse(resOrSocket)) {
      return respond(resOrSocket, 'Unauthorized request...', 401)
    } else {
      resOrSocket.destroy()
    }
  }

  try {
    const managedClusterToken: string = await getManagedClusterToken(managedCluster, serviceAccountToken)
    const mce = await getMultiClusterEngine()
    const proxyService = `cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local`
    const proxyHost = process.env.CLUSTER_PROXY_ADDON_USER_HOST || proxyService
    const proxyPort = process.env.CLUSTER_PROXY_ADDON_USER_HOST ? 443 : 9092

    req.url = `/${managedCluster}/${apiPath}`

    for (const header of REMOVE_HEADERS) {
      if (req.headers[header]) {
        delete req.headers[header]
      }
    }
    req.headers[constants.HTTP2_HEADER_AUTHORIZATION] = `Bearer ${managedClusterToken}`

    logger.info(`HOSTNAME: ${proxyHost} PORT: ${proxyPort}`)

    const proxyOptions = {
      protocol: 'https',
      hostname: proxyHost,
      port: proxyPort,
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

export async function managedClusterProxyWS(req: Http2ServerRequest, socket: TLSSocket, head: Buffer): Promise<void> {
  const token = await getAuthenticatedToken(req, socket)
  if (!token) return

  const serviceAccountToken = getServiceAccountToken()

  // expected path is /managedclusterproxy/<managedClusterName>/<apiPath>
  const path = req.url
  const splitPath = path.split('/')
  const managedCluster = splitPath[2]
  const apiPath = splitPath.slice(3).join('/')

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
    socket.destroy()
  }

  try {
    const managedClusterToken: string = await getManagedClusterToken(managedCluster, serviceAccountToken)
    const mce = await getMultiClusterEngine()
    const proxyService = `cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local`
    const proxyHost = process.env.CLUSTER_PROXY_ADDON_USER_HOST || proxyService
    const proxyPort = process.env.CLUSTER_PROXY_ADDON_USER_HOST ? 443 : 9092

    req.url = `/${managedCluster}/${apiPath}`

    for (const header of REMOVE_HEADERS) {
      if (req.headers[header]) {
        const value = Array.isArray(req.headers[header]) ? req.headers[header].join(', ') : req.headers[header]
        delete req.headers[header]
      }
    }
    req.headers[constants.HTTP2_HEADER_AUTHORIZATION] = `Bearer ${managedClusterToken}`

    logger.info(`HOSTNAME: ${proxyHost} PORT: ${proxyPort}`)

    await proxy.ws(
      req,
      socket,
      head,
      {
        protocol: 'https',
        hostname: proxyHost,
        port: proxyPort,
        ca: getServiceCACertificate(),
      },
      (err) => {
        if (err) {
          logger.error(err)
          throw err
        }
      }
    )
  } catch (err) {
    logger.error(err)
    socket.destroy()
  }
}
