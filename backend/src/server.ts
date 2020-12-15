/* istanbul ignore file */

import { readFileSync } from 'fs'
import { createServer as createHttpServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http'
import { createServer as createHttpsServer } from 'https'
import { Socket } from 'net'
import { TLSSocket } from 'tls'
import { logger } from './logger'

export type Server = HttpServer
export type Request = IncomingMessage
export type Response = ServerResponse

let server: Server

interface ISocketRequests {
    socketID: number
    activeRequests: number
}

let nextSocketID = 0
const sockets: { [id: string]: Socket | TLSSocket | undefined } = {}

export function startServer(
    requestHandler: (req: IncomingMessage, res: ServerResponse) => void
): Promise<Server | undefined> {
    let cert: Buffer | undefined
    let key: Buffer | undefined
    try {
        cert = readFileSync('certs/tls.crt')
        key = readFileSync('certs/tls.key')
    } catch {
        // Going to use http instead of https
    }

    try {
        if (cert && key) {
            logger.debug('server start', 'https=true')
            server = createHttpsServer({ cert, key }, requestHandler)
        } else {
            logger.debug('server start', 'https=false')
            server = createHttpServer(requestHandler)
        }
        return new Promise((resolve, reject) => {
            server
                .listen(process.env.PORT, () => {
                    const address = server.address()
                    if (address === null) {
                        logger.debug(`server listening`)
                    } else if (typeof address === 'string') {
                        logger.debug(`server listening`, address)
                    } else {
                        logger.debug(`server listening`, `port=${address.port}`)
                    }
                    resolve(server)
                })
                .on('connection', (socket) => {
                    let socketID = nextSocketID++
                    while (sockets[socketID] !== undefined) socketID = nextSocketID++
                    sockets[socketID] = socket
                    ;((socket as unknown) as ISocketRequests).socketID = socketID
                    ;((socket as unknown) as ISocketRequests).activeRequests = 0
                    socket.on('close', () => {
                        const socketID = ((socket as unknown) as ISocketRequests).socketID
                        if (socketID < nextSocketID) nextSocketID = socketID
                        sockets[socketID] = undefined
                    })
                })
                .on('request', (req: IncomingMessage, res: ServerResponse) => {
                    const start = process.hrtime()
                    const socket = (req.socket as unknown) as ISocketRequests
                    socket.activeRequests++
                    req.on('close', () => {
                        socket.activeRequests--
                        if (isShuttingDown) {
                            req.socket.destroy()
                        }

                        const contentType = res.getHeader('content-type')
                        if (contentType !== 'text/event-stream') {
                            const diff = process.hrtime(start)
                            const time = Math.round((diff[0] * 1e9 + diff[1]) / 1000000)

                            if (res.statusCode < 500) {
                                logger.info(res.statusCode, `${time}ms`.padStart(6), req.method.padStart(5), req.url)
                            } else {
                                logger.error(res.statusCode, `${time}ms`.padStart(6), req.method.padStart(5), req.url)
                            }
                        }
                    })
                })
                .on('error', (err: NodeJS.ErrnoException) => {
                    if (err.code === 'EADDRINUSE') {
                        logger.error(`server error`, `error=address already in use`)
                        reject(undefined)
                    } else {
                        logger.error(
                            `server error`,
                            `name="${err.name}"`,
                            `error="${err.message}"`,
                            `code="${err.code}"`
                        )
                    }
                    if (server.listening) server.close()
                })
        })
    } catch (err) {
        if (err instanceof Error) {
            logger.error(`server start error`, `name="${err.name}"`, `error="${err.message}"`)
        } else {
            logger.error(`server start error`)
        }
        void stopServer()
        return Promise.resolve<undefined>(undefined)
    }
}

let isShuttingDown = false

export async function stopServer(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
        process.exit(1)
    }

    if (isShuttingDown) return
    isShuttingDown = true

    for (const socketID of Object.keys(sockets)) {
        const socket = sockets[socketID]
        if (socket !== undefined) {
            if (((socket as unknown) as ISocketRequests).activeRequests === 0) {
                socket.destroy()
            }
        }
    }

    if (server?.listening) {
        logger.info(`server closing`)
        await new Promise<undefined>((resolve) =>
            server.close((err: Error | undefined) => {
                if (err) {
                    logger.error(`server close error`, `name="${err.name}"`, `error="${err.message}"`)
                } else {
                    logger.info(`server closed`)
                }
                resolve(undefined)
            })
        )
    }
}
