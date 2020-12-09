/* istanbul ignore file */
import { IncomingMessage, request, RequestOptions, ServerResponse } from 'http'
import { Agent, get } from 'https'
import { parse as parseUrl, pathToFileURL } from 'url'
import { parse as parseQueryString, encode as stringifyQuery } from 'querystring'
import { createReadStream } from 'fs'
import { extname } from 'path'

const agent = new Agent({ rejectUnauthorized: false })

const oauthAuthorizationServerPromise = new Promise<{ authorization_endpoint: string; token_endpoint: string }>(
    (resolve, reject) => {
        const options: RequestOptions = parseUrl(
            `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`
        )
        options.method = 'GET'
        options.agent = agent
        options.headers = { Accept: 'application/json' }
        get(options, (response) => {
            getBody(response)
                .then((body) => {
                    resolve(body as { authorization_endpoint: string; token_endpoint: string })
                })
                .catch((err) => {
                    console.error(err)
                    reject(err)
                })
        }).on('error', (err) => {
            reject(err)
        })
    }
)

export function requestHandler(req: IncomingMessage, res: ServerResponse): unknown {
    try {
        let url = req.url

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
            if (token === undefined) {
                return res.writeHead(401, { 'content-type': 'application/json; charset=utf-8' }).end('{}')
            }

            const options: RequestOptions = parseUrl(process.env.CLUSTER_API_URL + url)
            // options.path = url
            options.method = req.method
            options.headers = req.headers
            options.headers.authorization = `Bearer ${token}`
            options.agent = agent

            return req.pipe(
                request(options, (response) => {
                    if (req.method === 'GET' && response.statusCode === 403) {
                        const projectsRequestOptions: RequestOptions = parseUrl(
                            process.env.CLUSTER_API_URL + `/apis/project.openshift.io/v1/projects`
                        )
                        projectsRequestOptions.method = req.method
                        projectsRequestOptions.headers = {}
                        projectsRequestOptions.headers.authorization = `Bearer ${token}`
                        projectsRequestOptions.agent = agent
                        request(projectsRequestOptions, (response) => {
                            if (response.statusCode === 200) {
                                getBody(response)
                                    .then((body) => {
                                        console.log(body)
                                        const projects: { metadata: { name: string } }[] = body.items
                                        console.log(
                                            'PROJECTS',
                                            projects.map((p) => p.metadata.name)
                                        )
                                        res.writeHead(200).end('[]')
                                    })
                                    .catch(() => {
                                        res.writeHead(200).end('[]')
                                    })
                            } else {
                                res.writeHead(200).end('[]')
                            }
                        }).end()
                    } else {
                        res.writeHead(response.statusCode, response.headers)
                        response.pipe(res, { end: true })
                    }
                }),
                { end: true }
            )
        }

        console.log('111')

        // OAuth Login
        if (url === '/login') {
            return oauthAuthorizationServerPromise
                .then((info) => {
                    const query = {
                        response_type: `code`,
                        client_id: `multicloudingress`,
                        redirect_uri: `http://localhost:4000/cluster-management/login/callback`,
                        scope: `user:full`,
                        state: '',
                    }
                    const queryString = `?${stringifyQuery(query)}`
                    return res.writeHead(302, { location: `${info.authorization_endpoint}${queryString}` }).end()
                })
                .catch((err) => {
                    console.error(err)
                    return res.writeHead(500).end()
                })
        }

        if (url.startsWith('/login/callback') || url.startsWith('/cluster-management/login/callback')) {
            return oauthAuthorizationServerPromise
                .then((info) => {
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
                            info.token_endpoint + '?' + requestQueryString,
                            {
                                agent,
                                headers: { Accept: 'application/json' },
                            },
                            (response) => {
                                getBody(response)
                                    .then((body) => {
                                        const headers = {
                                            'Set-Cookie': `acm-access-token-cookie=${body.access_token as string}; ${
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
                })
                .catch((err) => {
                    console.error(err)
                    return res.writeHead(500).end()
                })
            // const query =
            // TODO get code...
        }

        if (url === '/logout') {
            const token = getToken(req)
            if (token === undefined)
                return res.writeHead(401, { 'content-type': 'application/json; charset=utf-8' }).end('{}')

            return oauthAuthorizationServerPromise
                .then((info) => {
                    request(
                        info.token_endpoint,
                        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
                        (response) => {
                            return res.writeHead(response.statusCode).end()
                        }
                    )
                })
                .catch((err) => {
                    console.error(err)
                    return res.writeHead(500).end()
                })
        }

        // Console Header
        if (process.env.NODE_ENV === 'development') {
            const token = getToken(req)
            if (token === undefined)
                return res.writeHead(401, { 'content-type': 'application/json; charset=utf-8' }).end('{}')

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
                    request(options, (r) => {
                        const headers: Record<string, string | string[]> = { ...r.headers }
                        // headers['cache-control'] = 'public, max-age=604800'
                        // if (r.statusCode === 200 || r.statusCode === 304) {
                        //     delete headers['set-cookie']
                        //     delete headers['expires']
                        //     delete headers['pragma']
                        // }
                        r.pipe(res.writeHead(r.statusCode, headers), { end: true })
                    })
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
            console.error(err)
            // DO NOTHING
        }

        return res.writeHead(404).end()
    } catch (err) {
        console.error(err)
        if (!res.headersSent) {
            res.writeHead(500)
        }
        return res.end()
    }
}

function getBody(req: IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => (data += chunk))
        req.on('end', () => {
            try {
                resolve(JSON.parse(data))
            } catch (err) {
                console.error(err)
                reject()
            }
        })
        req.on('error', (err) => {
            console.error(err)
            reject()
        })
    })
}

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
