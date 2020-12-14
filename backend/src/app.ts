// TODO Request Queue
// TODO Compression Support
// TODO auth callback
// TODO STATIC 304 ETAG support
// TODO /managed-clusters route
// TODO /upgrade route

/* istanbul ignore file */
import { createReadStream } from 'fs'
import { IncomingHttpHeaders, IncomingMessage, request as httpRequest, RequestOptions, ServerResponse } from 'http'
import { Agent, get } from 'https'
import { extname } from 'path'
import { encode as stringifyQuery, parse as parseQueryString } from 'querystring'
import { parse as parseUrl } from 'url'
import { Log, Logs } from './logger'

const agent = new Agent({ rejectUnauthorized: false })

export async function requestHandler(req: IncomingMessage, res: ServerResponse): Promise<unknown> {
    try {
        let url = req.url

        const logs: Logs = []
        ;((req as unknown) as { logs: Logs }).logs = logs

        // CORS Headers
        if (process.env.NODE_ENV !== 'production') {
            if (req.headers['origin']) {
                res.setHeader('Access-Control-Allow-Origin', req.headers['origin'])
                res.setHeader('Vary', 'Origin, Access-Control-Allow-Origin')
            }
            res.setHeader('Access-Control-Allow-Credentials', 'true')
            switch (req.method) {
                case 'OPTIONS':
                    res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
                    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
                    return res.writeHead(200).end()
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

            let data: string
            switch (req.method) {
                case 'PUT':
                case 'POST':
                case 'PATCH':
                    data = await parseBody(req)
                    break
                default:
                    break
            }

            const headers = req.headers
            headers.authorization = `Bearer ${token}`
            const response = await request(req.method, process.env.CLUSTER_API_URL + url, headers, data, logs)
            if (response.statusCode === 403 && req.method === 'GET') {
                return void projectsRequest(req.method, process.env.CLUSTER_API_URL + url, headers, logs, res)
            } else {
                res.writeHead(response.statusCode, response.headers)
                return response.pipe(res)
            }
        }

        // Search
        if (url.startsWith('/search')) {
            const token = getToken(req)
            if (!token) return res.writeHead(401).end()

            const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')
            const headers = req.headers
            headers.host = parseUrl(acmUrl).host
            headers.authorization = `Bearer ${token}`
            const options: RequestOptions = {
                ...parseUrl(acmUrl + '/multicloud/search/graphql'),
                ...{ method: req.method, headers, agent },
            }
            const log = optionsLog(options)
            logs?.push(log)
            const start = process.hrtime()
            return req.pipe(
                httpRequest(options, (response) => {
                    const diff = process.hrtime(start)
                    const time = Math.round((diff[0] * 1e9 + diff[1]) / 1000000)
                    log.unshift(`${time}ms`.padStart(6))
                    log.unshift(response.statusCode)
                    res.writeHead(response.statusCode, response.headers)
                    response.pipe(res)
                })
            )
        }

        // OAuth Login
        if (url === '/login') {
            const oauthInfo = await oauthInfoPromise
            const queryString = stringifyQuery({
                response_type: `code`,
                client_id: process.env.OAUTH2_CLIENT_ID,
                redirect_uri: `${process.env.BACKEND_URL}/cluster-management/login/callback`,
                scope: `user:full`,
                state: '',
            })
            return res.writeHead(302, { location: `${oauthInfo.authorization_endpoint}?${queryString}` }).end()
        }

        // OAuth Callback
        if (url.startsWith('/login/callback')) {
            if (url.includes('?')) {
                const oauthInfo = await oauthInfoPromise
                const queryString = url.substr(url.indexOf('?') + 1)
                const query = parseQueryString(queryString)
                const code = query.code as string
                const state = query.state

                const requestQuery: Record<string, string> = {
                    grant_type: `authorization_code`,
                    code: code,
                    redirect_uri: `${process.env.BACKEND_URL}/cluster-management/login/callback`,
                    client_id: process.env.OAUTH2_CLIENT_ID,
                    client_secret: process.env.OAUTH2_CLIENT_SECRET,
                }
                const requestQueryString = stringifyQuery(requestQuery)
                return get(
                    oauthInfo.token_endpoint + '?' + requestQueryString,
                    { agent, headers: { Accept: 'application/json' } },
                    (response) => {
                        parseJsonBody<{ access_token: string }>(response)
                            .then((body) => {
                                if (body.access_token) {
                                    const headers = {
                                        'Set-Cookie': `acm-access-token-cookie=${body.access_token}; ${
                                            process.env.NODE_ENV === 'production' ? 'Secure; ' : ''
                                        } HttpOnly; Path=/`,
                                        location: process.env.FRONTEND_URL,
                                    }
                                    return res.writeHead(302, headers).end()
                                } else {
                                    console.error(body)
                                    return res.writeHead(500).end()
                                }
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
        if (process.env.NODE_ENV === 'development' && (url.startsWith('/multicloud/header/') || url == '/header')) {
            const token = getToken(req)
            if (!token) return res.writeHead(401).end()

            const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')

            let headerUrl: string
            if (url.startsWith('/multicloud/header/')) {
                headerUrl = `${acmUrl}${url}`
            } else if (url == '/header') {
                const isDevelopment = process.env.NODE_ENV === 'development' ? 'true' : 'false'
                headerUrl = `${acmUrl}/multicloud/header/api/v1/header?serviceId=mcm-ui&dev=${isDevelopment}`
            }

            const headers = req.headers
            headers.authorization = `Bearer ${token}`
            headers.host = parseUrl(acmUrl).host
            const response = await request(req.method, headerUrl, headers, undefined, logs)
            return response.pipe(res.writeHead(response.statusCode, response.headers))
        }

        // Liveness & Readiness
        if (url === '/livenessProbe') return res.writeHead(200).end()
        if (url === '/readinessProbe') return res.writeHead(200).end()

        // Send frontend files
        try {
            let ext = extname(url)
            if (ext === '') {
                ext = '.html'
                url = '/index.html'
            }
            const acceptEncoding = (req.headers['accept-encoding'] as string) ?? ''
            const contentType = contentTypes[ext]
            if (/\bgzip\b/.test(acceptEncoding)) {
                const readStream = createReadStream('./public' + url + '.gz', { autoClose: true })
                readStream
                    .on('open', () => {
                        res.writeHead(200, {
                            'Content-Encoding': 'gzip',
                            'Content-Type': contentType,
                            'Cache-Control': cacheControl,
                        })
                    })
                    .on('error', (err) => {
                        if (ext === '.json') {
                            return res.writeHead(200, { 'Cache-Control': cacheControl }).end()
                        } else {
                            return res.writeHead(404).end()
                        }
                    })
                    .pipe(res, { end: true })
            } else {
                const readStream = createReadStream('./public' + url, { autoClose: true })
                readStream
                    .on('open', () => {
                        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl })
                    })
                    .on('error', (err) => {
                        if (ext === '.json') {
                            return res.writeHead(200, { 'Cache-Control': cacheControl }).end()
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

// Cache control on static files
const cacheControl = process.env.NODE_ENV === 'production' ? 'public, max-age=604800' : 'no-store'

// OAuth Server Info
type OAuthInfo = { authorization_endpoint: string; token_endpoint: string }
const oauthInfoPromise = jsonRequest<OAuthInfo>(
    'GET',
    `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`,
    { accept: 'application/json' },
    undefined,
    []
)

// Get User Token from request cookies
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

// Handle a request
function request(
    method: string,
    url: string,
    headers: IncomingHttpHeaders,
    data: unknown,
    logs: Logs
): Promise<IncomingMessage> {
    const start = process.hrtime()
    const options: RequestOptions = { ...parseUrl(url), ...{ method, headers, agent } }
    return new Promise((resolve, reject) => {
        function attempt() {
            const log = optionsLog(options)
            logs?.push(log)
            const clientRequest = httpRequest(options, (response) => {
                const diff = process.hrtime(start)
                const time = Math.round((diff[0] * 1e9 + diff[1]) / 1000000)
                log.unshift(`${time}ms`.padStart(6))
                log.unshift(response.statusCode)
                switch (response.statusCode) {
                    case 429:
                        setTimeout(attempt, 100)
                        break
                    default:
                        resolve(response)
                        break
                }
            }).on('error', (err) => {
                reject(err)
            })

            if (data) clientRequest.write(data)
            clientRequest.end()
        }
        attempt()
    })
}

async function projectsRequest(
    method: string,
    url: string,
    headers: IncomingHttpHeaders,
    logs: Logs,
    res: ServerResponse
): Promise<void> {
    const namespaceQuery = ''
    if (url.includes('?')) {
        const queryString = url.substr(url.indexOf('?') + 1)
        const query = parseQueryString(queryString)
        if (query['managedNamespacesOnly'] !== undefined) {
            // namespaceQuery = '?labelSelector=cluster.open-cluster-management.io/managedCluster'
            url = url.substr(0, url.indexOf('?'))
        }
    }

    const projects = await jsonRequest<{ items: { metadata: { name: string } }[] }>(
        'GET',
        `${process.env.CLUSTER_API_URL}/apis/project.openshift.io/v1/projects${namespaceQuery}`,
        { authorization: headers.authorization, accept: 'application/json' },
        undefined,
        logs
    )
    let items: unknown[] = []
    if (projects?.items) {
        await Promise.all(
            projects.items.map((project) => {
                const namespacedUrl = addNamespace(url, project.metadata.name)
                return jsonRequest<{ kind: string; items: unknown[] }>(method, namespacedUrl, headers, undefined, logs)
                    .then((data) => {
                        if (data.items) {
                            items = [...items, ...data.items]
                        }
                    })
                    .catch((err) => {
                        // TODO
                    })
            })
        )
    }
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ items: items }))
}

// Handle a request that returns a json object
async function jsonRequest<T>(
    method: string,
    url: string,
    headers: IncomingHttpHeaders,
    data: unknown,
    logs: Logs
): Promise<T> {
    return parseJsonBody<T>(await request(method, url, headers, data, logs))
}

function parseBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('error', reject)
        req.on('data', (chunk) => (data += chunk))
        req.on('end', () => {
            resolve(data)
        })
    })
}

async function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
    const body = await parseBody(req)
    return JSON.parse(body) as T
}

// function isClusterScope(url: string): boolean {
//     if (url.startsWith('/api/')) {
//         return url.split('/').length === 4
//     } else if (url.startsWith('/apis/')) {
//         return url.split('/').length === 5
//     }
//     return false
// }

// function isNamespaceScope(url: string): boolean {
//     if (url.startsWith('/api/')) {
//         return url.split('/').length === 6
//     } else if (url.startsWith('/apis/')) {
//         return url.split('/').length === 7
//     }
//     return false
// }

// function isNameScope(url: string): boolean {
//     if (url.startsWith('/api/')) {
//         return url.split('/').length === 7
//     } else if (url.startsWith('/apis/')) {
//         return url.split('/').length === 8
//     }
//     return false
// }

function addNamespace(url: string, namespace: string): string {
    let queryString = ''
    if (url.includes('?')) {
        queryString = url.substr(url.indexOf('?') + 1)
        url = url.substr(0, url.indexOf('?'))
    }
    const parts = url.split('/')
    let namespacedUrl = parts.slice(0, parts.length - 1).join('/')
    namespacedUrl += `/namespaces/${namespace}/`
    namespacedUrl += parts[parts.length - 1]
    if (queryString) {
        namespacedUrl += '?' + queryString
    }
    return namespacedUrl
}

function optionsLog(options: RequestOptions): Log {
    return [options.method.padStart(5), options.path]
}

const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.map': 'application/json; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
}
