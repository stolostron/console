/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import {
  useFleetK8sWatchResourceStore,
  useFleetK8sCache,
  setupAutoCleanup,
  getCacheKey,
} from './fleetK8sWatchResourceStore'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  private _readyState = MockWebSocket.CONNECTING
  url: string

  constructor(url: string) {
    this.url = url
    // Simulate immediate connection
    setTimeout(() => {
      this._readyState = MockWebSocket.OPEN
    }, 0)
  }

  get readyState() {
    return this._readyState
  }

  set readyState(value: number) {
    this._readyState = value
  }

  close = jest.fn(() => {
    this._readyState = MockWebSocket.CLOSED
  })
}

global.WebSocket = MockWebSocket as any

describe('FleetK8sWatchResourceStore', () => {
  beforeEach(() => {
    // Clear the store before each test
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  afterEach(() => {
    // Clear the store after each test
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  it('should set and get resource data', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod', cluster: 'test-cluster' }
    const key = 'test-key'

    act(() => {
      result.current.setResource(key, testData, true)
    })

    const cachedData = result.current.getResource(key)
    expect(cachedData?.data).toEqual(testData)
    expect(cachedData?.loaded).toBe(true)
    expect(cachedData?.error).toBeUndefined()
  })

  it('should handle resource expiration', async () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod', cluster: 'test-cluster' }
    const key = 'test-key'

    // Set a very short TTL for testing
    act(() => {
      result.current.setResource(key, testData, true)
      // Manually set a very short TTL
      useFleetK8sWatchResourceStore.setState({ cacheTTL: 1 })
    })

    // Wait a bit to ensure expiration
    await new Promise((resolve) => setTimeout(resolve, 10))

    const isExpired = result.current.isResourceExpired(key)
    expect(isExpired).toBe(true)
  })

  it('should manage socket cache', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'test-socket-key'

    act(() => {
      result.current.setSocket(key, mockSocket)
    })

    const cachedSocket = result.current.getSocket(key)
    expect(cachedSocket?.socket).toBe(mockSocket)
  })

  it('should remove resources and sockets', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod' }
    const resourceKey = 'test-resource-key'

    act(() => {
      result.current.setResource(resourceKey, testData, true)
    })

    expect(result.current.getResource(resourceKey)).toBeDefined()

    act(() => {
      result.current.removeResource(resourceKey)
    })

    expect(result.current.getResource(resourceKey)).toBeUndefined()
  })

  it('should clear all cache', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod' }
    const key = 'test-key'

    act(() => {
      result.current.setResource(key, testData, true)
    })

    expect(result.current.getResource(key)).toBeDefined()

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.getResource(key)).toBeUndefined()
  })

  it('should provide cache statistics', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod' }

    act(() => {
      result.current.setResource('key1', testData, true)
      result.current.setResource('key2', testData, true)
    })

    const stats = result.current.getCacheStats()
    expect(stats.resourceCount).toBe(2)
    expect(stats.socketCount).toBe(0)
  })
})

describe('useFleetK8sCache hook', () => {
  it('should provide cache management utilities', () => {
    const { result } = renderHook(() => useFleetK8sCache())

    expect(typeof result.current.clearExpired).toBe('function')
    expect(typeof result.current.clearAll).toBe('function')
    expect(typeof result.current.getCacheStats).toBe('function')
    expect(typeof result.current.setCacheTTL).toBe('function')
  })

  it('should allow setting cache TTL', () => {
    const { result } = renderHook(() => useFleetK8sCache())

    act(() => {
      result.current.setCacheTTL(10000)
    })

    expect(useFleetK8sWatchResourceStore.getState().cacheTTL).toBe(10000)
  })
})

describe('setupAutoCleanup', () => {
  it('should return a cleanup function', () => {
    const cleanup = setupAutoCleanup(100)
    expect(typeof cleanup).toBe('function')

    // Call cleanup to prevent test interference
    cleanup()
  })

  it('should periodically clean expired entries', () => {
    // Mock setInterval and clearInterval
    const originalSetInterval = global.setInterval
    const originalClearInterval = global.clearInterval

    let intervalCallback: (() => void) | null = null
    const intervalId = 1

    global.setInterval = jest.fn((callback: () => void) => {
      intervalCallback = callback
      return intervalId as any
    }) as any

    global.clearInterval = jest.fn() as any

    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod' }

    // Mock Date.now to control timestamps
    const originalDateNow = Date.now
    let mockTime = 1000000000000
    Date.now = jest.fn(() => mockTime)

    act(() => {
      result.current.setResource('test-key', testData, true)
      useFleetK8sWatchResourceStore.setState({ cacheTTL: 50 }) // Very short TTL
    })

    // Set up auto cleanup
    const cleanup = setupAutoCleanup(100)
    expect(global.setInterval).toHaveBeenCalled()

    // Advance time to make entry expire
    mockTime += 100

    // Manually trigger the cleanup callback
    if (intervalCallback) {
      act(() => {
        intervalCallback!()
      })
    }

    // Entry should be cleaned up
    expect(result.current.getResource('test-key')).toBeUndefined()

    cleanup()
    expect(global.clearInterval).toHaveBeenCalledWith(intervalId)

    // Restore mocks
    global.setInterval = originalSetInterval
    global.clearInterval = originalClearInterval
    Date.now = originalDateNow
  })
})

describe('Resource cache advanced scenarios', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  it('should handle resource data with errors', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testError = new Error('Failed to load resource')
    const key = 'error-key'

    act(() => {
      result.current.setResource(key, null, false, testError)
    })

    const cachedData = result.current.getResource(key)
    expect(cachedData?.data).toBeNull()
    expect(cachedData?.loaded).toBe(false)
    expect(cachedData?.error).toBe(testError)
    expect(cachedData?.timestamp).toBeDefined()
    expect(cachedData?.lastAccessed).toBeDefined()
  })

  it('should update lastAccessed timestamp when getting resource', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod' }
    const key = 'access-test-key'

    act(() => {
      result.current.setResource(key, testData, true)
    })

    const firstAccess = result.current.getResource(key)
    expect(firstAccess?.lastAccessed).toBeDefined()
    expect(typeof firstAccess?.lastAccessed).toBe('number')

    // Access again to verify lastAccessed gets updated
    const secondAccess = result.current.getResource(key)
    expect(secondAccess?.lastAccessed).toBeDefined()
    expect(typeof secondAccess?.lastAccessed).toBe('number')

    // Verify lastAccessed is updated (should be >= firstAccess time)
    expect(secondAccess?.lastAccessed).toBeGreaterThanOrEqual(firstAccess?.lastAccessed!)
  })

  it('should return true for expired check on non-existent resource', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    expect(result.current.isResourceExpired('non-existent-key')).toBe(true)
  })

  it('should clear expired resources only', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData1 = { name: 'test-pod-1' }
    const testData2 = { name: 'test-pod-2' }

    // Mock Date.now to control timestamps
    const originalDateNow = Date.now
    let mockTime = 1000000000000
    Date.now = jest.fn(() => mockTime)

    // Set very short TTL
    act(() => {
      useFleetK8sWatchResourceStore.setState({ cacheTTL: 50 })
    })

    // Add first resource
    act(() => {
      result.current.setResource('key1', testData1, true)
    })

    // Advance time to make first resource expire
    mockTime += 100

    // Add second resource (should not be expired)
    act(() => {
      result.current.setResource('key2', testData2, true)
    })

    // Clear expired
    act(() => {
      result.current.clearExpired()
    })

    expect(result.current.getResource('key1')).toBeUndefined()
    expect(result.current.getResource('key2')).toBeDefined()

    // Restore original Date.now
    Date.now = originalDateNow
  })
})

describe('Socket cache advanced scenarios', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  it('should update lastAccessed timestamp when getting socket', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'socket-access-test'

    act(() => {
      result.current.setSocket(key, mockSocket)
    })

    const firstAccess = result.current.getSocket(key)
    expect(firstAccess?.lastAccessed).toBeDefined()
    expect(typeof firstAccess?.lastAccessed).toBe('number')

    // Access again to verify lastAccessed gets updated
    const secondAccess = result.current.getSocket(key)
    expect(secondAccess?.lastAccessed).toBeDefined()
    expect(typeof secondAccess?.lastAccessed).toBe('number')

    // Verify lastAccessed is updated (should be >= firstAccess time)
    expect(secondAccess?.lastAccessed).toBeGreaterThanOrEqual(firstAccess?.lastAccessed!)
  })

  it('should return true for expired check on non-existent socket', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    expect(result.current.isSocketExpired('non-existent-socket')).toBe(true)
  })

  it('should close socket when removing it', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'socket-close-test'

    // Make socket appear open
    ;(mockSocket as any).readyState = MockWebSocket.OPEN

    act(() => {
      result.current.setSocket(key, mockSocket)
    })

    act(() => {
      result.current.removeSocket(key)
    })

    expect(mockSocket.close).toHaveBeenCalled()
    expect(result.current.getSocket(key)).toBeUndefined()
  })

  it('should handle removing socket that is not open', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'socket-closed-test'

    // Socket is closed
    ;(mockSocket as any).readyState = MockWebSocket.CLOSED

    act(() => {
      result.current.setSocket(key, mockSocket)
    })

    act(() => {
      result.current.removeSocket(key)
    })

    // close() should not be called for already closed socket
    expect(mockSocket.close).not.toHaveBeenCalled()
    expect(result.current.getSocket(key)).toBeUndefined()
  })

  it('should clear expired sockets and close them', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket1 = new WebSocket('wss://example1.com')
    const mockSocket2 = new WebSocket('wss://example2.com')

    // Make sockets appear open
    ;(mockSocket1 as any).readyState = MockWebSocket.OPEN
    ;(mockSocket2 as any).readyState = MockWebSocket.OPEN

    // Mock Date.now to control timestamps
    const originalDateNow = Date.now
    let mockTime = 1000000000000
    Date.now = jest.fn(() => mockTime)

    // Set very short TTL
    act(() => {
      useFleetK8sWatchResourceStore.setState({ cacheTTL: 50 })
    })

    // Add first socket
    act(() => {
      result.current.setSocket('socket1', mockSocket1)
    })

    // Advance time to make first socket expire
    mockTime += 100

    // Add second socket (should not be expired)
    act(() => {
      result.current.setSocket('socket2', mockSocket2)
    })

    // Clear expired
    act(() => {
      result.current.clearExpired()
    })

    expect(mockSocket1.close).toHaveBeenCalled()
    expect(result.current.getSocket('socket1')).toBeUndefined()
    expect(result.current.getSocket('socket2')).toBeDefined()

    // Restore original Date.now
    Date.now = originalDateNow
  })

  it('should close all sockets when clearing all cache', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket1 = new WebSocket('wss://example1.com')
    const mockSocket2 = new WebSocket('wss://example2.com')

    // Make sockets appear open
    ;(mockSocket1 as any).readyState = MockWebSocket.OPEN
    ;(mockSocket2 as any).readyState = MockWebSocket.OPEN

    act(() => {
      result.current.setSocket('socket1', mockSocket1)
      result.current.setSocket('socket2', mockSocket2)
    })

    act(() => {
      result.current.clearAll()
    })

    expect(mockSocket1.close).toHaveBeenCalled()
    expect(mockSocket2.close).toHaveBeenCalled()
    expect(result.current.getSocket('socket1')).toBeUndefined()
    expect(result.current.getSocket('socket2')).toBeUndefined()
  })
})

describe('Cache statistics advanced scenarios', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  it('should calculate expired counts correctly', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'test-pod' }
    const mockSocket = new WebSocket('wss://example.com')

    // Mock Date.now to control timestamps
    const originalDateNow = Date.now
    let mockTime = 1000000000000
    Date.now = jest.fn(() => mockTime)

    // Set very short TTL
    act(() => {
      useFleetK8sWatchResourceStore.setState({ cacheTTL: 50 })
    })

    // Add resources and sockets
    act(() => {
      result.current.setResource('resource1', testData, true)
      result.current.setSocket('socket1', mockSocket)
    })

    // Advance time to make first entries expire
    mockTime += 100

    // Add fresh entries
    act(() => {
      result.current.setResource('resource2', testData, true)
      result.current.setSocket('socket2', new WebSocket('wss://example2.com'))
    })

    const stats = result.current.getCacheStats()
    expect(stats.resourceCount).toBe(2)
    expect(stats.socketCount).toBe(2)
    expect(stats.expiredResourceCount).toBe(1)
    expect(stats.expiredSocketCount).toBe(1)

    // Restore original Date.now
    Date.now = originalDateNow
  })

  it('should handle empty cache statistics', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    const stats = result.current.getCacheStats()
    expect(stats.resourceCount).toBe(0)
    expect(stats.socketCount).toBe(0)
    expect(stats.expiredResourceCount).toBe(0)
    expect(stats.expiredSocketCount).toBe(0)
  })
})

describe('getCacheKey utility', () => {
  it('should generate consistent cache keys', () => {
    const model = { apiVersion: 'v1', kind: 'Pod' }
    const cluster = 'test-cluster'
    const namespace = 'default'
    const name = 'test-pod'

    const key1 = getCacheKey({ model, cluster, namespace, name })
    const key2 = getCacheKey({ model, cluster, namespace, name })

    expect(key1).toBe(key2)
    expect(key1).toBe('test-cluster|v1|Pod|default|test-pod')
  })

  it('should handle optional parameters', () => {
    const model = { apiVersion: 'v1', kind: 'Namespace' }

    const keyWithCluster = getCacheKey({ model, cluster: 'test-cluster' })
    expect(keyWithCluster).toBe('test-cluster|v1|Namespace||')

    const keyMinimal = getCacheKey({ model })
    expect(keyMinimal).toBe('|v1|Namespace||')
  })

  it('should handle empty or undefined model properties', () => {
    const model = { apiVersion: undefined, kind: undefined }

    const key = getCacheKey({ model })
    expect(key).toBe('||||')
  })
})

describe('Edge cases and error scenarios', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.getState().clearAll()
  })

  it('should handle multiple rapid cache operations', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'rapid-test' }

    // Rapid set/get operations
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.setResource(`key-${i}`, { ...testData, id: i }, true)
      }
    })

    // Verify all entries exist
    for (let i = 0; i < 100; i++) {
      const entry = result.current.getResource<{ name: string; id: number }>(`key-${i}`)
      expect(entry?.data.id).toBe(i)
    }

    const stats = result.current.getCacheStats()
    expect(stats.resourceCount).toBe(100)
  })

  it('should handle socket operations with invalid WebSocket states', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')

    // Set invalid state
    ;(mockSocket as any).readyState = 999

    act(() => {
      result.current.setSocket('invalid-socket', mockSocket)
    })

    // Should still store the socket
    expect(result.current.getSocket('invalid-socket')).toBeDefined()

    // Removal should not crash
    act(() => {
      result.current.removeSocket('invalid-socket')
    })

    expect(result.current.getSocket('invalid-socket')).toBeUndefined()
  })

  it('should handle concurrent access to same cache key', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { name: 'concurrent-test' }
    const key = 'concurrent-key'

    // Simulate rapid sequential access (instead of async concurrent)
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.setResource(key, { ...testData, version: i }, true)
      }
    })

    // Should have the last set value
    const finalEntry = result.current.getResource<{ name: string; version: number }>(key)
    expect(finalEntry?.data.name).toBe('concurrent-test')
    expect(finalEntry?.data.version).toBe(9) // Last iteration
  })
})
