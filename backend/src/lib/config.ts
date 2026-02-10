/* Copyright Contributors to the Open Cluster Management project */
/* istanbul ignore file */
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'
import { SettingsEvent } from '../routes/events'
import { watchFile } from './fileWatch'
import { logger } from './logger'
import { ServerSideEvents } from './server-side-events'

let settingsEventID = 0

export async function loadSettings(): Promise<void> {
  const paths = await loadConfigSettings()
  for (const filePath of paths) {
    watchFile(
      filePath,
      () => {
        void loadConfigSettings()
      },
      true
    )
  }
}

export async function loadConfigSettings(): Promise<string[]> {
  const settings: Record<string, string> = {}
  const readPaths: string[] = []
  try {
    const filenames = await readdir('./config')
    for (const filename of filenames) {
      try {
        const filePath = join('./config', filename)
        const stats = await stat(filePath)
        if (stats.isDirectory()) continue
        const contents = await readFile(filePath)
        settings[filename] = contents.toString()
        readPaths.push(filePath)
      } catch (err) {
        // Do Nothing
      }
    }
    for (const key in settings) {
      if (key.startsWith('LOG_') || key.startsWith('APP_SEARCH_')) {
        process.env[key] = settings[key]
      } else if (key === 'globalSearchFeatureFlag') {
        // Global search tech-preview requires feature flag toggle (2.11)
        process.env[key] = settings[key]
      }
    }
    if (process.env['globalSearchFeatureFlag'] && !settings['globalSearchFeatureFlag']) {
      // If globalSearchFeatureFlag is set but has been removed from config settings -> removing env var.
      delete process.env['globalSearchFeatureFlag']
    }
    if (settings.LOG_LEVEL) {
      logger.level = settings.LOG_LEVEL
    }
    const data: SettingsEvent = { type: 'SETTINGS', settings }
    if (settingsEventID) ServerSideEvents.removeEvent(settingsEventID)
    settingsEventID = await ServerSideEvents.pushEvent({ data })
    logger.info({ msg: 'loaded settings', settings })
  } catch (err) {
    // Do Nothing
  }
  return readPaths
}
