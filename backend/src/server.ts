/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServer, IncomingMessage, request, RequestOptions, Server, ServerResponse } from 'http'
import { parse } from 'url'
import { logError, logger } from './logger'
import { Agent } from 'https'

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

function parseUrl(url: string, length: number) {
    url = url.substr(length)
    let query = ''
    if (url.includes('?')) query = url.substr(url.indexOf('?'))
    return { url, query }
}

const agent = new Agent({
    rejectUnauthorized: false,
})

function handleRequest(req: IncomingMessage, res: ServerResponse) {
    try {
        if (process.env.NODE_ENV !== 'production') {
            // CORS
            switch (req.method) {
                case 'GET':
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    break
                case 'OPTIONS':
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, DELETE')
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    break
            }
        }

        if (req.url === '/livenessProbe') return res.writeHead(200).end()

        if (req.url === '/readinessProbe') return res.writeHead(200).end()

        if (req.url.startsWith('/cluster-management/proxy')) {
            const token = getToken(req)
            if (token === undefined) res.writeHead(401).end()
            const { url, query } = parseUrl(req.url, '/cluster-management/proxy'.length)

            const options: RequestOptions = parse(process.env.CLUSTER_API_URL + url + query)
            options.headers = req.headers
            options.headers.authorization = `Bearer ${token}`
            options.method = req.method
            options.agent = agent
            // options.host = process.env.CLUSTER_API_URL
            // options.path = url
            // options.query = query

            console.log(options.headers)

            const kubeRequest = request(options, (response) => {
                response.pipe(res, { end: true })
            })
            return req.pipe(kubeRequest, { end: true })

            // const result = await kubeRequest(
            //     token,
            //     req.method,
            //     process.env.CLUSTER_API_URL + url + query,
            //     req.body,
            //     req.method === 'PATCH'
            //         ? {
            //               'Content-Type': 'application/merge-patch+json',
            //           }
            //         : undefined
            // )
            // return res.writeHead(result.status).end(result.data)
        } else {
            res.writeHead(500).end()
        }
    } catch (err) {
        logError('request error', err, { method: req.method, url: req.url })
        // res.writeHead(500).end()
        res.end()
    }
}

let server: Server

export function startServer(): void {
    server = createServer(handleRequest)
    server.listen(process.env.PORT, () => {
        logger.debug('server listening')
    })
}

export function stopServer(): void {
    logger.debug({ msg: 'closing server' })
    void server.close()
}

process.on('SIGTERM', () => {
    logger.debug({ msg: 'process SIGTERM' })
    stopServer()
})

process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log()
    logger.debug({ msg: 'process SIGINT' })
    stopServer()
})
