/* istanbul ignore file */
import { cpus, totalmem } from 'os'
import { logger, logLevel } from './logger'
import { start, stop } from '../app'

logger.info({
    msg: `process start`,
    NODE_ENV: process.env.NODE_ENV,
    cpus: `${Object.keys(cpus()).length}`,
    memory: `${(totalmem() / (1024 * 1024 * 1024)).toPrecision(2).toString()}GB`,
    nodeVersion: `${process.versions.node}`,
    logLevel: logLevel,
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
    logger.debug({ msg: 'process SIGINT' })
    void stop()
})

process.on('SIGTERM', () => {
    logger.info({ msg: 'process SIGTERM' })
    void stop()
})

process.on('uncaughtException', (err) => {
    logger.error({ msg: `process uncaughtException`, error: err.message })
    void stop()
})

process.on('multipleResolves', (type, _promise, _reason) => {
    logger.error({ msg: 'process multipleResolves', type })
    void stop()
})

process.on('unhandledRejection', (reason, _promise) => {
    logger.error({ msg: 'process unhandledRejection', reason })
    void stop()
})

void start()
