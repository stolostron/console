/* Copyright Contributors to the Open Cluster Management project */

import { handleWatchEvent, useGetInitialResult, startWatch, stopWatch, subscribe } from './fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'
import type { K8sResourceCommon, K8sModel } from '@openshift-console/dynamic-plugin-sdk'
import type { FleetWatchK8sResource } from '../types'
import { renderHook } from '@testing-library/react-hooks'
import { NO_FLEET_AVAILABLE_ERROR } from './constants'

const originalConsoleWarn = console.warn
const originalConsoleError = console.error
const mockConsoleWarn = jest.fn()
const mockConsoleError = jest.fn()

// Mock apiRequests
jest.mock('./apiRequests', () => ({
  buildResourceURL: jest.fn(),
  fleetWatch: jest.fn(),
}))

// Mock consoleFetchJSON
const mockConsoleFetchJSON = jest.fn()
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'),
  consoleFetchJSON: (...args: any[]) => mockConsoleFetchJSON(...args),
}))

const mockUseIsFleetAvailable = jest.fn()
const mockUseHubClusterName = jest.fn()

jest.mock('../api', () => ({
  useIsFleetAvailable: () => mockUseIsFleetAvailable(),
  useHubClusterName: () => mockUseHubClusterName(),
}))

// Import after mocking
import * as apiRequests from './apiRequests'

beforeEach(() => {
  console.warn = mockConsoleWarn
  console.error = mockConsoleError
  mockConsoleWarn.mockClear()
  mockConsoleError.mockClear()

  useFleetK8sWatchResourceStore.setState({ cache: {} })

  mockConsoleFetchJSON.mockClear()
  ;(apiRequests.buildResourceURL as jest.Mock).mockClear()
  ;(apiRequests.fleetWatch as jest.Mock).mockClear()

  mockUseIsFleetAvailable.mockReturnValue(true)
  mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
})

afterEach(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError

  const store = useFleetK8sWatchResourceStore.getState()
  Object.keys(store.cache).forEach((key) => {
    store.cache[key]?.abortController?.abort()
  })
  useFleetK8sWatchResourceStore.setState({ cache: {} })
})

describe('handleWatchEvent', () => {
  const mockRequestPath = 'test-request-path'
  const mockCluster = 'test-cluster'

  it('should handle watch events for single resources', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    handleWatchEvent({ type: 'ADDED', object: mockPod }, mockRequestPath, false, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    const cachedResult = store.getResult(mockRequestPath)

    expect(cachedResult?.data).toEqual({
      cluster: mockCluster,
      ...mockPod,
    })
    expect(cachedResult?.loaded).toBe(true)
  })

  it('should handle watch events for list resources - ADDED', () => {
    const mockPod1: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'pod-1', uid: 'uid-1' },
    }

    const mockPod2: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'pod-2', uid: 'uid-2' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: mockCluster, ...mockPod1 }], true)

    handleWatchEvent({ type: 'ADDED', object: mockPod2 }, mockRequestPath, true, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult?.data).toHaveLength(2)
    expect(cachedResult?.data).toContainEqual({ cluster: mockCluster, ...mockPod2 })
  })

  it('should handle watch events for list resources - DELETED', () => {
    const mockPod1: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'pod-1', uid: 'uid-1' },
    }

    const mockPod2: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'pod-2', uid: 'uid-2' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(
      mockRequestPath,
      [
        { cluster: mockCluster, ...mockPod1 },
        { cluster: mockCluster, ...mockPod2 },
      ],
      true
    )

    handleWatchEvent({ type: 'DELETED', object: mockPod1 }, mockRequestPath, true, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult?.data).toHaveLength(1)
    expect((cachedResult?.data as any)[0]).toEqual({ cluster: mockCluster, ...mockPod2 })
  })

  it('should handle watch events for list resources - MODIFIED', () => {
    const mockPod = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
      status: { phase: 'Pending' },
    }

    const modifiedPod = {
      ...mockPod,
      status: { phase: 'Running' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: mockCluster, ...mockPod }], true)

    handleWatchEvent({ type: 'MODIFIED', object: modifiedPod }, mockRequestPath, true, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult?.data).toHaveLength(1)
    expect((cachedResult?.data as any)[0]).toEqual({ cluster: mockCluster, ...modifiedPod })
  })

  it('should handle BOOKMARK events and update resource version', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: mockCluster, ...mockPod }], true, undefined, '1000')

    handleWatchEvent(
      { type: 'BOOKMARK', object: { metadata: { resourceVersion: '2000' } } },
      mockRequestPath,
      true,
      mockCluster
    )

    const resourceVersion = store.getResourceVersion(mockRequestPath)
    expect(resourceVersion).toBe('2000')
  })

  it('should handle invalid events gracefully', () => {
    handleWatchEvent(undefined, mockRequestPath, false, mockCluster)
    expect(mockConsoleWarn).toHaveBeenCalledWith('Received undefined event', undefined)

    handleWatchEvent({ type: 'ADDED', object: undefined }, mockRequestPath, false, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult).toBeUndefined()
  })

  it('should warn when event object does not have metadata.uid for ADDED/MODIFIED', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: mockCluster, ...mockPod }], true)

    handleWatchEvent(
      { type: 'ADDED', object: { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'test-pod' } } },
      mockRequestPath,
      true,
      mockCluster
    )

    expect(mockConsoleWarn).toHaveBeenCalledWith('Event object does not have a metadata.uid', expect.any(Object))
  })

  it('should not add duplicate ADDED event for single resources', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, { cluster: mockCluster, ...mockPod }, true)

    handleWatchEvent({ type: 'ADDED', object: mockPod }, mockRequestPath, false, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult?.data).toEqual({ cluster: mockCluster, ...mockPod })
  })

  it('should return early for DELETED event when list data is not present', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    handleWatchEvent({ type: 'DELETED', object: mockPod }, mockRequestPath, true, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult).toBeUndefined()
  })

  it('should return early for ADDED/MODIFIED event when list data is not present', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    handleWatchEvent({ type: 'ADDED', object: mockPod }, mockRequestPath, true, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult).toBeUndefined()
  })
})

describe('useGetInitialResult', () => {
  const mockModel: K8sModel = {
    apiVersion: 'v1',
    apiGroup: 'core',
    kind: 'Pod',
    plural: 'pods',
    namespaced: true,
    abbr: 'P',
    label: 'Pod',
    labelPlural: 'Pods',
  }
  const mockBasePath = '/api/fleet'

  it('should return cached result if valid', () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockRequestPath = '/api/fleet/api/v1/namespaces/default/pods'
    ;(apiRequests.buildResourceURL as jest.Mock).mockReturnValue(mockRequestPath)

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)

    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current
    const resultValue = getInitialResult(mockResource, mockModel, mockBasePath)

    expect(resultValue.data).toEqual([{ cluster: 'test-cluster', ...mockPod }])
    expect(resultValue.loaded).toBe(true)
  })

  it('should return default data for list if cache is not valid', () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockRequestPath = '/api/fleet/api/v1/namespaces/default/pods'
    ;(apiRequests.buildResourceURL as jest.Mock).mockReturnValue(mockRequestPath)

    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current
    const resultValue = getInitialResult(mockResource, mockModel, mockBasePath)

    expect(resultValue.data).toEqual([])
    expect(resultValue.loaded).toBe(false)
  })

  it('should return default data for single resource if cache is not valid', () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-pod',
      isList: false,
    }

    const mockRequestPath = '/api/fleet/api/v1/namespaces/default/pods/test-pod'
    ;(apiRequests.buildResourceURL as jest.Mock).mockReturnValue(mockRequestPath)

    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current
    const resultValue = getInitialResult(mockResource, mockModel, mockBasePath)

    expect(resultValue.data).toBeUndefined()
    expect(resultValue.loaded).toBe(false)
  })

  it('should return default data when resource, model, or basePath is missing', () => {
    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current

    const result1 = getInitialResult(null, mockModel, mockBasePath)
    expect(result1.data).toBeUndefined()
    expect(result1.loaded).toBe(false)

    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const result2 = getInitialResult(mockResource, mockModel, mockBasePath)
    expect(result2.data).toEqual([])
    expect(result2.loaded).toBe(false)

    const result3 = getInitialResult(mockResource, mockModel, undefined)
    expect(result3.data).toEqual([])
    expect(result3.loaded).toBe(false)
  })

  it('should return hub cluster name load error when waiting for hub cluster name', () => {
    const mockError = new Error('Failed to load hub cluster name')
    mockUseHubClusterName.mockReturnValue(['', false, mockError])

    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current
    const resultValue = getInitialResult(mockResource, mockModel, mockBasePath)

    expect(resultValue.data).toEqual([])
    expect(resultValue.loaded).toBe(false)
    expect(resultValue.loadError).toBe(mockError)
  })

  it('should return NO_FLEET_AVAILABLE_ERROR when fleet is not available for remote cluster query', () => {
    mockUseIsFleetAvailable.mockReturnValue(false)
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])

    const mockResource: FleetWatchK8sResource = {
      cluster: 'remote-cluster',
      namespace: 'default',
      isList: true,
    }

    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current
    const resultValue = getInitialResult(mockResource, mockModel, mockBasePath)

    expect(resultValue.data).toEqual([])
    expect(resultValue.loaded).toBe(false)
    expect(resultValue.loadError).toBe(NO_FLEET_AVAILABLE_ERROR)
  })

  it('should not return error when cluster matches hub cluster name', () => {
    mockUseIsFleetAvailable.mockReturnValue(false)
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])

    const mockResource: FleetWatchK8sResource = {
      cluster: 'hub-cluster',
      namespace: 'default',
      isList: true,
    }

    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current
    const resultValue = getInitialResult(mockResource, mockModel, mockBasePath)

    expect(resultValue.data).toEqual([])
    expect(resultValue.loaded).toBe(false)
    expect(resultValue.loadError).toBeUndefined()
  })

  it('should not return error when no cluster is specified', () => {
    mockUseIsFleetAvailable.mockReturnValue(false)
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])

    const mockResource: FleetWatchK8sResource = {
      namespace: 'default',
      isList: true,
    }

    const { result } = renderHook(() => useGetInitialResult())
    const getInitialResult = result.current
    const resultValue = getInitialResult(mockResource, mockModel, mockBasePath)

    expect(resultValue.data).toEqual([])
    expect(resultValue.loaded).toBe(false)
    expect(resultValue.loadError).toBeUndefined()
  })
})

describe('startWatch and stopWatch', () => {
  const mockModel: K8sModel = {
    apiVersion: 'v1',
    apiGroup: 'core',
    kind: 'Pod',
    plural: 'pods',
    namespaced: true,
    abbr: 'P',
    label: 'Pod',
    labelPlural: 'Pods',
  }
  const mockBasePath = '/api/fleet'
  const mockRequestPath = '/api/fleet/api/v1/namespaces/default/pods'

  beforeEach(() => {
    ;(apiRequests.buildResourceURL as jest.Mock).mockReturnValue(mockRequestPath)
  })

  it('should fetch initial data and open watch stream on first watch', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid', resourceVersion: '1000' },
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '1000' },
    })

    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockAbortController)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(mockConsoleFetchJSON).toHaveBeenCalledWith(mockRequestPath, 'GET')
    expect(apiRequests.fleetWatch).toHaveBeenCalled()

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.data).toEqual([{ cluster: 'test-cluster', ...mockPod }])
    expect(result?.loaded).toBe(true)
    expect(store.getResourceVersion(mockRequestPath)).toBe('1000')
    expect(store.getRefCount(mockRequestPath)).toBe(1)
  })

  it('should not fetch initial data if cache is valid', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)
    store.incrementRefCount(mockRequestPath)

    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockAbortController)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(store.getRefCount(mockRequestPath)).toBe(2)
  })

  it('should handle fetch errors', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockError = new Error('Fetch failed')
    mockConsoleFetchJSON.mockRejectedValue(mockError)

    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockAbortController)

    await startWatch(mockResource, mockModel, mockBasePath)

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.data).toEqual([])
    expect(result?.loaded).toBe(true)
    expect(result?.loadError).toBe(mockError)
  })

  it('should process single resource without items array', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-pod',
      isList: false,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    mockConsoleFetchJSON.mockResolvedValue(mockPod)

    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockAbortController)

    await startWatch(mockResource, mockModel, mockBasePath)

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.data).toEqual({ cluster: 'test-cluster', ...mockPod })
    expect(result?.loaded).toBe(true)
  })

  it('should abort controller and decrement ref count on stopWatch', () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockAbortController = new AbortController()
    jest.spyOn(mockAbortController, 'abort')

    const store = useFleetK8sWatchResourceStore.getState()
    store.incrementRefCount(mockRequestPath)
    store.setAbortController(mockRequestPath, mockAbortController)

    stopWatch(mockResource, mockModel, mockBasePath)

    expect(store.getRefCount(mockRequestPath)).toBe(0)
    expect(mockAbortController.abort).toHaveBeenCalled()
  })

  it('should not fetch or open stream on subsequent watches', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.incrementRefCount(mockRequestPath)
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)

    const mockAbortController = new AbortController()
    store.setAbortController(mockRequestPath, mockAbortController)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()
    expect(store.getRefCount(mockRequestPath)).toBe(2)
  })

  it('should call setResult callback when store is updated', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '1000' },
    })

    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockAbortController)

    const setResult = jest.fn()

    const unsubscribe = subscribe(mockResource, mockRequestPath, setResult)

    await startWatch(mockResource, mockModel, mockBasePath)

    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(setResult).toHaveBeenCalled()
    const lastCall = setResult.mock.calls[setResult.mock.calls.length - 1][0]
    expect(lastCall.data).toEqual([{ cluster: 'test-cluster', ...mockPod }])
    expect(lastCall.loaded).toBe(true)

    unsubscribe()
  })

  it('should not open stream when initial data load fails', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockError = new Error('Network error')
    mockConsoleFetchJSON.mockRejectedValue(mockError)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loadError).toBe(mockError)
  })

  it('should open stream when valid cache exists', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)

    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockAbortController)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(apiRequests.fleetWatch).toHaveBeenCalled()
  })
})

describe('Stream reconnection behavior', () => {
  const mockModel: K8sModel = {
    apiVersion: 'v1',
    apiGroup: 'core',
    kind: 'Pod',
    plural: 'pods',
    namespaced: true,
    abbr: 'P',
    label: 'Pod',
    labelPlural: 'Pods',
  }
  const mockBasePath = '/api/fleet'
  const mockRequestPath = '/api/fleet/api/v1/namespaces/default/pods'

  beforeEach(() => {
    jest.useFakeTimers()
    ;(apiRequests.buildResourceURL as jest.Mock).mockReturnValue(mockRequestPath)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should reconnect when stream closes cleanly without re-listing', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '1000' },
    })

    let capturedCallbacks: any
    const mockAbortController1 = new AbortController()
    const mockAbortController2 = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock)
      .mockImplementationOnce((_model: any, _query: any, _basePath: any, callbacks: any) => {
        capturedCallbacks = callbacks
        return mockAbortController1
      })
      .mockReturnValueOnce(mockAbortController2)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)

    ;(apiRequests.fleetWatch as jest.Mock).mockClear()
    mockConsoleFetchJSON.mockClear()

    capturedCallbacks.onClose()

    await jest.advanceTimersByTimeAsync(10)

    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)
  })

  it('should not reconnect when refCount is 0', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '1000' },
    })

    let capturedCallbacks: any
    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockImplementationOnce(
      (_model: any, _query: any, _basePath: any, callbacks: any) => {
        capturedCallbacks = callbacks
        return mockAbortController
      }
    )

    await startWatch(mockResource, mockModel, mockBasePath)

    stopWatch(mockResource, mockModel, mockBasePath)

    ;(apiRequests.fleetWatch as jest.Mock).mockClear()
    mockConsoleFetchJSON.mockClear()

    capturedCallbacks.onClose()

    await jest.advanceTimersByTimeAsync(10)

    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()
  })

  it('should reconnect after delay on stream error', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '1000' },
    })

    let capturedCallbacks: any
    const mockAbortController1 = new AbortController()
    const mockAbortController2 = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock)
      .mockImplementationOnce((_model: any, _query: any, _basePath: any, callbacks: any) => {
        capturedCallbacks = callbacks
        return mockAbortController1
      })
      .mockReturnValueOnce(mockAbortController2)

    await startWatch(mockResource, mockModel, mockBasePath)

    ;(apiRequests.fleetWatch as jest.Mock).mockClear()
    mockConsoleFetchJSON.mockClear()

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '2000' },
    })

    capturedCallbacks.onError(new Error('Stream disconnected'))

    await jest.advanceTimersByTimeAsync(100)
    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(5000)

    expect(mockConsoleFetchJSON).toHaveBeenCalled()
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)
  })

  it('should not open new stream if reload fails during reconnection', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    mockConsoleFetchJSON.mockResolvedValueOnce({
      items: [mockPod],
      metadata: { resourceVersion: '1000' },
    })

    let capturedCallbacks: any
    const mockAbortController = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock).mockImplementationOnce(
      (_model: any, _query: any, _basePath: any, callbacks: any) => {
        capturedCallbacks = callbacks
        return mockAbortController
      }
    )

    await startWatch(mockResource, mockModel, mockBasePath)

    mockConsoleFetchJSON.mockRejectedValue(new Error('Network error'))
    ;(apiRequests.fleetWatch as jest.Mock).mockClear()

    capturedCallbacks.onError(new Error('Stream disconnected'))

    await jest.advanceTimersByTimeAsync(5100)

    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loadError).toBeDefined()
  })

  it('should immediately re-list on 410 Gone error', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '1000' },
    })

    let capturedCallbacks: any
    const mockAbortController1 = new AbortController()
    const mockAbortController2 = new AbortController()
    ;(apiRequests.fleetWatch as jest.Mock)
      .mockImplementationOnce((_model: any, _query: any, _basePath: any, callbacks: any) => {
        capturedCallbacks = callbacks
        return mockAbortController1
      })
      .mockReturnValueOnce(mockAbortController2)

    await startWatch(mockResource, mockModel, mockBasePath)

    ;(apiRequests.fleetWatch as jest.Mock).mockClear()
    mockConsoleFetchJSON.mockClear()

    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '2000' },
    })

    capturedCallbacks.onError({ type: 'GONE', status: 410 })

    await jest.advanceTimersByTimeAsync(10)

    expect(mockConsoleFetchJSON).toHaveBeenCalled()
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)
  })
})
