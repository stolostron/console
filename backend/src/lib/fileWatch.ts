/* Copyright Contributors to the Open Cluster Management project */

import { FSWatcher, watch } from 'node:fs'
import { logger } from './logger'

type WatchEntry = {
  watcher: FSWatcher | undefined
  callbacks: Set<() => void>
  timeout: NodeJS.Timeout | undefined
  persist: boolean
}

const watchers = new Map<string, WatchEntry>()
const DEBOUNCE_MS = 1000

/**
 * Watches the file at filePath and invokes onChange when it changes (debounced).
 * Watch is only started on the first call for a given path.
 * When persist is false (default), the watch is removed after the first change so the next access will re-register.
 * When persist is true, the watch remains active.
 * If the file does not exist, watching is skipped (no error).
 */
export function watchFile(filePath: string, onChange: () => void, persist = false): void {
  let entry = watchers.get(filePath)
  if (!entry) {
    const callbacks = new Set<() => void>()
    let watcher: FSWatcher | undefined
    try {
      watcher = watch(filePath, (_eventType, _filename) => {
        const current = watchers.get(filePath)
        if (!current) return
        if (current.timeout) clearTimeout(current.timeout)
        current.timeout = setTimeout(() => {
          current.timeout = undefined
          for (const cb of current.callbacks) {
            try {
              cb()
            } catch (err: unknown) {
              logger.error({ msg: 'file watch callback error', filePath, err })
            }
          }
          if (!current.persist) {
            const toRemove = watchers.get(filePath)
            if (toRemove) {
              if (toRemove.watcher) toRemove.watcher.close()
              watchers.delete(filePath)
            }
          }
        }, DEBOUNCE_MS)
      })
      logger.debug({ msg: 'watching file', filePath })
    } catch (err: unknown) {
      logger.debug({ msg: 'skipping watch for missing or inaccessible file', filePath, err })
    }
    entry = { watcher, callbacks, timeout: undefined, persist }
    watchers.set(filePath, entry)
  }
  entry.callbacks.add(onChange)
}

/**
 * Stops all file watches and clears registered callbacks.
 * Call this on application shutdown.
 */
export function stopFileWatches(): void {
  for (const entry of watchers.values()) {
    if (entry.watcher) {
      entry.watcher.close()
    }
    if (entry.timeout) {
      clearTimeout(entry.timeout)
    }
  }
  watchers.clear()
  logger.debug({ msg: 'stopped file watches' })
}
