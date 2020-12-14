export const logger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: console.error,
}

console.log(process.env.LOG_LEVEL)
switch (process.env.LOG_LEVEL) {
    case 'DEBUG':
        logger.debug = console.debug
        logger.info = console.info
        logger.warn = console.warn
        logger.error = console.error
        break
    case 'INFO':
    default:
        logger.info = console.info
        logger.warn = console.warn
        logger.error = console.error
        break
    case 'WARN':
        logger.warn = console.warn
        logger.error = console.error
        break
}

function noop(...args: any[]): void {
    // Do Nothing
}
