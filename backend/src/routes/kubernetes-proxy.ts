import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { parseCookies } from '../lib/cookies'
import { respondUnauthorized } from '../lib/respond'
import { URL } from 'url'
import { request, RequestOptions } from 'https'
import { pipeline } from 'stream'

export function kubernetesProxyRoute(req: Http2ServerRequest, res: Http2ServerResponse): void {
    const token = parseCookies(req)['acm-access-token-cookie']
    if (!token) return respondUnauthorized(req, res)

    const headers = req.headers
    headers.authorization = `Bearer ${token}`

    const url = new URL(req.url)
    const options: RequestOptions = {
        rejectUnauthorized: false,
        protocol: url.protocol,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: req.method,
    }
    pipeline(
        req,
        request(options, (response) => {
            res.writeHead(response.statusCode, response.headers)
            pipeline(response, res.stream)
        })
    )
}
