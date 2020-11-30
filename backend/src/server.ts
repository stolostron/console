/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios, { AxiosResponse, Method } from 'axios'
import { fastify as Fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyCompress from 'fastify-compress'
import fastifyCookie from 'fastify-cookie'
import fastifyCors from 'fastify-cors'
import { fastifyOauth2, OAuth2Namespace } from 'fastify-oauth2'
import fastifyReplyFrom from 'fastify-reply-from'
import fastifyStatic from 'fastify-static'
import { readFile } from 'fs'
import { STATUS_CODES } from 'http'
import * as https from 'https'
import * as path from 'path'
import { join } from 'path'
import * as querystring from 'querystring'
import { URL } from 'url'
import { promisify } from 'util'
import { logError, logger } from './lib/logger'

declare module 'fastify-reply-from' {
    export interface From {
        from: (path: string) => void
    }
}

function noop(): void {
    /* Do Nothing */
}

export async function startServer(): Promise<FastifyInstance> {
    const keyPromise = promisify<string, Buffer>(readFile)('./certs/tls.key').catch(noop)
    const certPromise = promisify<string, Buffer | undefined>(readFile)('./certs/tls.crt').catch(noop)
    const key = await keyPromise
    const cert = await certPromise

    let fastify: FastifyInstance
    if (key && cert) {
        fastify = Fastify({ https: { key, cert }, logger: false })
    } else {
        fastify = Fastify({ logger: false })
    }

    if (process.env.NODE_ENV !== 'production') {
        await fastify.register(fastifyCors, {
            origin: true,
            methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'],
            credentials: true,
        })
    }

    fastify.get('/ping', async (req, res) => {
        await res.code(200).send()
    })

    fastify.get('/livenessProbe', async (req, res) => {
        await res.code(200).send()
    })

    fastify.get('/readinessProbe', async (req, res) => {
        await res.code(200).send()
    })

    async function kubeRequest<T = unknown>(
        token: string,
        method: string,
        url: string,
        data?: unknown
    ): Promise<AxiosResponse<T>> {
        let response: AxiosResponse<T>
        // eslint-disable-next-line no-constant-condition
        let tries = method === 'GET' ? 3 : 1
        while (tries-- > 0) {
            try {
                response = await Axios.request<T>({
                    url,
                    method: method as Method,
                    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: 'json',
                    validateStatus: () => true,
                    data,
                    // timeout - defaults to unlimited
                })
                switch (response.status) {
                    case 429:
                        if (tries > 0) {
                            await new Promise((resolve) => setTimeout(resolve, 100))
                        }
                        break
                    default:
                        return response
                }
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const code = err.code as string
                switch (code) {
                    case 'ETIMEDOUT':
                        logger.warn({ msg: 'ETIMEDOUT', method, url })
                        break
                    case 'ECONNRESET':
                        logger.warn({ msg: 'ECONNRESET', method, url })
                        break
                    default:
                        throw err
                }
            }
        }
        return response
    }

    async function proxy(req: FastifyRequest, res: FastifyReply) {
        try {
            const token = req.cookies['acm-access-token-cookie']
            if (!token) return res.code(401).send()

            let url = req.url.substr('/cluster-management/proxy'.length)
            let query = ''
            if (url.includes('?')) {
                query = url.substr(url.indexOf('?'))
                url = url.substr(0, url.indexOf('?'))
            }

            const result = await kubeRequest(token, req.method, process.env.CLUSTER_API_URL + url + query, req.body)
            return res.code(result.status).send(result.data)
        } catch (err) {
            logError('proxy error', err, { method: req.method, url: req.url })
            void res.code(500).send(err)
        }
    }

    // CONSOLE-HEADER
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'development') {
        const acmUrl = process.env.CLUSTER_API_URL.replace('api', 'multicloud-console.apps').replace(':6443', '')
        await fastify.register(fastifyReplyFrom, {
            base: acmUrl,
        })

        fastify.all('/multicloud/header/*', (req, res) => {
            req.headers.authorization = `Bearer ${req.cookies['acm-access-token-cookie']}`
            res.from(req.raw.url)
        })

        fastify.all('/cluster-management/header', async (req, res) => {
            let headerResponse: AxiosResponse
            try {
                const isDevelopment = process.env.NODE_ENV === 'development' ? 'true' : 'false'
                headerResponse = await Axios.request({
                    url: `${acmUrl}/multicloud/header/api/v1/header?serviceId=mcm-ui&dev=${isDevelopment}`,
                    method: 'GET',
                    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                    headers: {
                        Authorization: `Bearer ${req.cookies['acm-access-token-cookie']}`,
                    },
                    responseType: 'json',
                    validateStatus: () => true,
                })
            } catch (err) {
                return res.code(500).send(err)
            }
            return res.code(headerResponse.status).send(headerResponse?.data)
        })
    }

    fastify.get('/cluster-management/proxy/*', proxy)
    fastify.put('/cluster-management/proxy/*', proxy)
    fastify.post('/cluster-management/proxy/*', proxy)
    fastify.patch('/cluster-management/proxy/*', proxy)
    fastify.delete('/cluster-management/proxy/*', proxy)

    fastify.get('/cluster-management/namespaced/*', async (req, res) => {
        try {
            const token = req.cookies['acm-access-token-cookie']
            if (!token) return res.code(401).send()

            let url = req.url.substr('/cluster-management/namespaced'.length)
            let query = ''
            let namespaceQuery = ''
            if (url.includes('?')) {
                query = url.substr(url.indexOf('?'))
                url = url.substr(0, url.indexOf('?'))

                // in certain cases we only want to query managed namespaces only for performance
                const parsedQuery = querystring.parse(query)
                if (parsedQuery['managedNamespacesOnly']) {
                    namespaceQuery = '?labelSelector="cluster.open-cluster-management.io/managedCluster"'
                    delete parsedQuery['managedNamespacesOnly']
                    query = querystring.stringify(parsedQuery)
                }
            }

            // Try the query at a cluster scope in case the use has permissions
            const clusteredRequestPromise = kubeRequest(token, req.method, process.env.CLUSTER_API_URL + url + query)

            // Query the projects (namespaces) the user can see in parallel in case the above fails.
            const projectsRequestPromise = kubeRequest<{
                items: { metadata: { name: string } }[]
            }>(
                token,
                req.method,
                process.env.CLUSTER_API_URL + '/apis/project.openshift.io/v1/projects' + namespaceQuery
            )

            try {
                const clusteredRequest = await clusteredRequestPromise
                if (clusteredRequest.status < 400) return res.code(clusteredRequest.status).send(clusteredRequest.data)
            } catch {
                // DO NOTHING - WILL QUERY BY PROJECTS
            }

            const projectsRequest = await projectsRequestPromise
            const promises = projectsRequest.data.items.map((project) => {
                const parts = url.split('/')
                const plural = parts[parts.length - 1]
                const path = parts.slice(0, parts.length - 1).join('/')
                const finalUrl =
                    process.env.CLUSTER_API_URL + path + '/namespaces/' + project.metadata.name + '/' + plural + query
                return kubeRequest<{ items: { metadata: { name: string } }[] }>(token, req.method, finalUrl)
            })

            const results = await Promise.all(promises)
            return res.code(200).send({ items: results.flatMap((r) => r.data.items).filter((i) => i != null) })
        } catch (err) {
            logError('namespaced error', err, { method: req.method, url: req.url })
            void res.code(500).send()
        }
    })

    await fastify.register(fastifyCookie)
    fastify.addHook('onRequest', (request, reply, done) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ;(request as any).start = process.hrtime()
        done()
    })

    fastify.addHook('onResponse', (request, reply, done) => {
        switch (request.url) {
            case '/ping':
                break
            default:
                {
                    let url = request.url
                    if (url.includes('?')) {
                        url = url.substr(0, url.indexOf('?'))
                    }
                    let msg: { [key: string]: any }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    const operationName = (request.body as any)?.operationName as string
                    if (operationName) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        const query = (request.body as any)?.query as unknown
                        msg = { msg: STATUS_CODES[reply.statusCode] }
                        msg.operation = operationName

                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        // const variables = (request.body as any)?.variables as Record<string, unknown>
                        // if (variables && Object.keys(variables).length !== 0) {
                        //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        //     msg = { ...msg, ...variables }
                        // }
                    } else {
                        msg = {
                            msg: STATUS_CODES[reply.statusCode],
                            status: reply.statusCode,
                            method: request.method,
                            url,
                        }

                        // if (request.query && Object.keys(request.query).length !== 0) {
                        //     msg.query = request.query
                        // }
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
                    const start = (request as any).start
                    const diff = process.hrtime(start)
                    const time = Math.round((diff[0] * 1e9 + diff[1]) / 10000) / 100
                    msg.ms = time

                    if (reply.statusCode < 400) {
                        logger.info(msg)
                    } else if (reply.statusCode < 500) {
                        logger.warn(msg)
                    } else {
                        logger.error(msg)
                    }
                }
                break
        }
        done()
    })

    if (!process.env.GENERATE) {
        // GET .well-known/oauth-authorization-server from the CLUSTER API for oauth
        const response = await Axios.get<{ authorization_endpoint: string; token_endpoint: string }>(
            `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`,
            {
                httpsAgent: new https.Agent({ rejectUnauthorized: false }),
                headers: { Accept: 'application/json' },
                responseType: 'json',
            }
        )

        const authorizeUrl = new URL(response.data.authorization_endpoint)
        const tokenUrl = new URL(response.data.token_endpoint)
        const validStates = new Set()
        await fastify.register(fastifyOauth2, {
            name: 'openshift',
            scope: ['user:full'],
            credentials: {
                client: {
                    id: process.env.OAUTH2_CLIENT_ID,
                    secret: process.env.OAUTH2_CLIENT_SECRET,
                },
                auth: {
                    authorizeHost: `${authorizeUrl.protocol}//${authorizeUrl.hostname}`,
                    authorizePath: authorizeUrl.pathname,
                    tokenHost: `${tokenUrl.protocol}//${tokenUrl.hostname}`,
                    tokenPath: tokenUrl.pathname,
                },
            },
            // register a url to start the redirect flow
            startRedirectPath: '/cluster-management/login',
            // oauth redirect here after the user login
            callbackUri: process.env.OAUTH2_REDIRECT_URL,
            generateStateFunction: (request: FastifyRequest) => {
                const query = request.query as { code: string; state: string }
                const state = query.state
                validStates.add(state)
                return state
            },
            checkStateFunction: (returnedState: string, callback: (error?: Error) => void) => {
                if (validStates.has(returnedState)) {
                    validStates.delete(returnedState)
                    callback()
                    return
                }
                callback(new Error('Invalid state'))
            },
        })

        fastify.get('/cluster-management/login/callback', async function (request, reply) {
            const query = request.query as { code: string; state: string }
            validStates.add(query.state)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const openshift = ((this as unknown) as any).openshift as OAuth2Namespace
            const token = await openshift.getAccessTokenFromAuthorizationCodeFlow(request)
            return reply
                .setCookie('acm-access-token-cookie', `${token.access_token}`, {
                    path: '/',
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: token.expires_in,
                })
                .redirect(`${process.env.FRONTEND_URL}`)
        })

        fastify.delete('/cluster-management/login', async function (request, reply) {
            const token = request.cookies['acm-access-token-cookie']
            if (token) {
                await Axios.delete(
                    `${process.env.CLUSTER_API_URL}/apis/oauth.openshift.io/v1/oauthaccesstokens/${token}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )
                return reply.code(200).send()
            }
        })
    }

    await fastify.register(fastifyCompress)

    fastify.setNotFoundHandler((request, response) => {
        if (!path.extname(request.url)) {
            void response.code(200).sendFile('index.html', join(__dirname, 'public'))
        } else {
            void response.code(404).send()
        }
    })
    await fastify.register(fastifyStatic, {
        root: join(__dirname, 'public'),
        prefix: '/cluster-management/', // optional: default '/'
    })

    fastify.addHook('onClose', (instance, done: () => void) => {
        logger.debug('server closed')
        setTimeout(function () {
            logger.error('shutdown timeout')
            // eslint-disable-next-line no-process-exit
            process.exit(1)
        }, 60 * 1000).unref()
        done()
    })

    await new Promise<void>((resolve, reject) => {
        fastify.listen(
            process.env.PORT ? Number(process.env.PORT) : undefined,
            '0.0.0.0',
            (err: Error, address: string) => {
                if (process.env.GENERATE) {
                    void fastify.close()
                }
                if (err) {
                    logger.error(err)
                    // eslint-disable-next-line no-process-exit
                    process.exit(1)
                } else {
                    logger.info({ msg: 'server started', address })
                    resolve()
                }
            }
        )
    })

    process.on('SIGTERM', () => {
        logger.debug({ msg: 'process SIGTERM' })
        logger.debug({ msg: 'closing server' })
        void fastify.close()
        if (process.env.NODE_ENV !== 'test') {
            setTimeout(function () {
                logger.error({ msg: 'shutdown timeout' })
                // eslint-disable-next-line no-process-exit
                process.exit(1)
            }, 10 * 1000).unref()
        }
    })

    process.on('SIGINT', () => {
        // eslint-disable-next-line no-console
        console.log()
        logger.debug({ msg: 'process SIGINT' })
        logger.debug({ msg: 'closing server' })
        void fastify.close()
        if (process.env.NODE_ENV !== 'test') {
            setTimeout(function () {
                logger.error({ msg: 'shutdown timeout' })
                // eslint-disable-next-line no-process-exit
                process.exit(1)
            }, 10 * 1000).unref()
        }
    })

    process.on('uncaughtException', (err) => {
        logger.error({ msg: `process uncaughtException`, error: err.message })
        logger.debug({ msg: 'closing server' })
        void fastify.close()
    })

    process.on('multipleResolves', (type, promise, reason) => {
        logger.error({ msg: 'process multipleResolves', type })
        void fastify.close()
    })

    process.on('unhandledRejection', (reason, promise) => {
        logger.error({ msg: 'process unhandledRejection', reason })
        void fastify.close()
    })

    return fastify
}
