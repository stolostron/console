/* istanbul ignore file */
import { IncomingMessage, request, RequestOptions, ServerResponse } from 'http'
import { Agent, get } from 'https'
import { parse as parseUrl } from 'url'
import { parse as parseQueryString, encode as stringifyQuery } from 'querystring'

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
            if (token === undefined) return res.writeHead(401).end()

            const options: RequestOptions = parseUrl(process.env.CLUSTER_API_URL)
            options.path = url
            options.method = req.method
            options.headers = req.headers
            options.headers.authorization = `Bearer ${token}`
            options.agent = agent

            return req.pipe(
                request(options, (response) => {
                    res.writeHead(response.statusCode, response.headers)
                    if (req.method === 'GET' && response.statusCode === 403) {
                        // TODO handle use project query
                    } else {
                        response.pipe(res, { end: true })
                    }
                }),
                { end: true }
            )
        }

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
            if (token === undefined) return res.writeHead(401).end()
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
            if (token === undefined) return res.writeHead(401).end()

            const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')

            let options: RequestOptions
            if (url.startsWith('/multicloud/header/')) {
                // TODO CACHE CONtROL
                options = parseUrl(`${acmUrl}${url}`)
                // options = parse(req.url)
            }

            if (url == '/header') {
                // TODO CACHE CONtROL
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
                        if (r.statusCode === 301) {
                            options = parseUrl(r.headers.location)
                            options.method = req.method
                            options.headers = req.headers
                            // options.headers.host = options.host
                            options.headers.authorization = `Bearer ${token}`
                            options.agent = agent
                            request(options, (r) => r.pipe(res.writeHead(r.statusCode, r.headers), { end: true }))
                        } else {
                            r.pipe(res.writeHead(r.statusCode, r.headers), { end: true })
                        }
                    }),
                    { end: true }
                )
            }
        }
        if (url === '/livenessProbe') return res.writeHead(200).end()
        if (url === '/readinessProbe') return res.writeHead(200).end()
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

// function parseQueryString(queryString: string): Record<string, string> {
//     if (queryString.includes('?')) {
//         queryString = queryString.substr(queryString.indexOf('?') + 1)
//     }
//     return queryString.split('&').reduce((query, value) => {
//         const parts = value.split('=')
//         if (parts.length === 2) query[parts[0]] = parts[1]
//         return query
//     }, {} as Record<string, string>)
// }

// function encodeQueryString(query: Record<string, string>): string {
//     return (
//         '?' +
//         Object.keys(query)
//             .map((key) => `${key}=${encodeURIComponent(query[key])}`)
//             .join('&')
//     )
// }
