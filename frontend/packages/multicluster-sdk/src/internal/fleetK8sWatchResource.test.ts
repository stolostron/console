/* Copyright Contributors to the Open Cluster Management project */

import { handleWebsocketEvent, useGetInitialResult, startWatch, stopWatch, subscribe } from './fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'
import type { K8sResourceCommon, K8sModel } from '@openshift-console/dynamic-plugin-sdk'
import type { FleetWatchK8sResource } from '../types'
import { renderHook } from '@testing-library/react-hooks'
import { NO_FLEET_AVAILABLE_ERROR } from './constants'

// Mock console methods
const originalConsoleWarn = console.warn
const originalConsoleError = console.error
const mockConsoleWarn = jest.fn()
const mockConsoleError = jest.fn()

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2

  private _readyState = MockWebSocket.CONNECTING
  url: string
  onmessage: ((event: any) => void) | null = null
  onclose: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

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

// Mock the hooks used by useGetInitialResult
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

  // Clear the store - use setState to ensure clean state
  useFleetK8sWatchResourceStore.setState({ cache: {} })

  // Clear mocks
  mockConsoleFetchJSON.mockClear()
  ;(apiRequests.buildResourceURL as jest.Mock).mockClear()
  ;(apiRequests.fleetWatch as jest.Mock).mockClear()

  // Set default mock return values for hooks
  mockUseIsFleetAvailable.mockReturnValue(true)
  mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
})

afterEach(() => {
  console.warn = originalConsoleWarn
  console.error = originalConsoleError

  // Clear the store
  const store = useFleetK8sWatchResourceStore.getState()
  Object.keys(store.cache).forEach((key) => {
    const socket = store.cache[key]?.socket
    if (socket) {
      socket.close()
    }
  })
  useFleetK8sWatchResourceStore.setState({ cache: {} })
})

describe('handleWebsocketEvent', () => {
  const mockRequestPath = 'test-request-path'
  const mockCluster = 'test-cluster'

  it('should handle WebSocket events for single resources', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const event = {
      data: JSON.stringify({
        type: 'ADDED',
        object: mockPod,
      }),
    }

    // For single resource, there should be NO initial data
    handleWebsocketEvent(event, mockRequestPath, false, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    const cachedResult = store.getResult(mockRequestPath)

    expect(cachedResult?.data).toEqual({
      cluster: mockCluster,
      ...mockPod,
    })
    expect(cachedResult?.loaded).toBe(true)
  })

  it('should handle WebSocket events for list resources - ADDED', () => {
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

    // Setup initial list - for list resources, we need initial data
    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: mockCluster, ...mockPod1 }], true)

    // Add second pod
    const addEvent = {
      data: JSON.stringify({
        type: 'ADDED',
        object: mockPod2,
      }),
    }

    handleWebsocketEvent(addEvent, mockRequestPath, true, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult?.data).toHaveLength(2)
    expect(cachedResult?.data).toContainEqual({ cluster: mockCluster, ...mockPod2 })
  })

  it('should handle WebSocket events for list resources - DELETED', () => {
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

    // Setup initial list with two pods
    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(
      mockRequestPath,
      [
        { cluster: mockCluster, ...mockPod1 },
        { cluster: mockCluster, ...mockPod2 },
      ],
      true
    )

    // Delete first pod
    const deleteEvent = {
      data: JSON.stringify({
        type: 'DELETED',
        object: mockPod1,
      }),
    }

    handleWebsocketEvent(deleteEvent, mockRequestPath, true, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult?.data).toHaveLength(1)
    expect((cachedResult?.data as any)[0]).toEqual({ cluster: mockCluster, ...mockPod2 })
  })

  it('should handle WebSocket events for list resources - MODIFIED', () => {
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

    // Setup initial list
    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: mockCluster, ...mockPod }], true)

    // Modify pod
    const modifyEvent = {
      data: JSON.stringify({
        type: 'MODIFIED',
        object: modifiedPod,
      }),
    }

    handleWebsocketEvent(modifyEvent, mockRequestPath, true, mockCluster)

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

    const bookmarkEvent = {
      data: JSON.stringify({
        type: 'BOOKMARK',
        object: {
          metadata: { resourceVersion: '2000' },
        },
      }),
    }

    handleWebsocketEvent(bookmarkEvent, mockRequestPath, true, mockCluster)

    const resourceVersion = store.getResourceVersion(mockRequestPath)
    expect(resourceVersion).toBe('2000')
  })

  it('should handle invalid events gracefully', () => {
    // Test undefined event
    handleWebsocketEvent(undefined, mockRequestPath, false, mockCluster)
    expect(mockConsoleWarn).toHaveBeenCalledWith('Received undefined event', undefined)

    // Test event without object
    const eventWithoutObject = {
      data: JSON.stringify({ type: 'ADDED' }),
    }

    handleWebsocketEvent(eventWithoutObject, mockRequestPath, false, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    // Should not create an entry since there's no object
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

    const eventWithoutUid = {
      data: JSON.stringify({
        type: 'ADDED',
        object: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod' }, // No uid
        },
      }),
    }

    handleWebsocketEvent(eventWithoutUid, mockRequestPath, true, mockCluster)

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

    const event = {
      data: JSON.stringify({
        type: 'ADDED',
        object: mockPod,
      }),
    }

    handleWebsocketEvent(event, mockRequestPath, false, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    // Should not change since we already have data
    expect(cachedResult?.data).toEqual({ cluster: mockCluster, ...mockPod })
  })

  it('should return early for DELETED event when list data is not present', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const deleteEvent = {
      data: JSON.stringify({
        type: 'DELETED',
        object: mockPod,
      }),
    }

    handleWebsocketEvent(deleteEvent, mockRequestPath, true, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    // Should not crash or create entry
    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult).toBeUndefined()
  })

  it('should return early for ADDED/MODIFIED event when list data is not present', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const addEvent = {
      data: JSON.stringify({
        type: 'ADDED',
        object: mockPod,
      }),
    }

    handleWebsocketEvent(addEvent, mockRequestPath, true, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    // Should not create entry since there's no initial data
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

  it('should fetch initial data and open WebSocket on first watch', async () => {
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

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

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

    // Pre-populate cache
    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)
    store.incrementRefCount(mockRequestPath)

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Should not fetch since cache is valid
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

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

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

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.data).toEqual({ cluster: 'test-cluster', ...mockPod })
    expect(result?.loaded).toBe(true)
  })

  it('should close WebSocket and decrement ref count on stopWatch', () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.incrementRefCount(mockRequestPath)
    store.setSocket(mockRequestPath, mockSocket as any)

    stopWatch(mockResource, mockModel, mockBasePath)

    expect(store.getRefCount(mockRequestPath)).toBe(0)
    expect(mockSocket.close).toHaveBeenCalled()
  })

  it('should not fetch or open socket on subsequent watches', async () => {
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

    // Setup first watch
    const store = useFleetK8sWatchResourceStore.getState()
    store.incrementRefCount(mockRequestPath)
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    store.setSocket(mockRequestPath, mockSocket as any)

    // Start second watch
    await startWatch(mockResource, mockModel, mockBasePath)

    // Should not fetch or open new socket
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

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    const setResult = jest.fn()

    // Subscribe to updates
    const unsubscribe = subscribe(mockResource, mockRequestPath, setResult)

    // Start the watch
    await startWatch(mockResource, mockModel, mockBasePath)

    // Give time for subscription to trigger
    await new Promise((resolve) => setTimeout(resolve, 10))

    // setResult should have been called with the initial data
    expect(setResult).toHaveBeenCalled()
    const lastCall = setResult.mock.calls[setResult.mock.calls.length - 1][0]
    expect(lastCall.data).toEqual([{ cluster: 'test-cluster', ...mockPod }])
    expect(lastCall.loaded).toBe(true)

    // Cleanup
    unsubscribe()
  })
})
