/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse } from 'http2'
import { Agent, get } from 'https'
import * as rawBody from 'raw-body'
import { parseCookies } from '../lib/cookies'
import { logger } from '../lib/logger'
import { respondInternalServerError, unauthorized } from '../lib/respond'

const { HTTP2_HEADER_AUTHORIZATION } = constants

export function authenticated(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)

    get(
        process.env.CLUSTER_API_URL + '/apis',
        {
            headers: { [HTTP2_HEADER_AUTHORIZATION]: `Bearer ${token}` },
            agent: new Agent({ rejectUnauthorized: false }),
        },
        (response) => {
            res.writeHead(response.statusCode).end()
            try {
                void rawBody(response, { length: response.headers['content-length'] })
            } catch (err) {
                logger.error(err)
            }
        }
    ).on('error', (err) => {
        logger.error(err)
        respondInternalServerError(req, res)
    })
}
