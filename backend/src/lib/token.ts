/* Copyright Contributors to the Open Cluster Management project */
import type { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { constants } from 'node:http2'
import { parseCookies } from '../lib/cookies'
import { fetchRetry } from '../lib/fetch-retry'
import { unauthorized } from './respond'
import { LocalStorage } from 'node-localstorage'
import type { TLSSocket } from 'node:tls'

const { HTTP2_HEADER_AUTHORIZATION } = constants

const LOCAL_STORAGE = './certs'
const ADMIN_TOKEN = 'admin-token'

export function getToken(req: Http2ServerRequest): string | undefined {
  let token = parseCookies(req)['acm-access-token-cookie']
  if (!token) {
    const authorizationHeader = req.headers[HTTP2_HEADER_AUTHORIZATION]
    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
      token = authorizationHeader.slice(7)
    }
  }
  /* istanbul ignore if */
  if (!token && process.env.NODE_ENV === 'development') {
    const localStorage = new LocalStorage(LOCAL_STORAGE)
    token = localStorage.getItem(ADMIN_TOKEN)
  }
  return token
}

// HEAD /api returns headers only — no response body — so no drain is needed and
// the payload is ~200 bytes regardless of how many CRDs are registered.
// Returns the HTTP status so callers can distinguish 401 (invalid token) from
// 403 (valid token, insufficient permission) and 5xx (transient upstream error).
export async function isAuthenticated(token: string): Promise<number> {
  const response = await fetchRetry(process.env.CLUSTER_API_URL + '/api', {
    method: 'HEAD',
    headers: { [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}` },
  })
  return response.status
}

export const isHttp2ServerResponse = (
  resOrSocket: Http2ServerResponse | TLSSocket
): resOrSocket is Http2ServerResponse => 'socket' in resOrSocket

export async function getAuthenticatedToken(req: Http2ServerRequest, res: Http2ServerResponse): Promise<string>
export async function getAuthenticatedToken(req: Http2ServerRequest, socket: TLSSocket): Promise<string>
export async function getAuthenticatedToken(
  req: Http2ServerRequest,
  resOrSocket: Http2ServerResponse | TLSSocket
): Promise<string>
export async function getAuthenticatedToken(
  req: Http2ServerRequest,
  resOrSocket: Http2ServerResponse | TLSSocket
): Promise<string> {
  const token = getToken(req)

  if (token) {
    const status = await isAuthenticated(token)
    /* istanbul ignore if */
    if (status === constants.HTTP_STATUS_OK) {
      if (process.env.NODE_ENV === 'development') {
        const localStorage = new LocalStorage(LOCAL_STORAGE)
        localStorage.setItem(ADMIN_TOKEN, token)
      }
      return token
    }
    if (isHttp2ServerResponse(resOrSocket)) {
      resOrSocket.writeHead(status).end()
    } else {
      resOrSocket.destroy()
    }
  } else if (isHttp2ServerResponse(resOrSocket)) {
    unauthorized(req, resOrSocket)
  } else {
    resOrSocket.destroy()
  }
  throw new Error('Unauthenticated request')
}
