/* Copyright Contributors to the Open Cluster Management project */
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface CacheEntry<T = any> {
  data: T
  loaded: boolean
  error?: any
  timestamp: number
  lastAccessed: number
}

export interface SocketCacheEntry {
  socket: WebSocket
  timestamp: number
  lastAccessed: number
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
  removeResource: (key: string) => void
  isResourceExpired: (key: string) => boolean

  // Actions for socket cache
  setSocket: (key: string, socket: WebSocket) => void
  getSocket: (key: string) => SocketCacheEntry | undefined
  addSocketRef: (key: string) => void
  removeSocketRef: (key: string) => void
  removeSocket: (key: string) => void
  isSocketExpired: (key: string) => boolean

  // Cleanup actions
  clearExpired: () => void
  clearAll: () => void

  // Cache statistics
  getCacheStats: () => {
    resourceCount: number
    socketCount: number
    expiredResourceCount: number
    expiredSocketCount: number
  }
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
            lastAccessed: now,
          },
        },
      }))
    },

    getResource: (key) => {
      const entry = get().resourceCache[key]
      if (entry) {
        // Update last accessed time
        set((state) => ({
          resourceCache: {
            ...state.resourceCache,
            [key]: {
              ...entry,
              lastAccessed: Date.now(),
            },
          },
        }))
      }
      return entry
    },

    removeResource: (key) => {
      set((state) => {
        const { [key]: removed, ...rest } = state.resourceCache
        return { resourceCache: rest }
      })
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
            lastAccessed: now,
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
                lastAccessed: Date.now(),
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
      if (entry) {
        // Update last accessed time
        set((state) => ({
          socketCache: {
            ...state.socketCache,
            [key]: {
              ...entry,
              lastAccessed: Date.now(),
            },
          },
        }))
      }
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

    isSocketExpired: (key) => {
      const entry = get().socketCache[key]
      if (!entry) return true
      return Date.now() - entry.timestamp > get().cacheTTL
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

    getCacheStats: () => {
      const state = get()
      const now = Date.now()
      const ttl = state.cacheTTL

      const expiredResourceCount = Object.values(state.resourceCache).filter(
        (entry) => now - entry.timestamp > ttl
      ).length

      const expiredSocketCount = Object.values(state.socketCache).filter((entry) => now - entry.timestamp > ttl).length

      return {
        resourceCount: Object.keys(state.resourceCache).length,
        socketCount: Object.keys(state.socketCache).length,
        expiredResourceCount,
        expiredSocketCount,
      }
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
  model: any
  cluster?: string
  namespace?: string
  name?: string
}) => {
  return [cluster, model?.apiVersion, model?.kind, namespace, name].join('|')
}

// Utility hook for cache management
export const useFleetK8sCache = () => {
  const store = useFleetK8sWatchResourceStore()

  return {
    clearExpired: store.clearExpired,
    clearAll: store.clearAll,
    getCacheStats: store.getCacheStats,
    setCacheTTL: (ttl: number) => {
      useFleetK8sWatchResourceStore.setState({ cacheTTL: ttl })
    },
  }
}

// Auto-cleanup function that can be called periodically
export const setupAutoCleanup = (intervalMs: number = 60000) => {
  const interval = setInterval(() => {
    useFleetK8sWatchResourceStore.getState().clearExpired()
  }, intervalMs)

  return () => clearInterval(interval)
}
