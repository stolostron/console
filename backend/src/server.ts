/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpError } from '@kubernetes/client-node'
import Axios, { AxiosResponse, Method } from 'axios'
import { fastify as Fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyCompress from 'fastify-compress'
import fastifyCookie from 'fastify-cookie'
import fastifyCors from 'fastify-cors'
import { fastifyOauth2, OAuth2Namespace } from 'fastify-oauth2'
import fastifyStatic from 'fastify-static'
import { readFile } from 'fs'
import { GraphQLError } from 'graphql'
import { STATUS_CODES } from 'http'
import * as https from 'https'
import fastifyGQL from 'mercurius'
import * as path from 'path'
import { join } from 'path'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { URL } from 'url'
import { promisify } from 'util'
import { BareMetalAssetResolver } from './entities/bare-metal-asset'
import { ClusterDeploymentResolver } from './entities/cluster-deployment'
import { ClusterImageSetResolver } from './entities/cluster-image-set'
import { ClusterManagementAddOnResolver } from './entities/cluster-management-addon'
import { MetadataResolver } from './entities/common/metadata'
import { ManagedClusterResolver } from './entities/managed-cluster'
import { NamespaceResolver } from './entities/namespace'
import { ProviderConnectionsResolver } from './entities/provider-connection'
import { SecretResolver } from './entities/secret'
import { logError, logger } from './lib/logger'
import { IUserContext } from './lib/user-context'

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
                    case 200: // OK
                    case 201: // Created
                    case 204: // No Content
                    case 304: // Not Modified
                        return response
                    case 429:
                        if (tries > 0) {
                            await new Promise((resolve) => setTimeout(resolve, 100))
                        }
                        break
                    default:
                        if (response.status < 200 || response.status >= 300) {
                            throw response // to catch block
                        }
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
            void res.code(500).send()
        }
    }

    fastify.all('/cluster-management/proxy/*', proxy)

    fastify.get('/cluster-management/namespaced/*', async (req, res) => {
        try {
            const token = req.cookies['acm-access-token-cookie']
            if (!token) return res.code(401).send()

            let url = req.url.substr('/cluster-management/namespaced'.length)
            let query = ''
            if (url.includes('?')) {
                query = url.substr(url.indexOf('?'))
                url = url.substr(0, url.indexOf('?'))
            }

            const clusteredRequestPromise = kubeRequest(token, req.method, process.env.CLUSTER_API_URL + url + query)

            const projectsRequestPromise = kubeRequest<{
                items: { metadata: { name: string } }[]
            }>(token, req.method, process.env.CLUSTER_API_URL + '/apis/project.openshift.io/v1/projects')

            try {
                const clusteredRequest = await clusteredRequestPromise
                return res.code(200).send(clusteredRequest.data)
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
            return res.code(200).send({ items: results.map((r) => r.data.items).flat() })
        } catch (err) {
            logError('namespaced error', err, { method: req.method, url: req.url })
            void res.code(500).send()
        }
    })

    if (process.env.NODE_ENV !== 'production') {
        await fastify.register(fastifyCors, {
            origin: true,
            methods: ['GET', 'PUT', 'POST', 'DELETE'],
            credentials: true,
        })
    }

    await fastify.register(fastifyCookie)
    fastify.addHook('onRequest', (request, reply, done) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ;(request as any).start = process.hrtime()
        done()
    })

    fastify.addHook('onResponse', (request, reply, done) => {
        if (request.method === 'OPTIONS') {
            done()
            return
        }
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
                headers: {
                    Accept: 'application/json',
                    // Authorization: `Bearer ${process.env.CLUSTER_API_TOKEN}`,
                },
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
            // const query = request.query as { code: string; state: string }
            // validStates.add(query.state)
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

    // await fastify.register(fastifyHelmet)

    const schema = await buildSchema({
        resolvers: [
            ManagedClusterResolver,
            MetadataResolver,
            SecretResolver,
            ClusterImageSetResolver,
            NamespaceResolver,
            ClusterDeploymentResolver,
            ProviderConnectionsResolver,
            ClusterManagementAddOnResolver,
            BareMetalAssetResolver,
        ],
        emitSchemaFile: !['production', 'test'].includes(process.env.NODE_ENV),
    })
    await fastify.register(fastifyGQL, {
        path: '/cluster-management/graphql',
        graphiql: 'playground',
        schema,
        jit: 1,
        context: (request: FastifyRequest, reply: FastifyReply) => {
            const token = request.cookies['acm-access-token-cookie']
            const userContext: IUserContext = { token }
            return Promise.resolve(userContext)
        },
        errorFormatter: (err, ctx) => {
            if (Array.isArray(err.errors)) {
                for (const error of err.errors) {
                    if (error instanceof GraphQLError) {
                        if (error.originalError instanceof HttpError) {
                            switch (error.originalError.statusCode) {
                                case 401:
                                case 403:
                                    return {
                                        statusCode: 401,
                                        response: {},
                                    }
                            }
                        }
                    } else if (error instanceof Error) {
                        logError(error.name, error)
                    } else if (typeof error === 'string') {
                        logger.error({ msg: 'error', error })
                    } else {
                        logger.error(error)
                    }
                }
            }
            return fastifyGQL.defaultErrorFormatter(err, ctx)
        },
    })

    fastify.setNotFoundHandler((request, response) => {
        if (!request.url.startsWith('/cluster-management/graphql') && !path.extname(request.url)) {
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

    await new Promise((resolve, reject) => {
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
