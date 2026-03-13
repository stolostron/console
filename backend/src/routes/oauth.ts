/* Copyright Contributors to the Open Cluster Management project */
import { createHash } from 'crypto'
import got from 'got'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { encode as stringifyQuery, parse as parseQueryString } from 'querystring'
import { deleteCookie } from '../lib/cookies'
import { fetchRetry } from '../lib/fetch-retry'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { redirect, respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken } from '../lib/token'
import { setDead } from './liveness'
import { getCACertificate } from '../lib/serviceAccountToken'

type OAuthInfo = { authorization_endpoint: string; token_endpoint: string }
let oauthInfoPromise: Promise<OAuthInfo>

export function getOauthInfoPromise() {
  if (oauthInfoPromise === undefined) {
    const baseUrl = process.env.OIDC_ISSUER_URL ?? process.env.CLUSTER_API_URL
    oauthInfoPromise = jsonRequest<OAuthInfo>(`${baseUrl}/.well-known/oauth-authorization-server`).catch(
      (err: Error) => {
        logger.error({ msg: 'oauth-authorization-server error', error: err.message })
        setDead()
        return {
          authorization_endpoint: '',
          token_endpoint: '',
        }
      }
    )
  }
  return oauthInfoPromise
}

export async function login(_req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const oauthInfo = await getOauthInfoPromise()

  const queryString = stringifyQuery({
    response_type: `code`,
    client_id: process.env.OAUTH2_CLIENT_ID,
    redirect_uri: process.env.OAUTH2_REDIRECT_URL,
    scope: process.env.OIDC_ISSUER_URL ? 'openid' : 'user:full',
    state: '',
  })
  return redirect(res, `${oauthInfo.authorization_endpoint}?${queryString}`)
}

export async function loginCallback(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const url = req.url
  if (url.includes('?')) {
    const oauthInfo = await getOauthInfoPromise()
    const queryString = url.substring(url.indexOf('?') + 1)
    const query = parseQueryString(queryString)
    const code = query.code as string
    const requestQuery: Record<string, string> = {
      grant_type: `authorization_code`,
      code: code,
      redirect_uri: process.env.OAUTH2_REDIRECT_URL,
      client_id: process.env.OAUTH2_CLIENT_ID,
      client_secret: process.env.OAUTH2_CLIENT_SECRET,
    }
    const response = await fetchRetry(oauthInfo.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: stringifyQuery(requestQuery),
    })
    const body = (await response.json()) as { access_token?: string; id_token?: string }
    const token = process.env.OIDC_ISSUER_URL ? body.id_token : body.access_token
    if (token) {
      const headers = {
        'Set-Cookie': `acm-access-token-cookie=${token}; ${
          process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
        } HttpOnly; Path=/`,
        location: process.env.FRONTEND_URL,
      }
      res.writeHead(302, headers).end()
      return
    } else {
      return respondInternalServerError(req, res)
    }
  } else {
    return respondInternalServerError(req, res)
  }
}

export function logout(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const token = getToken(req)
  if (!token) return unauthorized(req, res)

  const gotOptions = {
    headers: { Authorization: `Bearer ${token}` },
    https: { certificateAuthority: getCACertificate() },
  }

  let tokenName = token
  const sha256Prefix = 'sha256~'
  if (tokenName.startsWith(sha256Prefix)) {
    tokenName = `sha256~${createHash('sha256')
      .update(token.substring(sha256Prefix.length))
      .digest('base64')
      .replaceAll('=', '')
      .replaceAll('+', '-')
      .replaceAll('/', '_')}`
  }

  const url =
    process.env.CLUSTER_API_URL + `/apis/oauth.openshift.io/v1/oauthaccesstokens/${tokenName}?gracePeriodSeconds=0`
  got
    .delete(url, gotOptions)
    .then(() => {
      const host = req.headers.host

      deleteCookie(res, { cookie: 'connect.sid' })
      deleteCookie(res, { cookie: 'acm-access-token-cookie' })
      deleteCookie(res, { cookie: '_oauth_proxy', domain: `.${host}` })
      res.writeHead(200).end()
    })
    .catch((err) => {
      logger.error(err)
    })
}
