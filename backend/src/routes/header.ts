import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { parseCookies } from '../lib/cookies'
import { logger } from '../lib/logger'
import { notFound, unauthorized } from '../lib/respond'

export function header(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)

    const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')
    const url = new URL(`${acmUrl}${req.url}`)
    const headers = req.headers
    headers.authorization = `Bearer ${token}`
    headers.host = url.hostname
    const options: RequestOptions = {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: req.method,
        headers,
        rejectUnauthorized: false,
    }

    if (req.url === '/header') {
        const isDevelopment = process.env.NODE_ENV === 'development' ? 'true' : 'false'
        options.path = `/multicloud/header/api/v1/header?serviceId=console&dev=${isDevelopment}`
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
