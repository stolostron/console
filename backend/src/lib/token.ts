/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest } from 'http2'
import { parseCookies } from '../lib/cookies'

const { HTTP2_HEADER_AUTHORIZATION } = constants

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
