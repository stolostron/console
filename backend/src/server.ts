/* istanbul ignore file */

import { readFileSync } from 'fs'
import { createServer as createHttpServer, IncomingMessage, Server as HttpServer, ServerResponse } from 'http'
import { createServer as createHttpsServer } from 'https'
import { Socket } from 'net'
import { TLSSocket } from 'tls'

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
        /**/
    }

    try {
        if (cert && key) {
            console.log(`server start  https=true`)
            server = createHttpsServer({ cert, key }, requestHandler)
        } else {
            console.log(`server start  https=false`)
            server = createHttpServer(requestHandler)
        }
        return new Promise((resolve, reject) => {
            server
                .listen(process.env.PORT, () => {
                    const address = server.address()
                    if (address === null) {
                        console.log(`server listening`)
                    } else if (typeof address === 'string') {
                        console.log(`server listening  ${address}`)
                    } else {
                        console.log(`server listening  port=${address.port}`)
                    }

                    resolve(server)
                })
                .on('connection', (socket) => {
                    let socketID = nextSocketID++
                    while (sockets[socketID] !== undefined) {
                        socketID = nextSocketID++
                    }
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
                            const time = Math.round((diff[0] * 1e9 + diff[1]) / 10000) / 100
                            if (res.statusCode < 500) {
                                console.info(`${res.statusCode} ${req.method} ${req.url} ${time}ms`)
                            } else {
                                console.error(`${res.statusCode} ${req.method} ${req.url} ${time}ms`)
                            }
                        }
                    })
                })
                .on('error', (err: NodeJS.ErrnoException) => {
                    if (err.code === 'EADDRINUSE') {
                        console.error(`server error  error:address already in use`)
                        reject(undefined)
                    } else {
                        console.error(`server error  name=${err.name}  error=${err.message}  code=${err.code}`)
                    }
                    if (server.listening) server.close()
                })
        })
    } catch (err) {
        if (err instanceof Error) {
            console.error(`server start error  name=${err.name}  error=${err.message}`)
        } else {
            console.error(`server start error`)
        }
        void stopServer()
        return Promise.resolve<undefined>(undefined)
    }
}

let isShuttingDown = false

export async function stopServer(): Promise<void> {
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
        console.log(`closing server`)
        await new Promise<undefined>((resolve) =>
            server.close((err: Error | undefined) => {
                if (err) {
                    console.error(`server close error  name=${err.name}  error=${err.message}`)
                } else {
                    console.log(`server closed`)
                }
                resolve(undefined)
            })
        )
    }
}
