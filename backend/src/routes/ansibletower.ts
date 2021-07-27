/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { logger } from '../lib/logger'
import { notFound, unauthorized } from '../lib/respond'

export function ansibleTower(req: Http2ServerRequest, res: Http2ServerResponse): void {
    if (!req.headers.tk) return unauthorized(req, res)

    const towerUrl = new URL(req.headers.path.toString())
    const options: RequestOptions = {
        protocol: towerUrl.protocol,
        hostname: towerUrl.hostname,
        path: towerUrl.pathname,
        method: req.method,
        headers: {
            Authorization: `Bearer ${req.headers.tk}`,
        },
        rejectUnauthorized: false,
    }

    pipeline(
        req,
        request(options, (response) => {
            if (!response) return notFound(req, res)
            res.writeHead(response.statusCode ?? 500, response.headers)
            pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
        }),
        (err) => {
            if (err) logger.error(err)
        }
    )
}
