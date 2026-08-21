/* Copyright Contributors to the Open Cluster Management project */
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { FleetK8sResourceCommon, FleetWatchK8sResultsObject } from '../types'

type Data = FleetK8sResourceCommon | FleetK8sResourceCommon[]

type CacheEntry = {
  result?: FleetWatchK8sResultsObject<Data>
  abortController?: AbortController
  refCount: number
  timestamp: number
  resourceVersion?: string
  timeout?: NodeJS.Timeout
  streamStatus?: string
  streamOpenedAt?: number
}

const CACHE_TTL = 30 * 1000 // 30 seconds
const CACHE_REMOVE_GRACE = 10 * 1000 // 10 seconds; wait a bit longer than TTL to remove cache entry so it is not removed between retrieval of initial value and start of watching

export const isCacheEntryValid = (entry: CacheEntry) => {
  return !entry.result?.loadError && (!!entry.abortController || isCacheEntryFresh(entry))
}

export const isCacheEntryFresh = (entry: CacheEntry) => {
  return getCacheEntryAge(entry) < CACHE_TTL
}

export const getCacheEntryAge = (entry: CacheEntry) => {
  return Date.now() - entry.timestamp
}

export type FleetK8sWatchResourceStore = {
  // Cache
  cache: Record<string, CacheEntry>

  // Actions for cache
  setResult: (key: string, data: Data | undefined, loaded: boolean, loadError?: any, resourceVersion?: string) => void
  setAbortController: (key: string, abortController: AbortController) => void
  setStreamStatus: (key: string, status: string) => void
  incrementRefCount: (key: string) => void
  decrementRefCount: (key: string) => void
  touchEntry: (key: string) => void
  removeEntry: (key: string) => void

  // Getters for cache
  getResult: (key: string) => FleetWatchK8sResultsObject<Data> | undefined
  getRefCount: (key: string) => number
  getResourceVersion: (key: string) => string | undefined
}

export const useFleetK8sWatchResourceStore = create<FleetK8sWatchResourceStore>()(
  subscribeWithSelector((set, get) => ({
    cache: {},

    setResult: (key, data, loaded, loadError, resourceVersion) => {
      set((state) => {
        const originalResult = state.cache[key] || {}
        return {
          cache: {
            ...state.cache,
            [key]: {
              ...originalResult,
              result: { data, loaded, loadError },
              timestamp: Date.now(),
              resourceVersion: resourceVersion ?? originalResult.resourceVersion,
            },
          },
        }
      })
    },

    setAbortController: (key, abortController) => {
      set((state) => ({
        cache: {
          ...state.cache,
          [key]: {
            ...state.cache[key],
            abortController,
          },
        },
      }))
    },

    setStreamStatus: (key, status) => {
      set((state) => {
        const entry = state.cache[key]
        if (!entry) return state
        const updates: Partial<CacheEntry> = { streamStatus: status }
        if (status === 'Connecting') {
          updates.streamOpenedAt = Date.now()
        } else if (!status.startsWith('Active')) {
          updates.streamOpenedAt = undefined
        }
        return {
          cache: {
            ...state.cache,
            [key]: { ...entry, ...updates },
          },
        }
      })
    },

    incrementRefCount: (key) => {
      set((state) => {
        const entry = state.cache[key] || {}
        const { refCount, timeout } = entry
        if (timeout) {
          clearTimeout(timeout)
        }
        return {
          cache: {
            ...state.cache,
            [key]: {
              ...entry,
              refCount: (refCount || 0) + 1,
              timeout: undefined,
            },
          },
        }
      })
    },

    decrementRefCount: (key) => {
      set((state) => {
        const entry = state.cache[key]
        if (entry) {
          const { abortController, refCount } = entry
          const newRefCount = refCount > 0 ? refCount - 1 : 0
          if (newRefCount === 0 && abortController) {
            abortController.abort()
          }
          return {
            cache: {
              ...state.cache,
              [key]: {
                ...entry,
                refCount: newRefCount,
                abortController: newRefCount > 0 ? abortController : undefined,
                timeout:
                  newRefCount === 0
                    ? setTimeout(() => state.removeEntry(key), CACHE_TTL + CACHE_REMOVE_GRACE)
                    : undefined,
              },
            },
          }
        }
        return state
      })
    },

    touchEntry: (key) => {
      set((state) => ({
        cache: {
          ...state.cache,
          [key]: {
            ...state.cache[key],
            timestamp: Date.now(),
          },
        },
      }))
    },

    removeEntry: (key) => {
      set((state) => {
        const { [key]: removed, ...rest } = state.cache
        return {
          cache: {
            ...rest,
          },
        }
      })
    },

    getResult: (key) => get().cache[key]?.result,
    getRefCount: (key) => get().cache[key]?.refCount,
    getResourceVersion: (key) => get().cache[key]?.resourceVersion,
  }))
)
