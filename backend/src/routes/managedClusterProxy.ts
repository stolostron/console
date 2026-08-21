/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { getAuthenticatedToken, isHttp2ServerResponse } from '../lib/token'

import type { IncomingMessage } from 'node:http'
import type { TLSSocket } from 'node:tls'
import { constants } from 'node:http2'
import { getMultiClusterEngine } from '../lib/multi-cluster-engine'
import { getServiceCACertificate } from '../lib/serviceAccountToken'
import { logger } from '../lib/logger'
import proxy from 'http2-proxy'
import { respondInternalServerError } from '../lib/respond'

function isWatchRequest(url: string): boolean {
  return url.includes('watch=true') || url.includes('watch%3Dtrue')
}

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

    const isWatch = isWatchRequest(req.url)

    // Disable upstream compression for watch requests. Gzip encoders buffer
    // small writes internally, so individually-streamed watch events never
    // flush and the client never sees them after the initial batch.
    if (isWatch) {
      req.headers[constants.HTTP2_HEADER_ACCEPT_ENCODING] = 'identity'
    }

    const baseProxyOptions = {
      protocol: 'https' as const,
      hostname: proxyHost,
      port: proxyPort,
      // DO NOT use 'agent: getServiceAgent()' here; connection agent does not work with proxy
      ca: getServiceCACertificate(),
    }

    const proxyHandler = (err: Error) => {
      if (err) {
        logger.error(err)
        throw err
      }
    }

    if (isHttp2ServerResponse(resOrSocket)) {
      // For watch requests, prevent every layer from timing out the
      // long-lived streaming connection (same pattern as ServerSideEvents).
      if (isWatch) {
        req.setTimeout(2147483647)
        resOrSocket.setTimeout(2147483647)
        const session = req.stream?.session
        session?.setTimeout(2147483647)
        if (session?.socket && 'setTimeout' in session.socket) {
          ;(session.socket as TLSSocket).setTimeout(0)
        }
      }

      // For watch requests, use onRes to bypass pipe() and disable Nagle's
      // algorithm. The default pipe() pauses the upstream when the HTTP/2
      // writable buffer fills, and with Nagle enabled, DATA frames aren't
      // flushed promptly, so the drain event never fires and events stall.
      const webOptions = isWatch
        ? {
            ...baseProxyOptions,
            proxyTimeout: 0,
            // onRes types are incorrect in http2-proxy (proxyRes is IncomingMessage at runtime)
            onRes: ((_req: Http2ServerRequest, res: Http2ServerResponse, proxyRes: unknown) => {
              const upstream = proxyRes as IncomingMessage
              upstream.socket?.setNoDelay(true)
              upstream.socket?.setTimeout(0)
              const session = _req.stream?.session
              if (session?.socket && 'setNoDelay' in session.socket) {
                ;(session.socket as TLSSocket).setNoDelay(true)
              }
              res.writeHead(upstream.statusCode ?? 200, upstream.headers)
              upstream.on('data', (chunk: Buffer) => {
                res.write(chunk)
              })
              const endResponse = () => {
                if (!res.writableEnded) res.end()
              }
              upstream.on('end', endResponse)
              // When the upstream dies (e.g. proxy timeout), http2-proxy's
              // onComplete destroys proxyRes which emits 'close' but NOT 'end'.
              // Without this handler res stays open and the browser blocks forever.
              upstream.on('close', endResponse)
            }) as unknown as Parameters<typeof proxy.web>[2]['onRes'],
          }
        : baseProxyOptions
      await proxy.web(req, resOrSocket, webOptions, proxyHandler)
    } else {
      await proxy.ws(req, resOrSocket, head, baseProxyOptions, proxyHandler)
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
