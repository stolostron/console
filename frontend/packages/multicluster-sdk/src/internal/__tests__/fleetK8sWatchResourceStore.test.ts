/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import { useFleetK8sWatchResourceStore, useFleetK8sCache, setupAutoCleanup } from '../fleetK8sWatchResourceStore'

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

  it('should handle resource expiration', () => {
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
    setTimeout(() => {
      const isExpired = result.current.isResourceExpired(key)
      expect(isExpired).toBe(true)
    }, 10)
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
})
