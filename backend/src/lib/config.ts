/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { config } from 'dotenv'
import { FSWatcher, watch } from 'fs'
import { SettingsEvent } from '../routes/events'
import { logger } from './logger'
import { ServerSideEvents } from './server-side-events'

let settingsEventID = 0
let watcher: FSWatcher
export function loadSettings(): void {
    loadConfigSettings()
    watcher = watch('./config', (eventType, filename) => {
        loadConfigSettings()
    })
}

export function stopSettingsWatch(): void {
    if (watcher) {
        watcher.close()
        watcher = undefined
    }
}

let settings: Record<string, string>

export function loadConfigSettings(): void {
    try {
        const configOutput = config({ path: './config/settings' })
        if (settings) {
            if (Object.keys(settings).length === Object.keys(configOutput.parsed).length) {
                let change = false
                for (const key in settings) {
                    if (settings[key] !== configOutput.parsed[key]) {
                        change = true
                        break
                    }
                }
                if (!change) return
            }
        }
        settings = configOutput.parsed
        if (settings.LOG_LEVEL) {
            logger.level = settings.LOG_LEVEL
        }
        const data: SettingsEvent = { type: 'SETTINGS', settings }
        if (settingsEventID) ServerSideEvents.removeEvent(settingsEventID)
        settingsEventID = ServerSideEvents.pushEvent({ data })
        logger.info({ msg: 'loaded settings', settings })
    } catch (err) {
        // Do Nothing
    }
}
