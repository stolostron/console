import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { parseCookies } from '../lib/cookies'
import { logger } from '../lib/logger'
import { notFound, unauthorized } from '../lib/respond'

export function proxy(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)

    const headers = req.headers
    headers.authorization = `Bearer ${token}`

    const url = new URL(process.env.CLUSTER_API_URL)
    const options: RequestOptions = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: req.url,
        method: req.method,
        headers,
        rejectUnauthorized: false,
    }
    pipeline(
        req,
        request(options, (response) => {
            if (!response) return notFound(req, res)
            res.writeHead(response.statusCode, response.headers)
            pipeline(response, (res as unknown) as NodeJS.WritableStream, (err) => logger.error)
        }),
        (err) => logger.error
    )
}
