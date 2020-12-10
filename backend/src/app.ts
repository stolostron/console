/* istanbul ignore file */
import { IncomingMessage, request as httpRequest, RequestOptions, ServerResponse } from 'http'
import { Agent, get } from 'https'
import { parse as parseUrl } from 'url'
import { parse as parseQueryString, encode as stringifyQuery } from 'querystring'
import { createReadStream } from 'fs'
import { extname } from 'path'
import { Logs } from './logger'

const agent = new Agent({ rejectUnauthorized: false })

export async function requestHandler(req: IncomingMessage, res: ServerResponse): Promise<unknown> {
    try {
        let url = req.url

        const logs: Logs = []
        ;((req as unknown) as { logs: Logs }).logs = logs

        // CORS Headers
        if (process.env.NODE_ENV !== 'production') {
            switch (req.method) {
                case 'GET':
                    if (req.headers['origin']) {
                        res.setHeader('Access-Control-Allow-Origin', req.headers['origin'])
                    }
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

        if (url.startsWith('/cluster-management')) {
            url = url.substr('/cluster-management'.length)
        }

        if (url.startsWith('/namespaced')) {
            url = url.substr('/namespaced'.length)
        }

        if (url.startsWith('/proxy')) {
            url = url.substr('/proxy'.length)
        }

        // Kubernetes Proxy
        if (url.startsWith('/api')) {
            const token = getToken(req)
            if (!token) return res.writeHead(401).end()

            const options: RequestOptions = parseUrl(process.env.CLUSTER_API_URL + url)
            options.method = req.method
            options.headers = req.headers
            options.headers.authorization = `Bearer ${token}`
            options.agent = agent

            return req.pipe(
                httpRequest(options, (response) => {
                    // if (req.method === 'GET' && response.statusCode === 403 && !url.includes('/namespaces/')) {
                    //     request(
                    //         'GET',
                    //         `${process.env.CLUSTER_API_URL}/apis/project.openshift.io/v1/projects`,
                    //         { authorization: `Bearer ${token}`, accept: 'application/json' },
                    //         logs
                    //     )
                    //         .then(async (response) => {
                    //             const data = await parseJsonBody<{ items: { metadata: { name: string } }[] }>(response)
                    //             const projects = data.items as { metadata: { name: string } }[]
                    //             let items: unknown[] = []
                    //             await Promise.all(
                    //                 projects.map((project) => {
                    //                     let namespacedUrl = url
                    //                     const parts = namespacedUrl.split('/')
                    //                     namespacedUrl = parts.slice(0, parts.length - 1).join('/')
                    //                     namespacedUrl += `/namespaces/${project.metadata.name}/`
                    //                     namespacedUrl += parts[parts.length - 1]
                    //                     const projectOptions: RequestOptions = {
                    //                         ...parseUrl(process.env.CLUSTER_API_URL + namespacedUrl),
                    //                         ...{
                    //                             method: 'GET',
                    //                             headers: {
                    //                                 authorization: `Bearer ${token}`,
                    //                                 accept: 'application/json',
                    //                             },
                    //                             agent,
                    //                         },
                    //                     }
                    //                     return request(projectOptions)
                    //                         .then((data) => {
                    //                             const dataItems = data.items as unknown[]
                    //                             if (dataItems) {
                    //                                 items = [...items, ...dataItems]
                    //                             }
                    //                         })
                    //                         .catch((err) => console.error)
                    //                 })
                    //             )
                    //                 .then(() => {
                    //                     res.writeHead(200, { 'content-type': 'application/json' }).end(
                    //                         JSON.stringify({
                    //                             items,
                    //                         })
                    //                     )
                    //                 })
                    //                 .catch(() => {
                    //                     res.writeHead(200, { 'content-type': 'application/json' }).end('[]')
                    //                 })
                    //         })
                    //         .catch(() => res.writeHead(200).end('[]'))
                    // } else {
                    res.writeHead(response.statusCode, response.headers)
                    response.pipe(res, { end: true })
                    // }
                }),
                { end: true }
            )
        }

        // OAuth Login
        if (url === '/login') {
            const oauthInfo = await oauthInfoPromise
            const queryString = stringifyQuery({
                response_type: `code`,
                client_id: process.env.OAUTH2_CLIENT_ID,
                redirect_uri: `http://localhost:4000/cluster-management/login/callback`,
                scope: `user:full`,
                state: '',
            })
            return res.writeHead(302, { location: `${oauthInfo.authorization_endpoint}?${queryString}` }).end()
        }

        if (url.startsWith('/login/callback') || url.startsWith('/cluster-management/login/callback')) {
            const oauthInfo = await oauthInfoPromise
            if (url.includes('?')) {
                const queryString = url.substr(url.indexOf('?') + 1)
                const query = parseQueryString(queryString)
                const code = query.code as string
                const state = query.state

                const requestQuery: Record<string, string> = {
                    grant_type: `authorization_code`,
                    code: code,
                    redirect_uri: `http://localhost:4000/cluster-management/login/callback`,
                    client_id: process.env.OAUTH2_CLIENT_ID,
                    client_secret: process.env.OAUTH2_CLIENT_SECRET,
                }
                const requestQueryString = stringifyQuery(requestQuery)

                get(
                    oauthInfo.token_endpoint + '?' + requestQueryString,
                    {
                        agent,
                        headers: { Accept: 'application/json' },
                    },
                    (response) => {
                        parseJsonBody<{ access_token: string }>(response)
                            .then((body) => {
                                const headers = {
                                    'Set-Cookie': `acm-access-token-cookie=${body.access_token}; ${
                                        process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
                                    } HttpOnly; Path=/`,
                                    location: `http://localhost:3000`,
                                }
                                return res.writeHead(302, headers).end()
                            })
                            .catch((err) => {
                                console.error(err)
                                return res.writeHead(500).end()
                            })
                    }
                ).on('error', (err) => {
                    return res.writeHead(500).end()
                })
            } else {
                return res.writeHead(500).end()
            }

            // const query =
            // TODO get code...
        }

        // Console Header
        if (process.env.NODE_ENV === 'development') {
            const token = getToken(req)
            if (!token) return res.writeHead(401).end()

            const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')

            let options: RequestOptions
            if (url.startsWith('/multicloud/header/')) {
                options = parseUrl(`${acmUrl}${url}`)
            }

            if (url == '/header') {
                const isDevelopment = process.env.NODE_ENV === 'development' ? 'true' : 'false'
                options = parseUrl(`${acmUrl}/multicloud/header/api/v1/header?serviceId=mcm-ui&dev=${isDevelopment}`)
            }

            if (options) {
                options.method = req.method
                options.headers = req.headers
                options.headers.host = options.host
                options.headers.authorization = `Bearer ${token}`
                options.agent = agent
                return req.pipe(
                    httpRequest(options, (r) => r.pipe(res.writeHead(r.statusCode, r.headers), { end: true }))
                )
            }
        }

        if (url === '/livenessProbe') return res.writeHead(200).end()
        if (url === '/readinessProbe') return res.writeHead(200).end()

        // Send frontend files
        try {
            const ext = extname(url)
            let file: string
            if (ext === '') {
                file = './public/index.html'
            } else {
                file = './public' + url
            }
            const readStream = createReadStream(file, { autoClose: true })
            if (readStream) {
                readStream
                    .on('open', () => {
                        let contentType = ''
                        let cacheControl = 'public, max-age=604800'
                        switch (ext) {
                            case 'html':
                            case '':
                                contentType = 'text/html; charset=utf-8'
                                cacheControl = 'no-store'
                                break
                            case '.css':
                                contentType = 'text/css; charset=UTF-8'
                                break
                            case '.js':
                                contentType = 'application/javascript; charset=UTF-8'
                                break
                            case '.map':
                            case '.json':
                                contentType = 'application/json; charset=utf-8'
                                break
                            case '.svg':
                                contentType = 'image/svg+xml'
                                break
                            case '.png':
                                contentType = 'image/png'
                                break
                            case '.woff':
                                contentType = 'font/woff'
                                break
                            case '.woff2':
                                contentType = 'font/woff2'
                                break
                            default:
                                console.log('unknown mime type', ext)
                                break
                        }
                        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl })
                    })
                    .on('error', (err) => {
                        if (ext === '.json') {
                            return res.writeHead(200, { 'Cache-Control': 'public, max-age=604800' }).end()
                        } else {
                            return res.writeHead(404).end()
                        }
                    })
                    .pipe(res, { end: true })
            }
            return
        } catch (err) {
            return res.writeHead(404).end()
        }
    } catch (err) {
        console.error(err)
        if (!res.headersSent) res.writeHead(500)
        return res.end()
    }
}

type OAuthInfo = { authorization_endpoint: string; token_endpoint: string }
const oauthInfoPromise = new Promise<OAuthInfo>((resolve, reject) => {
    const logs: Logs = []
    return jsonRequest<OAuthInfo>(
        'GET',
        `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`,
        { accept: 'application/json' },
        logs
    ).finally(() => {
        console.info('oauth info setup')
        for (const log of logs) {
            console.info(log)
        }
    })
})

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

function request(method: string, url: string, headers: Record<string, string>, logs?: Logs): Promise<IncomingMessage> {
    const start = process.hrtime()
    const options: RequestOptions = { ...parseUrl(url), ...{ method, headers, agent } }
    return new Promise((resolve, reject) => {
        function attempt() {
            const log = optionsLog(options)
            logs.push(log)
            httpRequest(options, (response) => {
                const diff = process.hrtime(start)
                const time = Math.round((diff[0] * 1e9 + diff[1]) / 10000) / 100
                log.unshift(response.statusCode)
                log.push(`${time}ms`)
                switch (response.statusCode) {
                    case 429:
                        setTimeout(attempt, 100)
                        break
                    default:
                        resolve(response)
                        break
                }
            })
                .on('error', (err) => {
                    reject(err)
                })
                .end()
        }
        attempt()
    })
}

async function jsonRequest<T>(method: string, url: string, headers: Record<string, string>, logs: Logs): Promise<T> {
    return parseJsonBody<T>(await request(method, url, headers, logs))
}

function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('error', reject)
        req.on('data', (chunk) => (data += chunk))
        req.on('end', () => {
            try {
                resolve(JSON.parse(data))
            } catch (err) {
                reject(err)
            }
        })
    })
}

function isClusterScope(url: string): boolean {
    if (url.startsWith('/api/')) {
        return url.split('/').length === 4
    } else if (url.startsWith('/apis/')) {
        return url.split('/').length === 5
    }
    return false
}

function isNamespaceScope(url: string): boolean {
    if (url.startsWith('/api/')) {
        return url.split('/').length === 6
    } else if (url.startsWith('/apis/')) {
        return url.split('/').length === 7
    }
    return false
}

function isNameScope(url: string): boolean {
    if (url.startsWith('/api/')) {
        return url.split('/').length === 7
    } else if (url.startsWith('/apis/')) {
        return url.split('/').length === 8
    }
    return false
}

function addNamespace(url: string, namespace: string): string {
    const parts = url.split('/')
    let namespacedUrl = parts.slice(0, parts.length - 1).join('/')
    namespacedUrl += `/namespaces/${namespace}/`
    namespacedUrl += parts[parts.length - 1]
    return namespacedUrl
}

function optionsLog(options: RequestOptions): Log {
    return [options.method, options.path]
}
