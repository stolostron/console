/* istanbul ignore file */
import { HttpError } from '@kubernetes/client-node'
import * as pino from 'pino'

const options: pino.LoggerOptions = {
    safe: false,
    base: {
        app: process.env.APP,
        instance: process.pid,
        region: process.env.REGION,
        version: process.env.VERSION,
    },
    level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug',
    formatters: {
        level(label: string, number: number) {
            return { level: label }
        },
    },
    redact: ['req.headers.authorization'],
}

let stream: pino.DestinationStream
let timeout: NodeJS.Timeout
if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    stream = pino.destination({ sync: false })
    timeout = setInterval(function loggerFlush() {
        logger.flush()
    }, 5 * 1000)
}

export const logger: pino.Logger = pino(options, stream)

export function stopLogger(): void {
    if (timeout != undefined) {
        clearInterval(timeout)
        timeout = undefined
    }
    if (stream != undefined) {
        pino.final(logger, (err, finalLogger, evt) => {
            if (err) finalLogger.error(err, 'error caused exit')
            finalLogger.flush()
        })(undefined)
        stream = undefined
    }
}

switch (process.env.LOG_LEVEL) {
    case 'trace':
    case 'debug':
    case 'info':
    case 'warn':
    case 'error':
    case 'fatal':
    case 'silent':
    case undefined:
        break
    default:
        logger.debug({ msg: 'Unknown LOG_LEVEL', level: process.env.LOG_LEVEL })
        break
}

export const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug'

export function logError(msg: string, err: unknown, details?: Record<string, unknown>): void {
    if (err instanceof HttpError) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-explicit-any
        const path: string = (err as any).response?.req?.path
        logger.error({ ...{ msg, name: err.name, err: err.message, status: err.statusCode, path }, ...details })
    } else if (err instanceof Error) {
        logger.error({ ...{ msg, name: err.name, err: err.message }, ...details })
    } else {
        logger.error({ ...{ msg }, ...details })
    }
}
