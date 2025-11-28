/* Copyright Contributors to the Open Cluster Management project */
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { FleetK8sResourceCommon, FleetWatchK8sResultsObject } from '../types'

type Data = FleetK8sResourceCommon | FleetK8sResourceCommon[]

type CacheEntry = {
  result?: FleetWatchK8sResultsObject<Data>
  socket?: WebSocket
  refCount: number
  timestamp: number
  resourceVersion?: string
  timeout?: NodeJS.Timeout
}

const CACHE_TTL = 30 * 1000 // 30 seconds
const CACHE_REMOVE_GRACE = 10 * 1000 // 10 seconds; wait a bit longer than TTL to remove cache entry so it is not removed between retrieval of initial value and start of watching

export const isCacheEntryValid = (entry: CacheEntry) => {
  return !!entry.socket || Date.now() - entry.timestamp < CACHE_TTL
}

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

  // Getters for cache
  getResult: (key: string) => FleetWatchK8sResultsObject<Data> | undefined
  getSocket: (key: string) => WebSocket | undefined
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
        if (entry) {
          const { socket, refCount } = entry
          const newRefCount = refCount > 0 ? refCount - 1 : 0
          if (newRefCount === 0 && socket) {
            socket.close()
          }
          return {
            cache: {
              ...state.cache,
              [key]: {
                ...entry,
                refCount: newRefCount,
                socket: newRefCount > 0 ? socket : undefined,
                timeout:
                  newRefCount === 0
                    ? setTimeout(() => state.removeEntry(key), CACHE_TTL + CACHE_REMOVE_GRACE) // schedule removal of entry
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
    getSocket: (key) => get().cache[key]?.socket,
    getRefCount: (key) => get().cache[key]?.refCount,
    getResourceVersion: (key) => get().cache[key]?.resourceVersion,
  }))
)
