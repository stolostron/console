/* istanbul ignore file */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios from 'axios'
import { fastify as Fastify, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyCompress from 'fastify-compress'
import fastifyCookie from 'fastify-cookie'
import fastifyCors from 'fastify-cors'
import fastifyGQL from 'fastify-gql'
import fastifyHelmet from 'fastify-helmet'
import { fastifyOauth2, OAuth2Namespace } from 'fastify-oauth2'
import fastifyStatic from 'fastify-static'
import { readFile } from 'fs'
import { PubSub } from 'graphql-subscriptions'
import { STATUS_CODES } from 'http'
import * as https from 'https'
import { join } from 'path'
import 'reflect-metadata'
import { buildSchema } from 'type-graphql'
import { URL } from 'url'
import { promisify } from 'util'
import { ClusterDeploymentResolver } from './entities/cluster-deployment'
import { ClusterImageSetResolver } from './entities/cluster-image-set'
import { ManagedClusterResolver } from './entities/managed-cluster'
import { ProviderConnectionsResolver } from './entities/provider-connection'
import { NamespaceResolver } from './entities/namespace'
import { MetadataResolver } from './entities/common/metadata'
import { SecretResolver } from './entities/secret'
import { logError, logger } from './lib/logger'
import { IUserContext } from './lib/user-context'
import { ClusterManagementAddOnResolver } from './entities/cluster-management-addon'

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

    if (process.env.NODE_ENV !== 'production') {
        await fastify.register(fastifyCors, {
            origin: true,
            methods: ['GET', 'PUT', 'POST'],
            credentials: true,
        })
    }

    await fastify.register(fastifyCookie)
    fastify.addHook('onRequest', (request, reply, done) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ;(request as any).start = process.hrtime()

        if (request.url === '/graphql') {
            const token = request.cookies['acm-access-token-cookie']
            if (!token) {
                void reply.code(401).send()
            } else {
                // logger.warn({ msg: 'token', token })
                // setTimeout(() => {
                //     done()
                // }, 5 * 1000)
                done()
            }
        } else {
            done()
        }
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

    // GET .well-known/oauth-authorization-server from the CLUSTER API for oauth
    const response = await Axios.get<{ authorization_endpoint: string; token_endpoint: string }>(
        `${process.env.CLUSTER_API_URL}/.well-known/oauth-authorization-server`,
        {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${process.env.CLUSTER_API_TOKEN}`,
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
        startRedirectPath: '/login',
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
                callback()
                return
            }
            callback(new Error('Invalid state'))
        },
    })

    fastify.get('/login/callback', async function (request, reply) {
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

    fastify.delete('/login', async function (request, reply) {
        const token = request.cookies['acm-access-token-cookie']
        if (token) {
            await Axios.delete(`${process.env.CLUSTER_API_URL}/apis/oauth.openshift.io/v1/oauthaccesstokens/${token}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            return reply.code(200).send()
        }
    })

    await fastify.register(fastifyCompress)

    await fastify.register(fastifyHelmet)

    // await fastify.register(fastifyEtag)

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
        ],
        emitSchemaFile: true,
    })
    await fastify.register(fastifyGQL, {
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
                    if (error instanceof Error) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
                        const originalError = (error as any).originalError
                        if (originalError) {
                            logError(error.name, originalError)
                        } else {
                            logError(error.name, error)
                        }
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

    // fastify.setNotFoundHandler((request, response) => {
    //     void response.code(200).sendFile('index.html', join(__dirname, '../public'))
    // })
    await fastify.register(fastifyStatic, {
        root: join(__dirname, '../public'),
        // prefix: '/public/', // optional: default '/'
    })

    fastify.addHook('onClose', (instance, done: () => void) => {
        logger.debug('server closed')
        setTimeout(function () {
            logger.error('shutdown timeout')
            // eslint-disable-next-line no-process-exit
            process.exit(1)
        }, 5 * 1000).unref()
        done()
    })

    await new Promise((resolve, reject) => {
        fastify.listen(
            process.env.PORT ? Number(process.env.PORT) : undefined,
            '0.0.0.0',
            (err: Error, address: string) => {
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
