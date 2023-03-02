/* Copyright Contributors to the Open Cluster Management project */
import { createHash } from 'crypto'
import got from 'got'
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { encode as stringifyQuery, parse as parseQueryString } from 'querystring'
import { deleteCookie } from '../lib/cookies'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { redirect, respondInternalServerError, unauthorized } from '../lib/respond'
import { getAuthenticatedToken } from '../lib/token'
import { setDead } from './liveness'

type OAuthInfo = { authorization_endpoint: string; token_endpoint: string }
let oauthInfoPromise: Promise<OAuthInfo>

export function getOauthInfoPromise() {
  if (oauthInfoPromise === undefined) {
    oauthInfoPromise = jsonRequest<OAuthInfo>(
      `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`
    ).catch((err: Error) => {
      logger.error({ msg: 'oauth-authorization-server error', error: err.message })
      setDead()
      return {
        authorization_endpoint: '',
        token_endpoint: '',
      }
    })
  }
  return oauthInfoPromise
}

export async function login(_req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const oauthInfo = await getOauthInfoPromise()

  const queryString = stringifyQuery({
    response_type: `code`,
    client_id: process.env.OAUTH2_CLIENT_ID,
    redirect_uri: process.env.OAUTH2_REDIRECT_URL,
    scope: `user:full`,
    state: '',
  })
  return redirect(res, `${oauthInfo.authorization_endpoint}?${queryString}`)
}

export async function loginCallback(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const url = req.url
  if (url.includes('?')) {
    const oauthInfo = await getOauthInfoPromise()
    const queryString = url.substr(url.indexOf('?') + 1)
    const query = parseQueryString(queryString)
    const code = query.code as string
    // const state = query.state
    const requestQuery: Record<string, string> = {
      grant_type: `authorization_code`,
      code: code,
      redirect_uri: process.env.OAUTH2_REDIRECT_URL,
      client_id: process.env.OAUTH2_CLIENT_ID,
      client_secret: process.env.OAUTH2_CLIENT_SECRET,
    }
    const requestQueryString = stringifyQuery(requestQuery)
    const body = await jsonRequest<{ access_token: string }>(oauthInfo.token_endpoint + '?' + requestQueryString)
    if (body.access_token) {
      const headers = {
        'Set-Cookie': `acm-access-token-cookie=${body.access_token}; ${
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

export async function logout(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
  const token = await getAuthenticatedToken(req, res)
  if (token) {
    const gotOptions = { headers: { Authorization: `Bearer ${token}` }, https: { rejectUnauthorized: false } }

    let tokenName = token
    const sha256Prefix = 'sha256~'
    if (tokenName.startsWith(sha256Prefix)) {
      tokenName = `sha256~${createHash('sha256')
        .update(token.substring(sha256Prefix.length))
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')}`
    }

    try {
      const url =
        process.env.CLUSTER_API_URL + `/apis/oauth.openshift.io/v1/oauthaccesstokens/${tokenName}?gracePeriodSeconds=0`
      await got.delete(url, gotOptions)
    } catch (err) {
      logger.error(err)
    }

    const host = req.headers.host

    deleteCookie(res, { cookie: 'connect.sid' })
    deleteCookie(res, { cookie: 'acm-access-token-cookie' })
    deleteCookie(res, { cookie: '_oauth_proxy', domain: `.${host}` })
    res.writeHead(200).end()
  }
}
