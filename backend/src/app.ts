// TODO Request Queue
// TODO Compression Support
// TODO auth callback
// TODO STATIC 304 ETAG support
// TODO /managed-clusters route
// TODO /upgrade route

import { createReadStream, stat, Stats } from 'fs'
import { IncomingHttpHeaders, IncomingMessage, request as httpRequest, RequestOptions, ServerResponse } from 'http'
import { Agent, get } from 'https'
import { extname } from 'path'
import { encode as stringifyQuery, parse as parseQueryString } from 'querystring'
import { parse as parseUrl } from 'url'
import { logger } from './logger'

const agent = new Agent({ rejectUnauthorized: false })

export async function requestHandler(req: IncomingMessage, res: ServerResponse): Promise<unknown> {
    try {
        let url = req.url

        // CORS Headers
        if (process.env.NODE_ENV !== 'production') {
            if (req.headers['origin']) {
                res.setHeader('Access-Control-Allow-Origin', req.headers['origin'])
                res.setHeader('Vary', 'Origin, Access-Control-Allow-Origin')
            }
            res.setHeader('Access-Control-Allow-Credentials', 'true')
            switch (req.method) {
                case 'OPTIONS':
                    if (req.headers['access-control-request-method']) {
                        res.setHeader('Access-Control-Allow-Methods', req.headers['access-control-request-method'])
                    }
                    if (req.headers['access-control-request-headers']) {
                        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'])
                    }
                    return res.writeHead(200).end()
            }
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
            const response = await request(req.method, process.env.CLUSTER_API_URL + url, headers, data)
            if (response.statusCode === 403 && req.method === 'GET') {
                if (url === '/apis/cluster.open-cluster-management.io/v1/managedclusters') {
                    return managedClusters(token, res)
                }
                return void projectsRequest(req.method, process.env.CLUSTER_API_URL + url, headers, res)
            } else {
                res.writeHead(response.statusCode, response.headers)
                return response.pipe(res)
            }
        }

        // Search
        if (url.startsWith('/search')) {
            const token = getToken(req)
            if (!token) return res.writeHead(401).end()

            const searchUrl = process.env.SEARCH_API_URL || 'https://search-search-api:4010'
            const headers = req.headers
            headers.host = parseUrl(searchUrl).host
            headers.authorization = `Bearer ${token}`
            const options: RequestOptions = {
                ...parseUrl(searchUrl + '/searchapi/graphql'),
                ...{ method: req.method, headers, agent },
            }
            return req.pipe(
                httpRequest(options, (response) => {
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
                redirect_uri: `${process.env.BACKEND_URL}/login/callback`,
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
                    redirect_uri: `${process.env.BACKEND_URL}/login/callback`,
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
                                    return res.writeHead(500).end()
                                }
                            })
                            .catch((err) => {
                                logger.error(err)
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
            const response = await request(req.method, headerUrl, headers)
            return response.pipe(res.writeHead(response.statusCode, response.headers))
        }

        // Readiness
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
            if (contentType === undefined) {
                logger.debug('unknown content type', `ext=${ext}`)
                return res.writeHead(404).end()
            }
            if (/\bgzip\b/.test(acceptEncoding)) {
                try {
                    const stats = await new Promise<Stats>((resolve, reject) =>
                        stat('./public' + url + '.gz', (err, stats) => {
                            if (err) return reject(err)
                            return resolve(stats)
                        })
                    )
                    const readStream = createReadStream('./public' + url + '.gz', { autoClose: true })
                    readStream
                        .on('open', () => {
                            res.writeHead(200, {
                                'Content-Encoding': 'gzip',
                                'Content-Type': contentType,
                                'Cache-Control': cacheControl,
                                'Content-Length': stats.size.toString(),
                            })
                        })
                        .on('error', (err) => res.writeHead(404).end())
                        .pipe(res, { end: true })
                } catch (err) {
                    return res.writeHead(404).end()
                }
            } else {
                const readStream = createReadStream('./public' + url, { autoClose: true })
                readStream
                    .on('open', () => {
                        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': cacheControl })
                    })
                    .on('error', (err) => res.writeHead(404).end())
                    .pipe(res, { end: true })
            }
            return
        } catch (err) {
            return res.writeHead(404).end()
        }
    } catch (err) {
        logger.error(err)
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
    { accept: 'application/json' }
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
function request(method: string, url: string, headers: IncomingHttpHeaders, data?: unknown): Promise<IncomingMessage> {
    const start = process.hrtime()
    const options: RequestOptions = { ...parseUrl(url), ...{ method, headers, agent } }
    return new Promise((resolve, reject) => {
        function attempt() {
            const clientRequest = httpRequest(options, (response) => {
                const diff = process.hrtime(start)
                const time = Math.round((diff[0] * 1e9 + diff[1]) / 1000000)
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

// TODO make this stream the results
async function projectsRequest(
    method: string,
    url: string,
    headers: IncomingHttpHeaders,
    res: ServerResponse
): Promise<void> {
    let namespaceQuery = ''
    if (url.includes('?')) {
        const queryString = url.substr(url.indexOf('?') + 1)
        const query = parseQueryString(queryString)
        if (query['managedNamespacesOnly'] !== undefined) {
            namespaceQuery = '?labelSelector=cluster.open-cluster-management.io/managedCluster'
            url = url.substr(0, url.indexOf('?'))
        }
    }

    const projects = await jsonRequest<{ items: { metadata: { name: string } }[] }>(
        'GET',
        `${process.env.CLUSTER_API_URL}/apis/project.openshift.io/v1/projects${namespaceQuery}`,
        { authorization: headers.authorization, accept: 'application/json' }
    )
    res.writeHead(200, { 'content-type': 'application/json' })
    res.write('{"items":[')
    let first = true
    if (projects?.items) {
        await Promise.all(
            projects.items.map((project) => {
                console.log(project.metadata.name)
                const namespacedUrl = addNamespace(url, project.metadata.name)
                return jsonRequest<{ kind: string; items: unknown[] }>(method, namespacedUrl, headers)
                    .then((data) => {
                        if (data?.items) {
                            for (const item of data.items) {
                                if (first) first = false
                                else res.write(',')
                                res.write(JSON.stringify(item))
                            }
                        }
                    })
                    .catch((err) => {
                        // Do Nothing
                    })
            })
        )
    }
    res.end(']}')
}

async function managedClusters(token: string, res: ServerResponse): Promise<void> {
    const namespaceQuery = '?labelSelector=cluster.open-cluster-management.io/managedCluster'
    const projects = await jsonRequest<{ items: { metadata: { name: string } }[] }>(
        'GET',
        `${process.env.CLUSTER_API_URL}/apis/project.openshift.io/v1/projects${namespaceQuery}`,
        { authorization: `Bearer ${token}`, accept: 'application/json' }
    )
    res.writeHead(200, { 'content-type': 'application/json' })
    res.write('{"items":[')
    let first = true
    if (projects?.items) {
        await Promise.all(
            projects.items.map(async (project) => {
                await jsonRequest<{ kind: string }>(
                    'GET',
                    `${process.env.CLUSTER_API_URL}/apis/cluster.open-cluster-management.io/v1/managedclusters/${project.metadata.name}`,
                    { authorization: `Bearer ${token}`, accept: 'application/json' }
                )
                    .then((data) => {
                        if (data?.kind === 'ManagedCluster') {
                            if (first) first = false
                            else res.write(',')
                            res.write(JSON.stringify(data))
                        }
                    })
                    .catch((err) => {
                        // Do Nothing
                    })
            })
        )
    }
    res.end(']}')
}

// Handle a request that returns a json object
async function jsonRequest<T>(method: string, url: string, headers: IncomingHttpHeaders, data?: unknown): Promise<T> {
    return parseJsonBody<T>(await request(method, url, headers, data))
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
