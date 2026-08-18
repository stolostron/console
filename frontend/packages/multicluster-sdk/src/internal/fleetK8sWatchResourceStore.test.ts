/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import {
  useFleetK8sWatchResourceStore,
  isCacheEntryValid,
  isCacheEntryFresh,
  getCacheEntryAge,
} from './fleetK8sWatchResourceStore'

describe('FleetK8sWatchResourceStore', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  afterEach(() => {
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

  it('should manage poll timer cache', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'test-poll-key'
    const mockTimer = setInterval(() => {}, 10000)

    act(() => {
      result.current.setPollTimer(key, mockTimer)
    })

    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)
    clearInterval(mockTimer)
  })

  it('should clear poll timer', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'test-clear-poll-key'
    const mockTimer = setInterval(() => {}, 10000)

    act(() => {
      result.current.setPollTimer(key, mockTimer)
    })

    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)

    act(() => {
      result.current.clearPollTimer(key)
    })

    expect(result.current.cache[key]?.pollTimer).toBeUndefined()
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

  it('should clear poll timer when ref count reaches zero', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'timer-clear-key'
    const mockTimer = setInterval(() => {}, 10000)

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setPollTimer(key, mockTimer)
    })

    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(result.current.cache[key]?.pollTimer).toBeUndefined()
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

    const secondAccess = result.current.getResult(key)
    expect(secondAccess?.data).toEqual(testData)
    expect(secondAccess?.loaded).toBe(true)
  })

  it('should set poll status and lastPollAt', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'poll-status-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setPollStatus(key, 'Polling')
    })

    expect(result.current.cache[key]?.pollStatus).toBe('Polling')
    expect(result.current.cache[key]?.lastPollAt).toBeDefined()
  })
})

describe('isCacheEntryValid function', () => {
  beforeEach(() => {
    jest.useRealTimers()
  })

  it('should return true for entry with active poll timer', () => {
    const mockTimer = setInterval(() => {}, 10000)
    const entry = {
      pollTimer: mockTimer,
      refCount: 1,
      timestamp: Date.now() - 100000,
      result: { data: undefined, loaded: false },
    }

    expect(isCacheEntryValid(entry)).toBe(true)
    clearInterval(mockTimer)
  })

  it('should return true for recent entry without poll timer', () => {
    const entry = {
      refCount: 0,
      timestamp: Date.now() - 1000,
    }

    expect(isCacheEntryValid(entry)).toBe(true)
  })

  it('should return false for old entry without poll timer', () => {
    const entry = {
      refCount: 0,
      timestamp: Date.now() - 100000,
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

  it('should return false for entry with loadError even with active poll timer', () => {
    const mockTimer = setInterval(() => {}, 10000)
    const testError = new Error('Failed to load resource')
    const entry = {
      pollTimer: mockTimer,
      refCount: 1,
      timestamp: Date.now(),
      result: { data: [], loaded: true, loadError: testError },
    }

    expect(isCacheEntryValid(entry)).toBe(false)
    clearInterval(mockTimer)
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
      timestamp: now - 5000,
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
      timestamp: now - 30000,
    }

    expect(isCacheEntryFresh(entry)).toBe(false)
  })

  it('should return false for entry created more than TTL ago', () => {
    const now = Date.now()
    jest.setSystemTime(now)

    const entry = {
      refCount: 1,
      timestamp: now - 60000,
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
      timestamp: now - 15000,
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

describe('Ref count management with poll timers', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should not clear poll timer if ref count is still positive', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockTimer = setInterval(() => {}, 10000)
    const key = 'multi-ref-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.setPollTimer(key, mockTimer)
    })

    expect(result.current.getRefCount(key)).toBe(2)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(result.current.getRefCount(key)).toBe(1)
    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)
    clearInterval(mockTimer)
  })

  it('should prevent ref count from going negative', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'negative-ref-key'

    act(() => {
      result.current.decrementRefCount(key)
    })

    const refCount = result.current.getRefCount(key)
    expect(refCount === undefined || refCount === 0).toBe(true)
  })

  it('should handle poll timer with multiple refs', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockTimer = setInterval(() => {}, 10000)
    const key = 'timer-multi-ref'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.incrementRefCount(key)
      result.current.setPollTimer(key, mockTimer)
    })

    expect(result.current.getRefCount(key)).toBe(3)
    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)

    act(() => {
      result.current.decrementRefCount(key)
    })
    expect(result.current.cache[key]?.pollTimer).toBeUndefined()
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

    expect(result.current.getResult(key)).toBeDefined()

    act(() => {
      jest.advanceTimersByTime(41000)
    })

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
      result.current.decrementRefCount(key)
    })

    act(() => {
      jest.advanceTimersByTime(5000)
      result.current.incrementRefCount(key)
    })

    act(() => {
      jest.advanceTimersByTime(40000)
    })

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

    for (let i = 0; i < 100; i++) {
      const entry = result.current.getResult(`key-${i}`)
      expect((entry?.data as any)?.metadata?.name).toBe(`pod-${i}`)
    }

    expect(result.current.getResult('key-0')).toBeDefined()
    expect(result.current.getResult('key-99')).toBeDefined()
  })

  it('should handle concurrent updates to same cache key', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const key = 'concurrent-key'

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.setResult(key, { metadata: { name: 'pod' } } as any, true)
      }
    })

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

    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-2' } }, true)
    })

    expect(result.current.getResourceVersion(key)).toBe('v1')

    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-3' } }, true, undefined, 'v2')
    })

    expect(result.current.getResourceVersion(key)).toBe('v2')
  })

  it('should handle removing non-existent entry', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    act(() => {
      result.current.removeEntry('non-existent-key')
    })

    expect(result.current.getResult('non-existent-key')).toBeUndefined()
  })

  it('should handle touching non-existent entry', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    act(() => {
      result.current.touchEntry('new-touch-key')
    })

    const entry = useFleetK8sWatchResourceStore.getState().cache['new-touch-key']
    expect(entry).toBeDefined()
    expect(entry.timestamp).toBeDefined()
  })

  it('should handle decrement on non-existent entry gracefully', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())

    act(() => {
      result.current.decrementRefCount('non-existent-ref')
    })

    expect(result.current.getResult('non-existent-ref')).toBeUndefined()
  })

  it('should update result data while preserving other cache entry properties', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockTimer = setInterval(() => {}, 10000)
    const key = 'preserve-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setPollTimer(key, mockTimer)
      result.current.setResult(key, { metadata: { name: 'pod-1' } }, true)
    })

    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)
    expect(result.current.getRefCount(key)).toBe(1)

    act(() => {
      result.current.setResult(key, { metadata: { name: 'pod-2' } }, true)
    })

    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)
    expect(result.current.getRefCount(key)).toBe(1)
    expect((result.current.getResult(key)?.data as any)?.metadata?.name).toBe('pod-2')
    clearInterval(mockTimer)
  })
})

describe('Integration scenarios', () => {
  beforeEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  afterEach(() => {
    useFleetK8sWatchResourceStore.setState({ cache: {} })
  })

  it('should handle full lifecycle: create, poll, update, stop', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockTimer = setInterval(() => {}, 10000)
    const key = 'lifecycle-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setResult(key, { metadata: { name: 'initial-pod' } }, true)
      result.current.setPollTimer(key, mockTimer)
    })

    expect(result.current.getRefCount(key)).toBe(1)
    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)

    act(() => {
      result.current.setResult(key, { metadata: { name: 'updated-pod' } }, true)
    })

    expect((result.current.getResult(key)?.data as any)?.metadata?.name).toBe('updated-pod')

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(result.current.cache[key]?.pollTimer).toBeUndefined()
  })

  it('should handle multiple components watching same resource', () => {
    const { result } = renderHook(() => useFleetK8sWatchResourceStore())
    const mockTimer = setInterval(() => {}, 10000)
    const key = 'shared-key'

    act(() => {
      result.current.incrementRefCount(key)
      result.current.setResult(key, { metadata: { name: 'shared-pod' } }, true)
      result.current.setPollTimer(key, mockTimer)
    })

    act(() => {
      result.current.incrementRefCount(key)
    })

    expect(result.current.getRefCount(key)).toBe(2)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(result.current.cache[key]?.pollTimer).toBe(mockTimer)

    act(() => {
      result.current.decrementRefCount(key)
    })

    expect(result.current.cache[key]?.pollTimer).toBeUndefined()
  })
})
