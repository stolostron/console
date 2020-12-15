/* istanbul ignore file */

export const logger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: console.error,
}

switch (process.env.LOG_LEVEL) {
    case 'DEBUG':
        logger.debug = console.debug
        logger.info = console.info
        logger.warn = console.warn
        break
    case 'INFO':
    default:
        logger.info = console.info
        logger.warn = console.warn
        break
    case 'WARN':
        logger.warn = console.warn
        break
    case 'NONE':
        logger.error = noop
        break
}

function noop(...args: unknown[]): void {
    // Do Nothing
}
