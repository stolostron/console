/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */

import { logger } from './logger'

function logMemory() {
    const used = process.memoryUsage()
    logger.debug(
        Object.keys(used).reduce(
            (result, key) => {
                result[key] = `${Math.round(((used as unknown) as Record<string, number>)[key] / 1024 / 1024)} MB`
                return result
            },
            { msg: 'memory' } as Record<string, string>
        )
    )
    setTimeout(logMemory, 60 * 1000).unref()

    // try {
    //     global.gc()
    // } catch (e) {
    //     console.log('`node --expose-gc index.js`')
    //     process.exit()
    // }
}

export function startLoggingMemory(): void {
    setTimeout(logMemory, 10 * 1000).unref()
}
