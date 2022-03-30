/* Copyright Contributors to the Open Cluster Management project */
import { createHash } from 'crypto'
import { IncomingMessage } from 'http'
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent, request } from 'https'
import { encode as stringifyQuery, parse as parseQueryString } from 'querystring'
import { deleteCookie } from '../lib/cookies'
import { jsonRequest } from '../lib/json-request'
import { logger } from '../lib/logger'
import { redirect, respondInternalServerError, respondOK, unauthorized } from '../lib/respond'
import { getToken, getUserFromTokenReview, isKubeAdmin } from '../lib/token'
import { setDead } from './liveness'

type OAuthInfo = { authorization_endpoint: string; token_endpoint: string }
let oauthInfoPromise: Promise<OAuthInfo>

const { HTTP_STATUS_OK } = constants

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
    const token = getToken(req)
    console.log('===> backend:logout - getting token = ' + token)
    if (!token) return unauthorized(req, res)

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

    // Get username to know whether special kube:admin processing is needed
    // let isAdmin = false
    const userTokenReview = await getUserFromTokenReview(req)
    const isAdmin = isKubeAdmin(userTokenReview)
    const oauthInfo = await getOauthInfoPromise()
    const logoutUrl = oauthInfo.token_endpoint.substring(0, oauthInfo.token_endpoint.length - 12) + '/logout'

    console.log('===> backend:logout - checking if user is kube:admin: ' + isAdmin.toString())
    console.log('===> backend:logout url - the oauth token endpoint: ' + logoutUrl)

    console.log('===> backend:logout - deleting user bearer token via oauth api')
    const clientRequest = request(
        process.env.CLUSTER_API_URL + `/apis/oauth.openshift.io/v1/oauthaccesstokens/${tokenName}?gracePeriodSeconds=0`,
        {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
            agent: new Agent({ rejectUnauthorized: false }),
        },
        (response: IncomingMessage) => {
            console.log('===> backend:logout - deleting acm-access-token-cookie in response handling')
            deleteCookie(res, 'acm-access-token-cookie')
            deleteCookie(res, '_oauth_proxy', '/', req.headers.host)
            const logoutInfo = JSON.stringify({ admin: isAdmin, logoutPath: logoutUrl })
            res.writeHead(response.statusCode, { 'Content-Type': 'application/json' }).end(logoutInfo)
            req.stream.session.destroy(undefined, HTTP_STATUS_OK)
        }
    )
    clientRequest.on('error', (err) => {
        console.log('===> backend:logout delete of bearer token error: ')
        console.dir(err)
        respondInternalServerError(req, res)
    })
    clientRequest.end()
}
