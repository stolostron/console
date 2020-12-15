/* istanbul ignore file */
import { readFileSync } from 'fs'
if (process.env.NODE_ENV === 'development') {
    try {
        const lines = readFileSync('.env').toString().split('\n')
        for (const line of lines) {
            const parts = line.split('=')
            if (parts.length === 2) {
                process.env[parts[0]] = parts[1]
            }
        }
    } catch (err) {
        // Do Nothing
    }
}

import { requestHandler } from './app'
import { startServer, stopServer } from './server'
import { logger } from './logger'

logger.debug(`process start  NODE_ENV=${process.env.NODE_ENV}  nodeVersion=${process.versions.node}`)

for (const variable of ['CLUSTER_API_URL', 'OAUTH2_REDIRECT_URL', 'BACKEND_URL', 'FRONTEND_URL']) {
    if (!process.env[variable]) throw new Error(`${variable} required`)
    logger.debug(`process env  ${variable}=${process.env[variable]}`)
}

process
    .on('SIGINT', (signal) => {
        process.stdout.write('\n')
        logger.debug('process ' + signal)
        void stopServer()
    })
    .on('SIGTERM', (signal) => {
        logger.debug('process ' + signal)
        void stopServer()
    })
    .on('uncaughtException', (err) => {
        logger.error('process uncaughtException', err)
        void stopServer()
    })
    .on('multipleResolves', (type, promise, reason) => {
        logger.error('process multipleResolves', 'type', type, 'reason', reason)
        void stopServer()
    })
    .on('unhandledRejection', (reason, promise) => {
        logger.error('process unhandledRejection', 'reason', reason)
        void stopServer()
    })
    .on('exit', function processExit(code) {
        logger.debug(`process exit${code ? `  code=${code}` : ''}`)
    })

void startServer(requestHandler)
