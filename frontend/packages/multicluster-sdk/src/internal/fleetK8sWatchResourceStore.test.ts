/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import {
  useFleetK8sWatchResourceStore,
  isCacheEntryValid,
  isCacheEntryFresh,
  getCacheEntryAge,
} from './fleetK8sWatchResourceStore'

const createMockAbortController = () => {
  const controller = new AbortController()
  jest.spyOn(controller, 'abort')
  return controller
}

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

  it('should manage abort controller cache', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockController = createMockAbortController()
    const key = 'test-controller-key'

    act(() => {
      result.current.setAbortController(key, mockController)
    })

    const cachedController = result.current.cache[key]?.abortController
    expect(cachedController).toBe(mockController)
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

  it('should abort controller when ref count reaches zero', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockController = createMockAbortController()
    const key = 'controller-abort-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setAbortController(key, mockController)
    })

    expect(result.current.cache[key]?.abortController).toBe(mockController)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockController.abort).toHaveBeenCalled()
    expect(result.current.cache[key]?.abortController).toBeUndefined()
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

  it('should return true for entry with active abort controller', () => {
    const mockController = createMockAbortController()
    const entry = {
      abortController: mockController,
      refCount: 1,
      timestamp: Date.now() - 100000, // Old timestamp
      result: { data: undefined, loaded: false },
    }

    expect(isCacheEntryValid(entry)).toBe(true)
  })

  it('should return true for recent entry without abort controller', () => {
    const entry = {
      refCount: 0,
      timestamp: Date.now() - 1000, // 1 second ago
    }

    expect(isCacheEntryValid(entry)).toBe(true)
  })

  it('should return false for old entry without abort controller', () => {
    const entry = {
      refCount: 0,
      timestamp: Date.now() - 100000, // 100 seconds ago (> 30 second TTL)
    }

    expect(isCacheEntryValid(entry)).toBe(false)
  })

  it('should return false for entry with loadError even if recent', () => {
    const testError = new Error('Failed to load resource')
    const entry = {
      refCount: 1,
      timestamp: Date.now(),
      result: { data: undefined, loaded: false, loadError: testError },
    }

    expect(isCacheEntryValid(entry)).toBe(false)
  })

  it('should return false for entry with loadError even with active abort controller', () => {
    const mockController = createMockAbortController()
    const testError = new Error('Failed to load resource')
    const entry = {
      abortController: mockController,
      refCount: 1,
      timestamp: Date.now(),
      result: { data: [], loaded: true, loadError: testError },
    }

    expect(isCacheEntryValid(entry)).toBe(false)
  })
})

describe('isCacheEntryFresh function', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return true for entry created less than TTL ago', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now - 5000, // 5 seconds ago
    }

    expect(isCacheEntryFresh(entry)).toBe(true)
  })

  it('should return true for entry created exactly at current time', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now,
    }

    expect(isCacheEntryFresh(entry)).toBe(true)
  })

  it('should return false for entry created exactly TTL ago', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now - 30000, // Exactly at 30s TTL
    }

    expect(isCacheEntryFresh(entry)).toBe(false)
  })

  it('should return false for entry created more than TTL ago', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now - 60000, // 60 seconds ago
    }

    expect(isCacheEntryFresh(entry)).toBe(false)
  })

  it('should become stale as time passes', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now,
    }

    expect(isCacheEntryFresh(entry)).toBe(true)

    jest.advanceTimersByTime(31000)

    expect(isCacheEntryFresh(entry)).toBe(false)
  })
})

describe('getCacheEntryAge function', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return 0 for entry created at current time', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now,
    }

    expect(getCacheEntryAge(entry)).toBe(0)
  })

  it('should return correct age in milliseconds', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now - 15000, // 15 seconds ago
    }

    expect(getCacheEntryAge(entry)).toBe(15000)
  })

  it('should increase as time passes', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now,
    }

    expect(getCacheEntryAge(entry)).toBe(0)

    jest.advanceTimersByTime(10000)
    expect(getCacheEntryAge(entry)).toBe(10000)

    jest.advanceTimersByTime(5000)
    expect(getCacheEntryAge(entry)).toBe(15000)
  })
})

describe('Ref count management with abort controllers', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should not abort controller if ref count is still positive', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockController = createMockAbortController()
    const key = 'multi-ref-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.setAbortController(key, mockController)
    })

    expect(result.current.getRefCount(key)).toBe(2)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(result.current.getRefCount(key)).toBe(1)
    expect(mockController.abort).not.toHaveBeenCalled()
    expect(result.current.cache[key]?.abortController).toBe(mockController)
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

  it('should handle abort controller with multiple refs', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockController = createMockAbortController()
    const key = 'controller-multi-ref'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.setAbortController(key, mockController)
    })

    expect(result.current.getRefCount(key)).toBe(3)
    expect(result.current.cache[key]?.abortController).toBe(mockController)

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(mockController.abort).not.toHaveBeenCalled()

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(mockController.abort).not.toHaveBeenCalled()

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(mockController.abort).toHaveBeenCalled()
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

  it('should handle abort controller correctly on decrement', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockController = createMockAbortController()

    act(() => {
      result.current.incrementRefCount('controller-key')
      result.current.setAbortController('controller-key', mockController)
    })

    expect(result.current.cache['controller-key']?.abortController).toBeDefined()

    act(() => {
      result.current.decrementRefCount('controller-key')
    })

    expect(result.current.cache['controller-key']?.abortController).toBeUndefined()
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

  it('should handle setting abort controller before incrementing ref count', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockController = createMockAbortController()
    const key = 'controller-first-key'

    act(() => {
      result.current.setAbortController(key, mockController)
    })

    expect(result.current.cache[key]?.abortController).toBe(mockController)

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
    const mockController = createMockAbortController()
    const key = 'preserve-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setAbortController(key, mockController)
      result.current.setResult(key, { metadata: { name: 'pod-1' } }, true)
    })

    expect(result.current.cache[key]?.abortController).toBe(mockController)
    expect(result.current.getRefCount(key)).toBe(1)

    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-2' } }, true)
    })

    expect(result.current.cache[key]?.abortController).toBe(mockController)
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
    const mockController = createMockAbortController()
    const key = 'lifecycle-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setResult(key, { metadata: { name: 'initial-pod' } }, true)
      result.current.setAbortController(key, mockController)
    })

    expect(result.current.getRefCount(key)).toBe(1)
    expect(result.current.cache[key]?.abortController).toBe(mockController)

    act(() => {
      result.current.setResult(key, { metadata: { name: 'updated-pod' } }, true)
    })

    expect((result.current.getResult(key)?.data as any)?.metadata?.name).toBe('updated-pod')

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockController.abort).toHaveBeenCalled()
    expect(result.current.cache[key]?.abortController).toBeUndefined()
  })

  it('should handle multiple components watching same resource', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockController = createMockAbortController()
    const key = 'shared-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setResult(key, { metadata: { name: 'shared-pod' } }, true)
      result.current.setAbortController(key, mockController)
    })

    act(() => {
      result.current.incrementRefCount(key)
    })

    expect(result.current.getRefCount(key)).toBe(2)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockController.abort).not.toHaveBeenCalled()
    expect(result.current.cache[key]?.abortController).toBe(mockController)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(mockController.abort).toHaveBeenCalled()
  })
})
