/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { logger } from '../lib/logger'
import { respond, respondInternalServerError } from '../lib/respond'
import { getServiceAccountToken } from '../lib/serviceAccountToken'
import { getAuthenticatedToken, getAuthenticatedTokenWS, getManagedClusterToken } from '../lib/token'
import { canAccess } from './events'
import { fetchRetry } from '../lib/fetch-retry'
import { HeadersInit } from 'node-fetch'
import { Agent } from 'https'
import { getServiceCACertificate } from '../lib/serviceAccountToken'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import proxy from 'http2-proxy'
import { getServiceAgent } from '../lib/agent'
import { TLSSocket } from 'tls'

const { HTTP2_HEADER_AUTHORIZATION, HTTP2_HEADER_CONTENT_TYPE } = constants

const proxyHeaders = [
  constants.HTTP2_HEADER_ACCEPT,
  constants.HTTP2_HEADER_ACCEPT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_TYPE,
]

export async function managedclusterProxy(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
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
    return respond(res, 'Unauthorized request...', 401)
  }

  try {
    const managedClusterToken: string = await getManagedClusterToken(managedCluster, serviceAccountToken)
    const mce = await getMultiClusterEngine()
    const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
    const proxyHost = process.env.CLUSTER_PROXY_ADDON_USER_HOST || proxyService
    const proxyPort = process.env.CLUSTER_PROXY_ADDON_USER_HOST ? 443 : 9902

    req.url = `/${managedCluster}/${apiPath}`
    req.headers['authorization'] = `Bearer ${managedClusterToken}`
    delete req.headers['host']

    await proxy.web(req, res, {
      protocol: 'https',
      hostname: proxyHost,
      port: proxyPort,
      ca: getServiceCACertificate(),
    })
  } catch (err) {
    logger.error(err)
    respondInternalServerError(req, res)
  }
}

export async function managedClusterProxyWS(req: Http2ServerRequest, socket: TLSSocket, head: Buffer): Promise<void> {
  const token = await getAuthenticatedTokenWS(req, socket)
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
    const proxyService = `https://cluster-proxy-addon-user.${mce?.spec?.targetNamespace || 'multicluster-engine'}.svc.cluster.local:9092`
    const proxyHost = process.env.CLUSTER_PROXY_ADDON_USER_HOST || proxyService
    const proxyPort = process.env.CLUSTER_PROXY_ADDON_USER_HOST ? 443 : 9902

    req.url = `/${managedCluster}/${apiPath}`
    req.headers['authorization'] = `Bearer ${managedClusterToken}`
    delete req.headers['host']
    delete req.headers['origin']

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
      (err, req, socket, head) => {
        if (err) {
          socket.destroy()
        }
      }
    )
  } catch (err) {
    logger.error(err)
    socket.destroy()
  }
}
