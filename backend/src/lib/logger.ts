/* Copyright Contributors to the Open Cluster Management project */
import pino from 'pino'
export const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'debug'

const options: pino.LoggerOptions = { level: logLevel, base: {} }
export const logger = pino(options)
export function stopLogger(): void {
  // do nothing
}
