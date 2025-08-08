/* Copyright Contributors to the Open Cluster Management project */
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface CacheEntry<T = any> {
  data: T
  loaded: boolean
  error?: any
  timestamp: number
}

export interface SocketCacheEntry {
  socket: WebSocket
  timestamp: number
  refCount: number // Track how many hooks are using this socket
}

export interface FleetK8sWatchResourceStore {
  // Resource cache
  resourceCache: Record<string, CacheEntry>

  // Socket cache
  socketCache: Record<string, SocketCacheEntry>

  // Cache TTL in milliseconds (default 5 minutes)
  cacheTTL: number

  // Actions for resource cache
  setResource: <T>(key: string, data: T, loaded: boolean, error?: any) => void
  getResource: <T>(key: string) => CacheEntry<T> | undefined
  isResourceExpired: (key: string) => boolean

  // Actions for socket cache
  setSocket: (key: string, socket: WebSocket) => void
  getSocket: (key: string) => SocketCacheEntry | undefined
  addSocketRef: (key: string) => void
  removeSocketRef: (key: string) => void
  removeSocket: (key: string) => void

  // Cleanup actions
  clearExpired: () => void
  clearAll: () => void
}

export const useFleetK8sWatchResourceStore = create<FleetK8sWatchResourceStore>()(
  subscribeWithSelector((set, get) => ({
    resourceCache: {},
    socketCache: {},
    cacheTTL: 5 * 60 * 1000, // 5 minutes

    setResource: (key, data, loaded, error) => {
      const now = Date.now()
      set((state) => ({
        resourceCache: {
          ...state.resourceCache,
          [key]: {
            data,
            loaded,
            error,
            timestamp: now,
          },
        },
      }))
    },

    getResource: (key) => {
      const entry = get().resourceCache[key]
      return entry
    },

    isResourceExpired: (key) => {
      const entry = get().resourceCache[key]
      if (!entry) return true
      return Date.now() - entry.timestamp > get().cacheTTL
    },

    setSocket: (key, socket) => {
      const now = Date.now()
      set((state) => ({
        socketCache: {
          ...state.socketCache,
          [key]: {
            socket,
            timestamp: now,
            refCount: 1,
          },
        },
      }))
    },

    addSocketRef: (key) => {
      set((state) => {
        const entry = state.socketCache[key]
        if (entry) {
          return {
            socketCache: {
              ...state.socketCache,
              [key]: {
                ...entry,
                refCount: entry.refCount + 1,
              },
            },
          }
        }
        return state
      })
    },

    removeSocketRef: (key) => {
      set((state) => {
        const entry = state.socketCache[key]
        if (entry) {
          const newRefCount = entry.refCount - 1
          if (newRefCount <= 0) {
            // Close socket when no more references
            if (entry.socket.readyState === WebSocket.OPEN) {
              entry.socket.close()
            }
            const { [key]: removed, ...rest } = state.socketCache
            return { socketCache: rest }
          } else {
            return {
              socketCache: {
                ...state.socketCache,
                [key]: {
                  ...entry,
                  refCount: newRefCount,
                },
              },
            }
          }
        }
        return state
      })
    },

    getSocket: (key) => {
      const entry = get().socketCache[key]
      return entry
    },

    removeSocket: (key) => {
      set((state) => {
        const entry = state.socketCache[key]
        if (entry?.socket && entry.socket.readyState === WebSocket.OPEN) {
          entry.socket.close()
        }
        const { [key]: removed, ...rest } = state.socketCache
        return { socketCache: rest }
      })
    },

    clearExpired: () => {
      const now = Date.now()
      const ttl = get().cacheTTL

      set((state) => {
        // Clear expired resources
        const validResources: Record<string, CacheEntry> = {}
        Object.entries(state.resourceCache).forEach(([key, entry]) => {
          if (now - entry.timestamp <= ttl) {
            validResources[key] = entry
          }
        })

        // Clear expired sockets
        const validSockets: Record<string, SocketCacheEntry> = {}
        Object.entries(state.socketCache).forEach(([key, entry]) => {
          if (now - entry.timestamp <= ttl) {
            validSockets[key] = entry
          } else if (entry.socket.readyState === WebSocket.OPEN) {
            // Close expired socket
            entry.socket.close()
          }
        })

        return {
          resourceCache: validResources,
          socketCache: validSockets,
        }
      })
    },

    clearAll: () => {
      const state = get()

      // Close all sockets before clearing
      Object.values(state.socketCache).forEach((entry) => {
        if (entry.socket.readyState === WebSocket.OPEN) {
          entry.socket.close()
        }
      })

      set({
        resourceCache: {},
        socketCache: {},
      })
    },
  }))
)

// Utility function to generate cache keys (moved from the original file)
export const getCacheKey = ({
  model,
  cluster,
  namespace,
  name,
}: {
  model: K8sModel
  cluster?: string
  namespace?: string
  name?: string
}) => {
  return [cluster, model?.apiGroup, model?.apiVersion, model?.kind, namespace, name].join('|')
}

// Utility hook for cache management
export const useFleetK8sCache = () => {
  const store = useFleetK8sWatchResourceStore()

  return {
    clearExpired: store.clearExpired,
    clearAll: store.clearAll,
    setCacheTTL: (ttl: number) => {
      useFleetK8sWatchResourceStore.setState({ cacheTTL: ttl })
    },
  }
}
