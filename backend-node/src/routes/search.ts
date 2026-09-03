/* Copyright Contributors to the Open Cluster Management project */
import type { IncomingMessage } from 'node:http'
import type { Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'node:http2'
import { constants } from 'node:http2'
import https, { request } from 'node:https'
import { pipeline } from 'node:stream'
import type { TLSSocket } from 'node:tls'
import WebSocket, { type RawData, WebSocketServer } from 'ws'
import { logger } from '../lib/logger'
import { notFound } from '../lib/respond'
import { getServiceCACertificate } from '../lib/serviceAccountToken'
import { getAuthenticatedToken } from '../lib/token'
import { getSearchRequestOptions } from '../lib/search'

const proxyHeaders = [
  constants.HTTP2_HEADER_ACCEPT,
  constants.HTTP2_HEADER_ACCEPT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_ENCODING,
  constants.HTTP2_HEADER_CONTENT_LENGTH,
  constants.HTTP2_HEADER_CONTENT_TYPE,
]

/** Case-insensitive header lookup for HTTP/2 request pseudo-headers and normal headers. */
function getHeaderValue(headers: Http2ServerRequest['headers'], name: string): string | undefined {
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== lower) continue
    if (value === undefined) return undefined
    return Array.isArray(value) ? value[0] : String(value)
  }
  return undefined
}

/** Adds `Authorization` to a graphql-ws `connection_init` message (exported for tests). */
export function injectSearchWsConnectionInitAuthorization(connectionInitJson: string, bearerToken: string): string {
  const bearer = bearerToken.startsWith('Bearer ') ? bearerToken : `Bearer ${bearerToken}`
  try {
    const msg = JSON.parse(connectionInitJson) as { type?: string; payload?: Record<string, unknown> }
    if (msg.type !== 'connection_init') return connectionInitJson
    const prev =
      msg.payload !== null && typeof msg.payload === 'object' && !Array.isArray(msg.payload) ? msg.payload : {}
    return JSON.stringify({
      ...msg,
      payload: { ...prev, Authorization: bearer },
    })
  } catch {
    return connectionInitJson
  }
}

/** `Sec-WebSocket-Protocol` from the client, or default `graphql-transport-ws`. */
function subprotocolsForUpstream(req: Http2ServerRequest): string | string[] {
  const raw = getHeaderValue(req.headers, 'sec-websocket-protocol')
  if (!raw) return ['graphql-transport-ws']
  const list = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return list.length ? list : ['graphql-transport-ws']
}

/** Decodes a `ws` text frame payload to UTF-8 (handles Buffer / fragment arrays). */
function rawDataToUtf8(data: RawData): string {
  if (typeof data === 'string') return data
  if (Buffer.isBuffer(data)) return data.toString('utf8')
  if (Array.isArray(data)) return Buffer.concat(data).toString('utf8')
  return Buffer.from(data).toString('utf8')
}

/** Bidirectional relay; rewrites the first `connection_init` from the browser to include the bearer token. */
function relayClientToUpstream(clientWs: WebSocket, upstreamWs: WebSocket, rawToken: string): void {
  let connectionInitHandled = false

  clientWs.on('message', (data, isBinary) => {
    if (!connectionInitHandled && !isBinary) {
      const text = rawDataToUtf8(data)
      try {
        const parsed = JSON.parse(text) as { type?: string }
        if (parsed.type === 'connection_init') {
          connectionInitHandled = true
          upstreamWs.send(injectSearchWsConnectionInitAuthorization(text, rawToken))
          return
        }
      } catch {
        // fall through
      }
      connectionInitHandled = true
    } else if (!connectionInitHandled) {
      connectionInitHandled = true
    }
    upstreamWs.send(data, { binary: Boolean(isBinary) })
  })

  upstreamWs.on('message', (data, isBinary) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data, { binary: Boolean(isBinary) })
    }
  })

  const closeBoth = () => {
    try {
      clientWs.close()
    } catch {
      /* ignore */
    }
    try {
      upstreamWs.close()
    } catch {
      /* ignore */
    }
  }

  clientWs.on('close', closeBoth)
  upstreamWs.on('close', () => {
    try {
      clientWs.close()
    } catch {
      /* ignore */
    }
  })
  clientWs.on('error', (err) => {
    logger.error({ msg: 'search websocket relay: client error', err })
    closeBoth()
  })
  upstreamWs.on('error', (err) => {
    logger.error({ msg: 'search websocket relay: upstream error after open', err })
    closeBoth()
  })
}

/** Proxies search GraphQL POST to search-api (HTTPS). */
export async function search(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}` }
    for (const header of proxyHeaders) {
      if (req.headers[header]) headers[header] = req.headers[header]
    }
    const options = await getSearchRequestOptions(headers)
    pipeline(
      req,
      request(options, (response) => {
        if (!response) return notFound(req, res)
        res.writeHead(response.statusCode, response.headers)
        pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
      }),
      (err) => {
        if (err) {
          logger.error(err)
        }
      }
    )
  }
}

/**
 * WS relay: opens `wss` to search-api with the session bearer, completes the browser upgrade, injects
 * `Authorization` into graphql-ws `connection_init` (search-v2-api expects the token in that payload).
 */
export async function searchWebSocket(req: Http2ServerRequest, socket: TLSSocket, head: Buffer): Promise<void> {
  let clientUpgradeCompleted = false

  /** Sends an HTTP error on the TCP socket if the WS upgrade to the browser has not completed yet. */
  const failClientUpgrade = (statusCode: number, statusText: string) => {
    if (clientUpgradeCompleted) return
    try {
      socket.write(`HTTP/1.1 ${statusCode} ${statusText}\r\nConnection: close\r\n\r\n`)
    } catch {
      /* ignore */
    }
    socket.destroy()
  }

  try {
    const token = await getAuthenticatedToken(req, socket)
    const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}` }
    const options = await getSearchRequestOptions(headers)

    const upstreamHost = String(options.hostname)
    const upstreamPort = options.port ? Number(options.port) : 443
    const upstreamPath = String(options.path ?? '')
    const upstreamWsUrl =
      upstreamPort === 443
        ? `wss://${upstreamHost}${upstreamPath}`
        : `wss://${upstreamHost}:${upstreamPort}${upstreamPath}`
    const bearerHeader = `Bearer ${token}`
    const hostHeader = upstreamPort === 443 ? upstreamHost : `${upstreamHost}:${upstreamPort}`

    logger.info({
      msg: 'search websocket relay: opening upstream',
      clientUrl: req.url,
      upstreamWsUrl,
    })

    const httpsAgent = new https.Agent({
      ca: getServiceCACertificate(),
      keepAlive: true,
    })

    const upstreamWs = new WebSocket(upstreamWsUrl, subprotocolsForUpstream(req), {
      agent: httpsAgent,
      headers: {
        Authorization: bearerHeader,
        Host: hostHeader,
      },
    })

    let upstreamOpen = false

    const connectTimeout = setTimeout(() => {
      logger.error({ msg: 'search websocket relay: upstream connect timeout', upstreamWsUrl })
      upstreamWs.terminate()
      if (!upstreamOpen) {
        failClientUpgrade(504, 'Gateway Timeout')
      }
    }, 60_000)

    upstreamWs.on('error', (err) => {
      clearTimeout(connectTimeout)
      if (!upstreamOpen) {
        logger.error({ msg: 'search websocket relay: upstream connect failed', err, upstreamWsUrl })
        failClientUpgrade(502, 'Bad Gateway')
      }
    })

    upstreamWs.once('open', () => {
      upstreamOpen = true
      clearTimeout(connectTimeout)
      const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false })
      wss.handleUpgrade(req as unknown as IncomingMessage, socket, head, (clientWs) => {
        clientUpgradeCompleted = true
        relayClientToUpstream(clientWs, upstreamWs, token)
      })
    })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : 'search websocket relay: unknown error'
    logger.error({ msg: 'search websocket relay: handler error', error: message })
    if (!clientUpgradeCompleted) {
      failClientUpgrade(500, 'Internal Server Error')
    } else {
      try {
        socket.destroy()
      } catch {
        /* ignore */
      }
    }
  }
}
