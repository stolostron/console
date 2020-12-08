/* istanbul ignore file */
import { IncomingMessage, request, RequestOptions, ServerResponse } from 'http'
import { Http2ServerRequest } from 'http2'
import { Agent, get } from 'https'
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

function getBody(req: IncomingMessage): Promise<unknown> {
    console.log(1)
    return new Promise((resolve) => {
        let data = ''
        req.on('data', (chunk) => (data += chunk))
        req.on('end', () => {
            resolve(JSON.parse(data))
        })
    })
}

const oauthAuthorizationServerPromise = new Promise<{ authorization_endpoint: string; token_endpoint: string }>(
    (resolve, reject) => {
        const options: RequestOptions = parse(`${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`)
        options.method = 'GET'
        options.agent = agent
        options.headers = { Accept: 'application/json' }
        get(options, (response) => {
            getBody(response)
                .then((body) => {
                    console.log(body)
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
// const response = await Axios.get<{ authorization_endpoint: string; token_endpoint: string }>(
//     `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`,
//     {
//         httpsAgent: new https.Agent({ rejectUnauthorized: false }),
//         headers: { Accept: 'application/json' },
//         responseType: 'json',
//     }
// )

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

            const options: RequestOptions = parse(process.env.CLUSTER_API_URL)
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
                        response.pipe(res)
                    }
                })
            )
        }

        // OAuth Login
        if (url === '/login') {
            return oauthAuthorizationServerPromise
                .then((info) => {
                    console.log(info)
                    // const queryString = url.substr(url.indexOf('?'))
                    // TODO call and get token
                    // ?response_type%3Dcode&client_id%3Dmulticloudingress&redirect_uri%3Dhttp%3A%2F%2Flocalhost%3A4000%2Fcluster-management%2Flogin%2Fcallback&scope%3Duser%3Afull&state%3D
                    const queryString =
                        '?' +
                        [
                            `response_type=code`,
                            `client_id=multicloudingress`,
                            `redirect_uri=http://localhost:4000/cluster-management/login/callback`,
                            `scope=user:full`,
                            `state=`,
                        ]
                            .map((v) => encodeURIComponent(v))
                            .join('&')

                    return res.writeHead(302, { location: `${info.authorization_endpoint}${queryString}` }).end()
                })
                .catch((err) => {
                    console.log(err)
                    return res.writeHead(500).end()
                })
        }

        if (url.startsWith('/login/callback')) {
            return oauthAuthorizationServerPromise
                .then((info) => {
                    // const queryString = url.substr(url.indexOf('?'))
                    // // TODO call and get token
                    // const queryString = encodeURIComponent(
                    //     [
                    //         `?response_type=code`,
                    //         `client_id=multicloudingress`,
                    //         `redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fcluster-management%2Flogin%2Fcallback&`,
                    //         `scope=user full`,
                    //         `state=`,
                    //     ].join('&')
                    // )
                    // return res.writeHead(302, { location: `info.authorization_endpoint${queryString}` }).end()

                    // return res.writeHead(redirect, { location: info.authorization_endpoint }).end()
                    return res.writeHead(500).end()
                })
                .catch((err) => {
                    return res.writeHead(500).end()
                })
            // const query =
            // TODO get code...
        }

        // Console Header
        if (process.env.NODE_ENV === 'development') {
            const token = getToken(req)
            if (token === undefined) return res.writeHead(401).end()

            const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')

            let options: RequestOptions
            if (url.startsWith('/multicloud/header/')) {
                // TODO CACHE CONtROL
                options = parse(`${acmUrl}/${req.url}`)
                // options = parse(req.url)
            }

            if (url == '/cluster-management/header') {
                // TODO CACHE CONtROL
                const isDevelopment = process.env.NODE_ENV === 'development' ? 'true' : 'false'
                options = parse(`${acmUrl}/multicloud/header/api/v1/header?serviceId=mcm-ui&dev=${isDevelopment}`)
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
                            options = parse(r.headers.location)
                            options.method = req.method
                            options.headers = req.headers
                            // options.headers.host = options.host
                            options.headers.authorization = `Bearer ${token}`
                            options.agent = agent
                            request(options, (r) => r.pipe(res.writeHead(r.statusCode, r.headers)))
                        } else {
                            r.pipe(res.writeHead(r.statusCode, r.headers))
                        }
                    })
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
