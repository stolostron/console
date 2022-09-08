/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { FSWatcher, watch } from 'fs'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { SettingsEvent } from '../resources/watch'
import { logger } from './logger'
import { broadcast, broadcastSettings } from '../resources/clients'

let watcher: FSWatcher
let timeout: NodeJS.Timeout
export function loadSettings(): void {
    void loadConfigSettings()
    watcher = watch('./config', (eventType, filename) => {
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
            timeout = undefined
            void loadConfigSettings()
        }, 1000)
    })
}

export function stopSettingsWatch(): void {
    if (watcher) {
        watcher.close()
        watcher = undefined
    }
}

export async function loadConfigSettings(): Promise<void> {
    const settings: Record<string, string> = {}
    try {
        const filenames = await readdir('./config')
        for (const filename of filenames) {
            try {
                const stats = await stat(join('./config', filename))
                if (stats.isDirectory()) continue
                const contents = await readFile(join('./config', filename))
                settings[filename] = contents.toString()
            } catch (err) {
                // Do Nothing
            }
        }
        for (const key in settings) {
            if (key.startsWith('LOG_')) {
                process.env[key] = settings[key]
            }
        }
        if (settings.LOG_LEVEL) {
            logger.level = settings.LOG_LEVEL
        }
        const data: SettingsEvent = { type: 'SETTINGS', settings }
        broadcastSettings('SETTINGS', data)
        logger.info({ msg: 'loaded settings', settings })
    } catch (err) {
        // Do Nothing
    }
}
