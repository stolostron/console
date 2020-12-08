/* istanbul ignore file */

import { config } from 'dotenv'
import { requestHandler } from './app'
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

process
    .on('SIGINT', (signal) => {
        process.stdout.write('\n')
        logger.debug({ msg: `process ${signal}` })
        void stopServer()
    })
    .on('SIGTERM', (signal) => {
        logger.debug({ msg: `process ${signal}` })
        void stopServer()
    })
    .on('uncaughtException', (err) => {
        logger.error({ msg: 'process uncaughtException', error: err.message, stack: err.stack })
        void stopServer()
    })
    .on('exit', function processExit(code) {
        if (code !== 0) {
            logger.error({ msg: `process exit`, code })
        } else {
            logger.debug({ msg: `process exit` })
        }
    })

import { startServer, stopServer } from './server'
void startServer(requestHandler)
