/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, IncomingHttpHeaders } from 'http2'
import { Agent } from 'https'
import { parseCookiesFromHeaders } from '../lib/cookies'
import { fetchRetry } from '../lib/fetch-retry'

const { HTTP2_HEADER_AUTHORIZATION } = constants
const agent = new Agent({ rejectUnauthorized: false })

export function getToken(req: Http2ServerRequest): string | undefined {
    return getTokenFromHeaders(req.headers)
}

export function getTokenFromHeaders(headers: IncomingHttpHeaders): string | undefined {
    let token = parseCookiesFromHeaders(headers)['acm-access-token-cookie']
    if (!token) {
        const authorizationHeader = headers[HTTP2_HEADER_AUTHORIZATION]
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
