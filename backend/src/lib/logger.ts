/* Copyright Contributors to the Open Cluster Management project */
import pino, { TransportSingleOptions } from 'pino'
export const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug'

const transport: TransportSingleOptions | undefined =
    process.env.NODE_ENV === 'development'
        ? { target: 'pino-zen', options: { formatter: { msg: { padStart: 6 } } } }
        : undefined

const options: pino.LoggerOptions = {
    level: logLevel,
    base: {},
    transport,
}
export const logger = pino(options)
export function stopLogger(): void {
    // do nothing
}
