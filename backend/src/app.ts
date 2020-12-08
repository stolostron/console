/* istanbul ignore file */
import { IncomingMessage, request, RequestOptions, ServerResponse } from 'http'
import { Agent } from 'https'
import { parse } from 'url'

function getToken(req: IncomingMessage) {
    let cookies: Record<string, string>
    if (req.headers.cookie) {
        cookies = req.headers.cookie.split('; ').reduce((cookies, value) => {
            const parts = value.split('=')
            if (parts.length === 2) cookies[parts[0]] = parts[1]
            return cookies
        }, {} as Record<string, string>)
    }
    return cookies?.['acm-access-token-cookie']
}

const agent = new Agent({
    rejectUnauthorized: false,
})

export function requestHandler(req: IncomingMessage, res: ServerResponse): void {
    try {
        let url = req.url

        // CORS Headers
        if (process.env.NODE_ENV !== 'production') {
            switch (req.method) {
                case 'GET':
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    break
                case 'OPTIONS':
                    res.setHeader('Vary', 'Origin, Access-Control-Allow-Origin')
                    res.setHeader('Access-Control-Allow-Origin', req.headers['origin'])
                    res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
                    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    return res.writeHead(200).end()
                case 'PUT':
                case 'POST':
                case 'PATCH':
                case 'DELETE':
                    res.setHeader('Access-Control-Allow-Origin', req.headers['origin'])
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    res.setHeader('Vary', 'Origin')
                    break
            }
        }

        if (url.startsWith('/cluster-management/namespaced')) {
            url = url.substr('/cluster-management/namespaced'.length)
        }

        if (url.startsWith('/cluster-management/proxy')) {
            url = url.substr('/cluster-management/proxy'.length)
        }

        if (url.startsWith('/api')) {
            const token = getToken(req)
            if (token === undefined) return res.writeHead(401).end()

            const options: RequestOptions = parse(process.env.CLUSTER_API_URL)
            options.method = req.method
            options.headers = req.headers
            options.headers.authorization = `Bearer ${token}`
            options.agent = agent

            req.pipe(
                request(options, (response) => {
                    res.writeHead(response.statusCode, response.headers)
                    if (req.method === 'GET' && response.statusCode === 403) {
                        // TODO handle use project query
                    } else {
                        response.pipe(res)
                    }
                })
            )
            return
        }

        if (url === '/livenessProbe') return res.writeHead(200).end()
        if (url === '/readinessProbe') return res.writeHead(200).end()
        res.writeHead(404).end()
    } catch (err) {
        console.error(err)
        if (!res.headersSent) {
            res.writeHead(500)
        }
        res.end()
    }
}
