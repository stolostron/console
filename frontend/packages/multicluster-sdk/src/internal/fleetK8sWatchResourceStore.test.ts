/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import { useFleetK8sWatchResourceStore, isCacheEntryValid } from './fleetK8sWatchResourceStore'

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
    useFleetK8sWatchResourceStore.setState({ cache: {} })
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  afterEach(() => {
    // Clear the store after each test
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should set and get result data', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { metadata: { name: 'test-pod', namespace: 'default' } }
    const key = 'test-key'

    act(() => {
      result.current.setResult(key, testData, true)
    })

    const cachedResult = result.current.getResult(key)
    expect(cachedResult?.data).toEqual(testData)
    expect(cachedResult?.loaded).toBe(true)
    expect(cachedResult?.loadError).toBeUndefined()
  })

  it('should handle result data with errors', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testError = new Error('Failed to load resource')
    const key = 'error-key'

    act(() => {
      result.current.setResult(key, undefined, false, testError)
    })

    const cachedResult = result.current.getResult(key)
    expect(cachedResult?.data).toBeUndefined()
    expect(cachedResult?.loaded).toBe(false)
    expect(cachedResult?.loadError).toBe(testError)
  })

  it('should handle array data', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = [
      { metadata: { name: 'pod-1', namespace: 'default' } },
      { metadata: { name: 'pod-2', namespace: 'default' } },
    ]
    const key = 'array-key'

    act(() => {
      result.current.setResult(key, testData, true)
    })

    const cachedResult = result.current.getResult(key)
    expect(Array.isArray(cachedResult?.data)).toBe(true)
    expect(cachedResult?.data).toHaveLength(2)
  })

  it('should manage socket cache', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'test-socket-key'

    act(() => {
      result.current.setSocket(key, mockSocket)
    })

    const cachedSocket = result.current.getSocket(key)
    expect(cachedSocket).toBe(mockSocket)
  })

  it('should track ref count correctly', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'ref-count-key'

    act(() => {
      result.current.incrementRefCount(key)
    })
    expect(result.current.getRefCount(key)).toBe(1)

    act(() => {
      result.current.incrementRefCount(key)
    })
    expect(result.current.getRefCount(key)).toBe(2)

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(result.current.getRefCount(key)).toBe(1)

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(result.current.getRefCount(key)).toBe(0)
  })

  it('should close socket when ref count reaches zero', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'socket-close-key'

    // Make socket appear open
    ;(mockSocket as any).readyState = MockWebSocket.OPEN

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setSocket(key, mockSocket)
    })

    expect(result.current.getSocket(key)).toBe(mockSocket)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockSocket.close).toHaveBeenCalled()
    expect(result.current.getSocket(key)).toBeUndefined()
  })

  it('should store and retrieve resource version', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { metadata: { name: 'test-pod', namespace: 'default' } }
    const key = 'version-key'
    const resourceVersion = '12345'

    act(() => {
      result.current.setResult(key, testData, true, undefined, resourceVersion)
    })

    expect(result.current.getResourceVersion(key)).toBe(resourceVersion)
  })

  it('should update timestamp when touching entry', () => {
    jest.useFakeTimers()
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'touch-key'
    const testData = { metadata: { name: 'test-pod', namespace: 'default' } }

    const initialTime = Date.now()
    jest.setSystemTime(initialTime)

    act(() => {
      result.current.setResult(key, testData, true)
    })

    const entry1 = useFleetK8sWatchResourceStore.getState().cache[key]
    expect(entry1.timestamp).toBe(initialTime)

    // Advance time
    jest.advanceTimersByTime(5000)

    act(() => {
      result.current.touchEntry(key)
    })

    const entry2 = useFleetK8sWatchResourceStore.getState().cache[key]
    expect(entry2.timestamp).toBe(initialTime + 5000)

    jest.useRealTimers()
  })

  it('should remove entry completely', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { metadata: { name: 'test-pod', namespace: 'default' } }
    const key = 'remove-key'

    act(() => {
      result.current.setResult(key, testData, true)
    })

    expect(result.current.getResult(key)).toBeDefined()

    act(() => {
      result.current.removeEntry(key)
    })

    expect(result.current.getResult(key)).toBeUndefined()
  })

  it('should return consistent data across multiple accesses', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { metadata: { name: 'test-pod', namespace: 'default' } }
    const key = 'consistent-key'

    act(() => {
      result.current.setResult(key, testData, true)
    })

    const firstAccess = result.current.getResult(key)
    expect(firstAccess?.data).toEqual(testData)
    expect(firstAccess?.loaded).toBe(true)

    // Access again to verify data is consistent
    const secondAccess = result.current.getResult(key)
    expect(secondAccess?.data).toEqual(testData)
    expect(secondAccess?.loaded).toBe(true)
  })
})

describe('isCacheEntryValid function', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  it('should return true for entry with active socket', () => {
    const mockSocket = new WebSocket('wss://example.com')
    const entry = {
      socket: mockSocket,
      refCount: 1,
      timestamp: Date.now() - 100000, // Old timestamp
      result: { data: undefined, loaded: false },
    }

    expect(isCacheEntryValid(entry)).toBe(true)
  })

  it('should return true for recent entry without socket', () => {
    const entry = {
      refCount: 0,
      timestamp: Date.now() - 1000, // 1 second ago
    }

    expect(isCacheEntryValid(entry)).toBe(true)
  })

  it('should return false for old entry without socket', () => {
    const entry = {
      refCount: 0,
      timestamp: Date.now() - 100000, // 100 seconds ago (> 30 second TTL)
    }

    expect(isCacheEntryValid(entry)).toBe(false)
  })
})

describe('Ref count management with sockets', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should not close socket if ref count is still positive', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'multi-ref-key'

    ;(mockSocket as any).readyState = MockWebSocket.OPEN

    act(() => {
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.setSocket(key, mockSocket)
    })

    expect(result.current.getRefCount(key)).toBe(2)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(result.current.getRefCount(key)).toBe(1)
    expect(mockSocket.close).not.toHaveBeenCalled()
    expect(result.current.getSocket(key)).toBe(mockSocket)
  })

  it('should prevent ref count from going negative', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'negative-ref-key'

    act(() => {
      result.current.decrementRefCount(key)
    })

    // Should handle gracefully - entry might not exist or ref count should be 0
    const refCount = result.current.getRefCount(key)
    expect(refCount === undefined || refCount === 0).toBe(true)
  })

  it('should handle socket operations with multiple refs', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'socket-multi-ref'

    ;(mockSocket as any).readyState = MockWebSocket.OPEN

    // Simulate multiple hooks using the same socket
    act(() => {
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.setSocket(key, mockSocket)
    })

    expect(result.current.getRefCount(key)).toBe(3)
    expect(result.current.getSocket(key)).toBe(mockSocket)

    // First hook unmounts
    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(mockSocket.close).not.toHaveBeenCalled()

    // Second hook unmounts
    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(mockSocket.close).not.toHaveBeenCalled()

    // Third hook unmounts - socket should close
    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(mockSocket.close).toHaveBeenCalled()
  })
})

describe('Cache timeout and cleanup', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  afterEach(() => {
    jest.useRealTimers()
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should schedule cache removal after ref count reaches zero', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { metadata: { name: 'test-pod', namespace: 'default' } }
    const key = 'timeout-key'

    act(() => {
      result.current.setResult(key, testData, true)
      result.current.incrementRefCount(key)
    })

    expect(result.current.getResult(key)).toBeDefined()

    act(() => {
      result.current.decrementRefCount(key)
    })

    // Entry should still exist immediately after ref count reaches zero
    expect(result.current.getResult(key)).toBeDefined()

    // Fast-forward time past TTL + grace period
    act(() => {
      jest.advanceTimersByTime(41000) // 30s TTL + 10s grace + 1s buffer
    })

    // Entry should be removed
    expect(result.current.getResult(key)).toBeUndefined()
  })

  it('should cancel scheduled removal when ref count increases again', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const testData = { metadata: { name: 'test-pod', namespace: 'default' } }
    const key = 'cancel-timeout-key'

    act(() => {
      result.current.setResult(key, testData, true)
      result.current.incrementRefCount(key)
    })

    act(() => {
      result.current.decrementRefCount(key) // Schedules removal
    })

    // Re-increment before timeout
    act(() => {
      jest.advanceTimersByTime(5000)
      result.current.incrementRefCount(key)
    })

    // Fast-forward past original timeout
    act(() => {
      jest.advanceTimersByTime(40000)
    })

    // Entry should still exist because removal was cancelled
    expect(result.current.getResult(key)).toBeDefined()
  })
})

describe('Edge cases and error scenarios', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should handle multiple rapid cache operations', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.setResult(`key-${i}`, { metadata: { name: `pod-${i}` } }, true)
      }
    })

    // Verify all entries exist
    for (let i = 0; i < 100; i++) {
      const entry = result.current.getResult(`key-${i}`)
      expect((entry?.data as any)?.metadata?.name).toBe(`pod-${i}`)
    }

    // Verify we can still access the data after rapid operations
    expect(result.current.getResult('key-0')).toBeDefined()
    expect(result.current.getResult('key-99')).toBeDefined()
  })

  it('should handle socket operations with invalid WebSocket states', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')

    // Set invalid state
    ;(mockSocket as any).readyState = 999

    act(() => {
      result.current.incrementRefCount('invalid-socket')
      result.current.setSocket('invalid-socket', mockSocket)
    })

    // Should still store the socket
    expect(result.current.getSocket('invalid-socket')).toBeDefined()

    // Decrement should not crash
    act(() => {
      result.current.decrementRefCount('invalid-socket')
    })

    expect(result.current.getSocket('invalid-socket')).toBeUndefined()
  })

  it('should handle concurrent updates to same cache key', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'concurrent-key'

    // Simulate rapid sequential updates
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.setResult(key, { metadata: { name: 'pod' } } as any, true)
      }
    })

    // Should have the last set value
    const finalEntry = result.current.getResult(key)
    expect((finalEntry?.data as any)?.metadata?.name).toBe('pod')
  })

  it('should preserve resource version across result updates', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'version-preserve-key'

    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-1' } }, true, undefined, 'v1')
    })

    expect(result.current.getResourceVersion(key)).toBe('v1')

    // Update result without specifying resource version
    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-2' } }, true)
    })

    // Resource version should be preserved
    expect(result.current.getResourceVersion(key)).toBe('v1')

    // Update with new resource version
    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-3' } }, true, undefined, 'v2')
    })

    expect(result.current.getResourceVersion(key)).toBe('v2')
  })

  it('should handle setting socket before incrementing ref count', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'socket-first-key'

    ;(mockSocket as any).readyState = MockWebSocket.OPEN

    // Set socket first
    act(() => {
      result.current.setSocket(key, mockSocket)
    })

    expect(result.current.getSocket(key)).toBe(mockSocket)

    // Then increment ref count
    act(() => {
      result.current.incrementRefCount(key)
    })

    expect(result.current.getRefCount(key)).toBe(1)
  })

  it('should handle removing non-existent entry', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    // Should not throw
    act(() => {
      result.current.removeEntry('non-existent-key')
    })

    expect(result.current.getResult('non-existent-key')).toBeUndefined()
  })

  it('should handle touching non-existent entry', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    // Should create an entry with just timestamp
    act(() => {
      result.current.touchEntry('new-touch-key')
    })

    const entry = useFleetK8sWatchResourceStore.getState().cache['new-touch-key']
    expect(entry).toBeDefined()
    expect(entry.timestamp).toBeDefined()
  })

  it('should handle decrement on non-existent entry gracefully', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    // Should not throw
    act(() => {
      result.current.decrementRefCount('non-existent-ref')
    })

    // Entry should not exist
    expect(result.current.getResult('non-existent-ref')).toBeUndefined()
  })

  it('should update result data while preserving other cache entry properties', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'preserve-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setSocket(key, mockSocket)
      result.current.setResult(key, { metadata: { name: 'pod-1' } }, true)
    })

    expect(result.current.getSocket(key)).toBe(mockSocket)
    expect(result.current.getRefCount(key)).toBe(1)

    // Update result
    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-2' } }, true)
    })

    // Socket and ref count should be preserved
    expect(result.current.getSocket(key)).toBe(mockSocket)
    expect(result.current.getRefCount(key)).toBe(1)
    expect((result.current.getResult(key)?.data as any)?.metadata?.name).toBe('pod-2')
  })
})

describe('Integration scenarios', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should handle full lifecycle: create, watch, update, unwatch', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'lifecycle-key'

    ;(mockSocket as any).readyState = MockWebSocket.OPEN

    // Component mounts - start watching
    act(() => {
      result.current.incrementRefCount(key)
      result.current.setResult(key, { metadata: { name: 'initial-pod' } }, true)
      result.current.setSocket(key, mockSocket)
    })

    expect(result.current.getRefCount(key)).toBe(1)
    expect(result.current.getSocket(key)).toBe(mockSocket)

    // Receive updates
    act(() => {
      result.current.setResult(key, { metadata: { name: 'updated-pod' } }, true)
    })

    expect((result.current.getResult(key)?.data as any)?.metadata?.name).toBe('updated-pod')

    // Component unmounts - stop watching
    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockSocket.close).toHaveBeenCalled()
    expect(result.current.getSocket(key)).toBeUndefined()
  })

  it('should handle multiple components watching same resource', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockSocket = new WebSocket('wss://example.com')
    const key = 'shared-key'

    ;(mockSocket as any).readyState = MockWebSocket.OPEN

    // Component 1 starts watching
    act(() => {
      result.current.incrementRefCount(key)
      result.current.setResult(key, { metadata: { name: 'shared-pod' } }, true)
      result.current.setSocket(key, mockSocket)
    })

    // Component 2 starts watching (reuses socket)
    act(() => {
      result.current.incrementRefCount(key)
    })

    expect(result.current.getRefCount(key)).toBe(2)

    // Component 1 unmounts
    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockSocket.close).not.toHaveBeenCalled()
    expect(result.current.getSocket(key)).toBe(mockSocket)

    // Component 2 unmounts
    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockSocket.close).toHaveBeenCalled()
  })
})
