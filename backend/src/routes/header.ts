import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { parseCookies } from '../lib/cookies'
import { logger } from '../lib/logger'
import { notFound, unauthorized } from '../lib/respond'

const proxyHeaders = [constants.HTTP2_HEADER_ACCEPT, constants.HTTP2_HEADER_ACCEPT_ENCODING]
const proxyResponseHeaders = [
    constants.HTTP2_HEADER_CACHE_CONTROL,
    constants.HTTP2_HEADER_CONTENT_TYPE,
    constants.HTTP2_HEADER_CONTENT_LENGTH,
    constants.HTTP2_HEADER_CONTENT_ENCODING,
    constants.HTTP2_HEADER_ETAG,
]

export function header(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)

    const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(req.url as any) = '/multicloud' + req.url

    const url = new URL(`${acmUrl}${req.url}`)

    const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}`, host: url.hostname }
    for (const header of proxyHeaders) {
        if (req.headers[header]) headers[header] = req.headers[header]
    }

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

    if (req.url === '/multicloud/header') {
        const isDevelopment = process.env.NODE_ENV === 'development' ? 'true' : 'false'
        options.path = `/multicloud/header/api/v1/header?serviceId=console&dev=${isDevelopment}`
    }

    pipeline(
        req,
        request(options, (response) => {
            if (!response) return notFound(req, res)
            const responseHeaders: OutgoingHttpHeaders = {}
            for (const header of proxyResponseHeaders) {
                if (response.headers[header]) responseHeaders[header] = response.headers[header]
            }
            res.writeHead(response.statusCode, responseHeaders)
            pipeline(response, (res as unknown) as NodeJS.WritableStream, (err) => logger.error)
        }),
        (err) => logger.error
    )
}
