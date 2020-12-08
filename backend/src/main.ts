/* istanbul ignore file */

import { config } from 'dotenv'
config()

import { logger, stopLogger } from './logger'
logger.debug({ msg: `process start`, NODE_ENV: `${process.env.NODE_ENV}`, nodeVersion: `${process.versions.node}` })

if (!process.env.CLUSTER_API_URL) throw new Error('CLUSTER_API_URL required')
logger.debug({ msg: 'environment', CLUSTER_API_URL: process.env.CLUSTER_API_URL })

if (!process.env.OAUTH2_REDIRECT_URL) throw new Error('OAUTH2_REDIRECT_URL required')
logger.debug({ msg: 'environment', OAUTH2_REDIRECT_URL: process.env.OAUTH2_REDIRECT_URL })

if (!process.env.BACKEND_URL) throw new Error('BACKEND_URL required')
logger.debug({ msg: 'environment', BACKEND_URL: process.env.BACKEND_URL })

if (!process.env.FRONTEND_URL) throw new Error('FRONTEND_URL required')
logger.debug({ msg: 'environment', FRONTEND_URL: process.env.FRONTEND_URL })

process.on('exit', function processExit(code) {
    if (code !== 0) logger.error({ msg: `process exit`, code: code })
    else logger.debug({ msg: `process exit` })
    stopLogger()
})

process.on('uncaughtException', (error) => {
    logger.error({ msg: 'process uncaughtException', name: error.name, error: error.message })
    logger.error(error)
    stopLogger()
    process.exit(1)
})

process.on('multipleResolves', (type, promise, reason) => {
    logger.error({ msg: 'process multipleResolves', type })
    stopLogger()
    process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ msg: 'process unhandledRejection', reason })
    stopLogger()
    process.exit(1)
})

import { startServer } from './server'
void startServer()
