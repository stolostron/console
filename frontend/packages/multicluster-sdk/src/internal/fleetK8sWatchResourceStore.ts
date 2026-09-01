/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sResourceCommon, FleetWatchK8sResultsObject } from '../types'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

type Data = FleetK8sResourceCommon | FleetK8sResourceCommon[]

type CacheEntry = {
  result?: FleetWatchK8sResultsObject<Data>
  socket?: WebSocket
  refCount: number
  timestamp: number
  resourceVersion?: string
  timeout?: ReturnType<typeof setTimeout>
  monitorTimeout?: ReturnType<typeof setTimeout>
}

const CACHE_TTL = 65 * 1000 // 65 seconds - k8s API sends BOOKMARK event about every 60 seconds
const CACHE_REMOVE_GRACE = 10 * 1000 // 10 seconds; wait a bit longer than TTL to remove cache entry so it is not removed between retrieval of initial value and start of watching
const ERROR_RETRY_INTERVAL = 15 * 1000 // 15 seconds - shorter retry when in an error state

export const isCacheEntryValid = (entry: CacheEntry) => {
  return !entry.result?.loadError && (!!entry.socket || isCacheEntryFresh(entry))
}

export const isCacheEntryFresh = (entry: CacheEntry) => {
  return getCacheEntryAge(entry) < CACHE_TTL
}

export const getCacheEntryAge = (entry: CacheEntry) => {
  return Date.now() - entry.timestamp
}

export const getSocketMonitoringInterval = () => CACHE_TTL
export const getErrorRetryInterval = () => ERROR_RETRY_INTERVAL
export const is404Error = (error: any): boolean => error?.code === 404 || error?.response?.status === 404

export type FleetK8sWatchResourceStore = {
  // Cache
  cache: Record<string, CacheEntry>

  // Actions for cache
  setResult: (key: string, data: Data | undefined, loaded: boolean, loadError?: any, resourceVersion?: string) => void
  setSocket: (key: string, socket: WebSocket) => void
  incrementRefCount: (key: string) => void
  decrementRefCount: (key: string) => void
  touchEntry: (key: string) => void
  removeEntry: (key: string) => void
  setMonitorTimeout: (key: string, timeout: ReturnType<typeof setTimeout>) => void
  clearMonitorTimeout: (key: string) => void

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

    setSocket: (key, socket) => {
      set((state) => ({
        cache: {
          ...state.cache,
          [key]: {
            ...state.cache[key],
            socket,
          },
        },
      }))
    },

    incrementRefCount: (key) => {
      set((state) => {
        const entry = state.cache[key] || {}
        const { refCount, timeout } = entry
        if (timeout) {
          // cancel scheduled cache removal
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
        if (!entry) {
          return state
        }
        const newRefCount = Math.max(0, entry.refCount - 1)
        if (newRefCount === 0) {
          entry.socket?.close()
        }
        return {
          cache: {
            ...state.cache,
            [key]: {
              ...entry,
              refCount: newRefCount,
              socket: newRefCount > 0 ? entry.socket : undefined,
              timeout:
                newRefCount === 0 && !entry.timeout // if timeout is set, the entry is already scheduled for removal
                  ? setTimeout(() => state.removeEntry(key), CACHE_TTL + CACHE_REMOVE_GRACE) // schedule removal of entry
                  : entry.timeout,
            },
          },
        }
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
        const removed = state.cache[key]
        if (removed?.timeout) {
          clearTimeout(removed.timeout)
        }
        if (removed?.monitorTimeout) {
          clearTimeout(removed.monitorTimeout)
        }
        const { [key]: _removed, ...rest } = state.cache
        return {
          cache: {
            ...rest,
          },
        }
      })
    },

    setMonitorTimeout: (key, timeout) => {
      set((state) => {
        const entry = state.cache[key]
        if (!entry) return state
        if (entry.monitorTimeout) {
          clearTimeout(entry.monitorTimeout)
        }
        return {
          cache: {
            ...state.cache,
            [key]: { ...entry, monitorTimeout: timeout },
          },
        }
      })
    },

    clearMonitorTimeout: (key) => {
      set((state) => {
        const entry = state.cache[key]
        if (!entry?.monitorTimeout) return state
        clearTimeout(entry.monitorTimeout)
        return {
          cache: {
            ...state.cache,
            [key]: { ...entry, monitorTimeout: undefined },
          },
        }
      })
    },

    getResult: (key) => get().cache[key]?.result,
    getRefCount: (key) => get().cache[key]?.refCount,
    getResourceVersion: (key) => get().cache[key]?.resourceVersion,
  }))
)
