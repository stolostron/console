/* Copyright Contributors to the Open Cluster Management project */
import { config } from 'dotenv'
import { cpus, totalmem } from 'os'
import { start, stop } from '../app'
import { logger } from './logger'

try {
  config({ path: '.env' })
} catch (err) {
  // Do Nothing
}

logger.debug({
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
    logger.debug({ msg: `process exit`, code: code })
  }
})

process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV === 'development') console.log()
  logger.debug({ msg: 'process SIGINT' })
  void stop()
})

process.on('SIGTERM', () => {
  logger.debug({ msg: 'process SIGTERM' })
  void stop()
})

process.on('uncaughtException', (err) => {
  // console.error(err)
  // logger.error({ msg: `process uncaughtException`, error: err.message })
  // console.log(err.stack)
})

process.on('multipleResolves', (type: unknown, _promise, reason: unknown) => {
  // node-fetch throws multipleResolves on aborted resolved request
  if (!reason || (reason as { type?: string }).type === 'aborted') return
  logger.error({ msg: 'process multipleResolves', type, reason })
})

process.on('unhandledRejection', (reason, _promise) => {
  logger.error({ msg: 'process unhandledRejection', reason })
})

void start()
