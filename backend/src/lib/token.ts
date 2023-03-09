/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent } from 'https'
import { parseCookies } from '../lib/cookies'
import { fetchRetry } from '../lib/fetch-retry'
import { unauthorized } from './respond'

const { HTTP2_HEADER_AUTHORIZATION } = constants
const agent = new Agent({ rejectUnauthorized: false })

export function getToken(req: Http2ServerRequest): string | undefined {
  let token = parseCookies(req)['acm-access-token-cookie']
  if (!token) {
    const authorizationHeader = req.headers[HTTP2_HEADER_AUTHORIZATION]
    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
      token = authorizationHeader.slice(7)
    }
  }
  return token
}

export async function isAuthenticated(token: string) {
  return fetchRetry(process.env.CLUSTER_API_URL + '/apis', {
    headers: { [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}` },
    agent,
  })
}

export async function getAuthenticatedToken(req: Http2ServerRequest, res: Http2ServerResponse): Promise<string> {
  const token = getToken(req)
  if (token) {
    const authResponse = await isAuthenticated(token)
    if (authResponse.status === constants.HTTP_STATUS_OK) {
      return token
    } else {
      res.writeHead(authResponse.status).end()
      void authResponse.blob()
    }
  } else {
    unauthorized(req, res)
  }
  return undefined
}
