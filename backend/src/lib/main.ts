/* Copyright Contributors to the Open Cluster Management project */
import { config } from 'dotenv'
try {
    config({ path: '.env' })
} catch (err) {
    // Do Nothing
}

/* istanbul ignore file */
import { cpus, totalmem } from 'os'
import { logger } from './logger'
import { start, stop } from '../app'

logger.info({
    msg: `process start`,
    NODE_ENV: process.env.NODE_ENV,
    cpus: `${Object.keys(cpus()).length}`,
    memory: `${(totalmem() / (1024 * 1024 * 1024)).toPrecision(2).toString()}GB`,
    nodeVersion: `${process.versions.node}`,
})

process.on('exit', function processExit(code) {
    if (code !== 0) {
        logger.error({ msg: `process exit`, code: code })
    } else {
        logger.info({ msg: `process exit`, code: code })
    }
})

process.on('SIGINT', () => {
    // eslint-disable-next-line no-console
    console.log()
    logger.info({ msg: 'process SIGINT' })
    void stop()
})

process.on('SIGTERM', () => {
    logger.info({ msg: 'process SIGTERM' })
    void stop()
})

process.on('uncaughtException', (err) => {
    logger.error({ msg: `process uncaughtException`, error: err.message })
    console.log(err.stack)
})

process.on('multipleResolves', (type, _promise, reason) => {
    // node-fetch throws multipleResolves on aborted resolved request
    if ((reason as { type?: string }).type === 'aborted') return
    logger.error({ msg: 'process multipleResolves', type, reason: reason as unknown })
})

process.on('unhandledRejection', (reason, _promise) => {
    logger.error({ msg: 'process unhandledRejection', reason })
})

void start()
