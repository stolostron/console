// TODO Request Queue
// TODO Compression Support
// TODO auth callback
// TODO STATIC 304 ETAG support
// TODO /managed-clusters route

import { createReadStream, stat, Stats } from 'fs'
import { IncomingHttpHeaders, IncomingMessage, request as httpRequest, RequestOptions, ServerResponse } from 'http'
import { Agent, get } from 'https'
import { extname } from 'path'
import { encode as stringifyQuery, parse as parseQueryString } from 'querystring'
import { parse as parseUrl } from 'url'
import { logger } from './logger'
import { getRemoteResource, updateRemoteResource, parseJsonBody, parseBody, requestException } from './lib/utils'

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
}

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
                headerUrl = `${acmUrl}/multicloud/header/api/v1/header?serviceId=console&dev=${isDevelopment}`
            }

            const headers = req.headers
            headers.authorization = `Bearer ${token}`
            headers.host = parseUrl(acmUrl).host
            const response = await request(req.method, headerUrl, headers)
            return response.pipe(res.writeHead(response.statusCode, response.headers))
        }

        if (url.startsWith('/multicloud')) {
            url = url.substr('/multicloud'.length)
        }

        // Kubernetes Proxy
        if (url.startsWith('/api')) {
            if (process.env.NODE_ENV === 'development') {
                if (process.env.DELAY) {
                    await new Promise((resolve) => setTimeout(resolve, Number(process.env.DELAY)))
                }
                if (process.env.RANDOM_DELAY) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, getRandomInt(0, Number(process.env.RANDOM_DELAY)))
                    )
                }
                if (process.env.RANDOM_ERROR) {
                    if (getRandomInt(0, 100) < Number(process.env.RANDOM_ERROR)) {
                        return res.destroy()
                    }
                }
            }

            const token = getToken(req)
            if (!token) return res.writeHead(401).end()

            let data: Buffer
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
                if (isNameScope(url)) {
                    return res.writeHead(403).end()
                }
                return void projectsRequest(req.method, process.env.CLUSTER_API_URL + url, headers, res)
            } else {
                res.writeHead(response.statusCode, response.headers)
                return response.pipe(res)
            }
        }
        // Upgrade
        if (url.startsWith('/upgrade')) {
            // will always create new managedcluster-view for upgrade
            const token = getToken(req)
            if (!token) {
                logger.info('no token provided')
                return res.writeHead(401).end()
            }
            if (req.method != 'POST') {
                logger.info('wrong method for upgrade')
                res.writeHead(405)
                return res.end()
            }
            req.setTimeout(120 * 1000)
            const host = parseUrl(process.env.CLUSTER_API_URL).host

            // reuse managedclusterview
            try {
                const reqBody: { clusterName: string; version: string } = await parseJsonBody(req)
                if (!reqBody || !reqBody.clusterName || !reqBody.version) {
                    res.writeHead(400)
                    logger.info('wrong body for the upgrade request')
                    return res.end('{"message":"requires clusterName and version"}')
                }
                const remoteVersion = await getRemoteResource<{
                    status: {
                        availableUpdates: Record<string, unknown>[]
                    }
                    spec: {
                        desiredUpdate: Record<string, unknown>
                    }
                }>(
                    host,
                    token,
                    new Agent({ rejectUnauthorized: false }),
                    reqBody.clusterName,
                    'config.openshift.io',
                    'v1',
                    'clusterversions',
                    'ClusterVersion',
                    'version',
                    '',
                    2000,
                    10
                )

                const desiredUpdates = remoteVersion?.status?.availableUpdates.filter(
                    (u) => u.version && u.version == reqBody.version
                )
                if (!desiredUpdates || desiredUpdates.length === 0) {
                    console.debug('cannot find version')
                    throw { code: 400, msg: '{"message":"selected version is not available"}' } as requestException
                }
                const desiredUpdate = desiredUpdates[0]
                remoteVersion.spec.desiredUpdate = desiredUpdate
                await updateRemoteResource(
                    host,
                    token,
                    new Agent({ rejectUnauthorized: false }),
                    reqBody.clusterName,
                    'clusterversions',
                    'version',
                    '',
                    remoteVersion,
                    2000,
                    10
                )
                res.writeHead(200)
                return res.end()
            } catch (err) {
                // handle error messages
                let code = 500
                let msg = '{"message":"failed to upgrade"}'
                const formattedErr = err as requestException
                if (formattedErr.code > 0 && (formattedErr.code >= 300 || formattedErr.code < 200)) {
                    code = formattedErr.code
                }
                if (formattedErr.msg) {
                    msg = formattedErr.msg
                }
                logger.error('failed to upgrade:', err)
                res.writeHead(code)
                return res.end(msg)
            }
        }

        // Search
        if (url.startsWith('/proxy/search')) {
            const token = getToken(req)
            if (!token) return res.writeHead(401).end()

            const searchUrl = process.env.SEARCH_API_URL || 'https://search-search-api:4010'
            const headers = req.headers
            headers.host = parseUrl(searchUrl).host
            headers.authorization = `Bearer ${token}`
            const options: RequestOptions = {
                ...parseUrl(searchUrl + '/searchapi/graphql'),
                ...{ method: req.method, headers, agent: new Agent({ rejectUnauthorized: false }) },
            }
            return req.pipe(
                httpRequest(options, (response) => {
                    const headers = { ...response.headers }
                    if (process.env.NODE_ENV === 'development') {
                        if (req.headers['origin']) {
                            headers['Access-Control-Allow-Origin'] = req.headers['origin']
                        }
                    }
                    res.writeHead(response.statusCode, headers)
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
                    { agent: new Agent({ rejectUnauthorized: false }), headers: { Accept: 'application/json' } },
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
    const options: RequestOptions = {
        ...parseUrl(url),
        ...{ method, headers, agent: new Agent({ rejectUnauthorized: false }) },
    }
    return new Promise((resolve, reject) => {
        function attempt() {
            const clientRequest = httpRequest(options, (response) => {
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
    if (projects?.items && projects.items.length > 0) {
        await new Promise<void>((resolve) => {
            const projectCount = projects?.items.length
            let projectsComplete = 0
            projects.items.forEach((project) => {
                const namespacedUrl = addNamespace(url, project.metadata.name)
                jsonRequest<{ kind: string; items: unknown[] }>(method, namespacedUrl, headers)
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
                    .finally(() => {
                        projectsComplete++
                        if (projectsComplete === projectCount) {
                            resolve()
                        }
                    })
            })
        })
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
    if (projects?.items && projects.items.length > 0) {
        await new Promise<void>((resolve) => {
            const projectCount = projects?.items.length
            let projectsComplete = 0
            projects.items.forEach((project) => {
                request(
                    'GET',
                    `${process.env.CLUSTER_API_URL}/apis/cluster.open-cluster-management.io/v1/managedclusters/${project.metadata.name}`,
                    { authorization: `Bearer ${token}`, accept: 'application/json' }
                )
                    .then(async (r) => {
                        const buffer = await parseBody(r)
                        if (first) first = false
                        else res.write(',')
                        res.write(buffer)
                    })
                    .catch((err) => {
                        // Do Nothing
                    })
                    .finally(() => {
                        projectsComplete++
                        if (projectsComplete === projectCount) {
                            resolve()
                        }
                    })
            })
        })
    }
    res.end(']}')
}

// Handle a request that returns a json object
async function jsonRequest<T>(method: string, url: string, headers: IncomingHttpHeaders, data?: unknown): Promise<T> {
    return parseJsonBody<T>(await request(method, url, headers, data))
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

function isNameScope(url: string): boolean {
    if (url.includes('?')) {
        url = url.substr(0, url.indexOf('?'))
    }
    if (url.startsWith('/api/')) {
        return url.split('/').length === 5 || url.split('/').length === 7
    } else if (url.startsWith('/apis/')) {
        return url.split('/').length === 6 || url.split('/').length === 8
    }
    return false
}

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
