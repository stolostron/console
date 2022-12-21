/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest } from 'http2'
import { Agent } from 'https'
import { parseCookies } from '../lib/cookies'
import { fetchRetry } from '../lib/fetch-retry'
import { rejectUnauthorized } from './rejectUnauthorized'

const { HTTP2_HEADER_AUTHORIZATION } = constants
const agent = new Agent({ rejectUnauthorized })

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
