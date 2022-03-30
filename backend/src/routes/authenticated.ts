/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { logger } from '../lib/logger'
import { respondInternalServerError, unauthorized } from '../lib/respond'
import { getToken, isAuthenticated } from '../lib/token'

export async function authenticated(req: Http2ServerRequest, res: Http2ServerResponse): Promise<void> {
    const token = getToken(req)
    if (!token) return unauthorized(req, res)
    try {
        const response = await isAuthenticated(token)
        res.writeHead(response.status).end()
        void response.blob()
    } catch (err) {
        logger.error(err)
        respondInternalServerError(req, res)
    }
}
