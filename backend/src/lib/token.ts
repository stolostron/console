/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { parseCookies } from '../lib/cookies'
import { fetchRetry } from '../lib/fetch-retry'
import { unauthorized } from './respond'
import { LocalStorage } from 'node-localstorage'
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

export async function isAuthenticated(token: string) {
  return fetchRetry(process.env.CLUSTER_API_URL + '/apis', {
    headers: { [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}` },
  })
}

export async function getAuthenticatedToken(req: Http2ServerRequest, res: Http2ServerResponse): Promise<string> {
  const token = getToken(req)
  if (token) {
    const authResponse = await isAuthenticated(token)
    /* istanbul ignore if */
    if (authResponse.status === constants.HTTP_STATUS_OK) {
      if (process.env.NODE_ENV === 'development') {
        const localStorage = new LocalStorage(LOCAL_STORAGE)
        localStorage.setItem(ADMIN_TOKEN, token)
      }
      return token
    } else {
      res.writeHead(authResponse.status).end()
      void authResponse.blob()
    }
  } else {
    unauthorized(req, res)
  }
  throw new Error('Unauthenticated request')
}
