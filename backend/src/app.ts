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
    if (url.includes('?')) {
        query = url.substr(url.indexOf('?'))
        url = url.substr(0, url.indexOf('?'))
    }
    return { url, query }
}

const agent = new Agent({
    rejectUnauthorized: false,
})

export function requestHandler(req: IncomingMessage, res: ServerResponse) {
    try {
        let requrl = req.url

        if (process.env.NODE_ENV !== 'production') {
            // CORS
            switch (req.method) {
                case 'GET':
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    break
                case 'OPTIONS':
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
                    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    return res.writeHead(200).end()
                case 'PUT':
                case 'POST':
                case 'PATCH':
                case 'DELETE':
                    res.setHeader('Access-Control-Allow-Origin', '*')
                    res.setHeader('Access-Control-Allow-Methods', `${req.method}, OPTIONS`)
                    res.setHeader('Access-Control-Allow-Headers', 'content-type')
                    res.setHeader('Access-Control-Allow-Credentials', 'true')
                    break
            }
        }

        if (requrl === '/livenessProbe') return res.writeHead(200).end()

        if (requrl === '/readinessProbe') return res.writeHead(200).end()

        if (requrl.startsWith('/cluster-management/namespaced')) {
            requrl = '/cluster-management/proxy' + requrl.substr('/cluster-management/namespaced'.length)
        }

        if (requrl.startsWith('/cluster-management/proxy')) {
            const token = getToken(req)
            if (token === undefined) res.writeHead(401).end()

            const { url, query } = parseUrl(requrl, '/cluster-management/proxy'.length)
            const options: RequestOptions = parse(process.env.CLUSTER_API_URL + url + query)
            options.method = req.method
            options.headers = req.headers
            options.headers.authorization = `Bearer ${token}`
            options.agent = agent

            return req.pipe(
                request(options, (response) => {
                    res.writeHead(response.statusCode, response.headers)
                    response.pipe(res, { end: true })
                }),
                { end: true }
            )

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
        }
        if (requrl.endsWith('.json')) {
            res.writeHead(200, { 'Content-Type': 'application.json' }).end('{}')
        } else {
            res.writeHead(500).end()
        }
    } catch (err) {
        logError('request error', err, { method: req.method, url: req.url })
        // res.writeHead(500).end()
        res.end()
    }
}
