/* Copyright Contributors to the Open Cluster Management project */
import { createHash } from 'node:crypto'
import { logger } from '../lib/logger'

export const ACCESS_CACHE_TTL = 60 * 1000 // 60 seconds
export const ACCESS_CACHE_CLEANUP_INTERVAL = 90 * 1000 // 90 seconds
export const ACCESS_CACHE_MAX_TOKENS = 1000 // Maximum number of token entries to keep
export const ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN = 2000 // Cap RBAC keys retained per token

export interface TimedCacheEntry<T> {
  time: number
  promise: Promise<T>
}

const accessCache: Record<string, Record<string, TimedCacheEntry<boolean>>> = {}
const subjectRulesCache: Record<string, TimedCacheEntry<unknown>> = {}
const kindGetAccessCache: Record<string, TimedCacheEntry<unknown>> = {}

let accessCacheCleanupTimer: NodeJS.Timeout | undefined

/** Hash bearer tokens so the access cache does not retain full JWTs as object keys. */
export function hashAccessToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Clear all cached RBAC access checks. Used for test isolation. */
export function resetAccessCache() {
  for (const key in accessCache) {
    delete accessCache[key]
  }
  for (const key in subjectRulesCache) {
    delete subjectRulesCache[key]
  }
  for (const key in kindGetAccessCache) {
    delete kindGetAccessCache[key]
  }
}

export function getAccessCache() {
  return accessCache
}

function enforceAccessCacheEntryCap(tokenCache: Record<string, TimedCacheEntry<boolean>>) {
  const keys = Object.keys(tokenCache)
  if (keys.length <= ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN) return
  keys.sort((a, b) => tokenCache[a].time - tokenCache[b].time)
  const toRemove = keys.length - ACCESS_CACHE_MAX_ENTRIES_PER_TOKEN
  for (let i = 0; i < toRemove; i++) {
    delete tokenCache[keys[i]]
  }
}

function expireTimedEntries<T extends { time: number }>(cache: Record<string, T>, cutoffTime: number) {
  for (const key in cache) {
    if (cache[key].time < cutoffTime) {
      delete cache[key]
    }
  }
}

/** Prune one token's SSAR entries; returns newest remaining time, or undefined if the token was removed. */
function pruneAccessCacheToken(
  token: string,
  tokenCache: Record<string, TimedCacheEntry<boolean>>,
  cutoffTime: number
): number | undefined {
  let newestTime = 0

  for (const key in tokenCache) {
    if (tokenCache[key].time < cutoffTime) {
      delete tokenCache[key]
    } else if (tokenCache[key].time > newestTime) {
      newestTime = tokenCache[key].time
    }
  }

  if (Object.keys(tokenCache).length === 0) {
    delete accessCache[token]
    return undefined
  }

  enforceAccessCacheEntryCap(tokenCache)
  return newestTime
}

export function cleanupAccessCache() {
  const cutoffTime = Date.now() - ACCESS_CACHE_TTL
  const tokenStats: Array<{ token: string; newestTime: number }> = []

  for (const token in accessCache) {
    const newestTime = pruneAccessCacheToken(token, accessCache[token], cutoffTime)
    if (newestTime !== undefined) {
      tokenStats.push({ token, newestTime })
    }
  }

  expireTimedEntries(subjectRulesCache, cutoffTime)
  expireTimedEntries(kindGetAccessCache, cutoffTime)

  if (tokenStats.length <= ACCESS_CACHE_MAX_TOKENS) return

  tokenStats.sort((a, b) => a.newestTime - b.newestTime)
  const tokensToRemove = tokenStats.length - ACCESS_CACHE_MAX_TOKENS
  for (let i = 0; i < tokensToRemove; i++) {
    delete accessCache[tokenStats[i].token]
  }
}

export function startAccessCacheCleanup() {
  if (accessCacheCleanupTimer) return

  accessCacheCleanupTimer = setInterval(() => {
    try {
      cleanupAccessCache()
    } catch (err: unknown) {
      logger.error({ msg: 'accessCache cleanup failed', error: err })
    }
  }, ACCESS_CACHE_CLEANUP_INTERVAL)

  accessCacheCleanupTimer.unref()
  logger.info({ msg: 'accessCache cleanup started', interval: ACCESS_CACHE_CLEANUP_INTERVAL })
}

export function stopAccessCacheCleanup() {
  if (accessCacheCleanupTimer) {
    clearInterval(accessCacheCleanupTimer)
    accessCacheCleanupTimer = undefined
    logger.info({ msg: 'accessCache cleanup stopped' })
  }
}

export function getSsarCacheEntry(tokenKey: string, key: string): TimedCacheEntry<boolean> | undefined {
  const existing = accessCache[tokenKey]?.[key]
  if (existing && existing.time > Date.now() - ACCESS_CACHE_TTL) {
    return existing
  }
  return undefined
}

export function setSsarCacheEntry(tokenKey: string, key: string, entry: TimedCacheEntry<boolean>) {
  if (!accessCache[tokenKey]) accessCache[tokenKey] = {}
  accessCache[tokenKey][key] = entry
  enforceAccessCacheEntryCap(accessCache[tokenKey])
}

export function replaceSsarCachePromise(
  tokenKey: string,
  key: string,
  inFlightPromise: Promise<boolean>,
  allowed: boolean
) {
  const entry = accessCache[tokenKey]?.[key]
  if (entry?.promise === inFlightPromise) {
    entry.promise = Promise.resolve(allowed)
  }
}

export function getTimedCacheEntry<T>(
  cacheKey: string,
  cache: Record<string, TimedCacheEntry<unknown>>
): TimedCacheEntry<T> | undefined {
  const existing = cache[cacheKey]
  if (existing && existing.time > Date.now() - ACCESS_CACHE_TTL) {
    return existing as TimedCacheEntry<T>
  }
  return undefined
}

export function setTimedCacheEntry<T>(
  cacheKey: string,
  cache: Record<string, TimedCacheEntry<unknown>>,
  entry: TimedCacheEntry<T>
) {
  cache[cacheKey] = entry
}

export function deleteTimedCacheEntry(cacheKey: string, cache: Record<string, TimedCacheEntry<unknown>>) {
  delete cache[cacheKey]
}

export function getSubjectRulesCacheStore() {
  return subjectRulesCache
}

export function getKindGetAccessCacheStore() {
  return kindGetAccessCache
}
