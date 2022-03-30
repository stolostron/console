/* Copyright Contributors to the Open Cluster Management project */

import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { logger } from '../lib/logger'
import { respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken, getUserFromTokenReview } from '../lib/token'

export async function username(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const token = getToken(req)
    if (!token) return unauthorized(req, res)

    try {
        const promise = getUserFromTokenReview(req)
        await promise.then((userTokenReview) => {
            const name =
                userTokenReview.status && userTokenReview.status.user && userTokenReview.status.user.username
                    ? userTokenReview.status.user.username
                    : 'undefined'
            const responsePayload = { username: name }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(responsePayload))
        })
    } catch (err) {
        logger.error(err)
        respondInternalServerError(req, res)
    }
}
