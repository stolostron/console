/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { logger } from './logger'

function logMemory() {
    const used = process.memoryUsage()
    logger.debug({
        msg: 'memory',
        used: `${Math.round(used.rss / 1024 / 1024)} MB`,
    })
    setTimeout(logMemory, 60 * 1000).unref()
}

export function startLoggingMemory(): void {
    setTimeout(logMemory, 10 * 1000).unref()
}
