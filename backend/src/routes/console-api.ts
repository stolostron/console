/* Copyright Contributors to the Open Cluster Management project */
import { constants, Http2ServerRequest, Http2ServerResponse, OutgoingHttpHeaders } from 'http2'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'
import { URL } from 'url'
import { parseCookies } from '../lib/cookies'
import { logger } from '../lib/logger'
import { notFound, unauthorized } from '../lib/respond'

const proxyHeaders = [
    constants.HTTP2_HEADER_ACCEPT,
    constants.HTTP2_HEADER_ACCEPT_ENCODING,
    constants.HTTP2_HEADER_CONTENT_ENCODING,
    constants.HTTP2_HEADER_CONTENT_LENGTH,
    constants.HTTP2_HEADER_CONTENT_TYPE,
]

export function consoleApi(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return unauthorized(req, res)

    const headers: OutgoingHttpHeaders = { authorization: `Bearer ${token}` }
    for (const header of proxyHeaders) {
        if (req.headers[header]) headers[header] = req.headers[header]
    }

    const consoleApiUrl = process.env.CONSOLE_API_URL || 'https://console-api:4000'
    const url = new URL(consoleApiUrl + '/hcmuiapi/graphql')
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

    pipeline(
        req,
        request(options, (response) => {
            if (!response) return notFound(req, res)
            res.writeHead(response.statusCode, response.headers)
            pipeline(response, res as unknown as NodeJS.WritableStream, () => logger.error)
        }),
        () => logger.error
    )
}
