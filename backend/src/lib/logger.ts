/* istanbul ignore file */

import * as pino from 'pino'

const options: pino.LoggerOptions = {
    safe: false,
    base: {
        // app: process.env.APP,
        // instance: process.pid,
        // region: process.env.REGION,
        // version: process.env.VERSION,
    },
    level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug',
    formatters: {
        level(label: string, _number: number) {
            return { level: label }
        },
    },
}

let stream: pino.DestinationStream | undefined
let timeout: NodeJS.Timeout | undefined
if (process.env.NODE_ENV === 'production') {
    stream = pino.destination({ sync: false })
    timeout = setInterval(function loggerFlush() {
        logger.flush()
    }, 5 * 1000)
}

export const logger: pino.Logger = stream ? pino(options, stream) : pino(options)

export function stopLogger(): void {
    if (timeout != undefined) {
        clearInterval(timeout)
        timeout = undefined
    }
    if (stream != undefined) {
        pino.final(logger, (err, finalLogger, _evt) => {
            if (err) finalLogger.error(err, 'error caused exit')
            finalLogger.flush()
        })(null)
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
        logger.info({ msg: 'Unknown LOG_LEVEL', level: process.env.LOG_LEVEL })
        break
}

export const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug'
