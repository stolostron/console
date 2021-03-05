import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { encode as stringifyQuery, parse as parseQueryString } from 'querystring'
import { jsonRequest } from '../lib/json-request'
import { redirect, respondInternalServerError } from '../lib/respond'

type OAuthInfo = { authorization_endpoint: string; token_endpoint: string }
const oauthInfoPromise = jsonRequest<OAuthInfo>(
    `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`
).catch(() => ({
    authorization_endpoint: '',
    token_endpoint: '',
}))

export async function login(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const oauthInfo = await oauthInfoPromise
    const queryString = stringifyQuery({
        response_type: `code`,
        client_id: process.env.OAUTH2_CLIENT_ID,
        redirect_uri: `${process.env.BACKEND_URL}/login/callback`,
        scope: `user:full`,
        state: '',
    })
    return redirect(res, `${oauthInfo.authorization_endpoint}?${queryString}`)
}

export async function loginCallback(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const url = req.url
    if (url.includes('?')) {
        const oauthInfo = await oauthInfoPromise
        const queryString = url.substr(url.indexOf('?') + 1)
        const query = parseQueryString(queryString)
        const code = query.code as string
        const state = query.state
        const requestQuery: Record<string, string> = {
            grant_type: `authorization_code`,
            code: code,
            redirect_uri: `${process.env.BACKEND_URL}/login/callback`,
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
            return res.writeHead(302, headers).end()
        } else {
            return respondInternalServerError(req, res)
        }
    } else {
        return respondInternalServerError(req, res)
    }
}
