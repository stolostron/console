/* Copyright Contributors to the Open Cluster Management project */

// Import after mocking
import * as apiRequests from './apiRequests'

import type { K8sModel, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import {
  getErrorRetryInterval,
  getSocketMonitoringInterval,
  useFleetK8sWatchResourceStore,
} from './fleetK8sWatchResourceStore'
import { handleWebsocketEvent, startWatch, stopWatch, subscribe, useGetInitialResult } from './fleetK8sWatchResource'

import type { FleetWatchK8sResource } from '../types'
import { NO_FLEET_AVAILABLE_ERROR } from './constants'
import { renderHook } from '@testing-library/react-hooks'

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

  it('should return true for single resource DELETED to signal caller to GET', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, { cluster: mockCluster, ...mockPod }, true)

    const deleteEvent = {
      data: JSON.stringify({
        type: 'DELETED',
        object: mockPod,
      }),
    }

    const shouldRefresh = handleWebsocketEvent(deleteEvent, mockRequestPath, false, mockCluster)

    // Should signal caller to perform a GET (to confirm 404) without modifying store
    expect(shouldRefresh).toBe(true)
    const cachedResult = store.getResult(mockRequestPath)
    expect(cachedResult?.data).toEqual({ cluster: mockCluster, ...mockPod })
    expect(cachedResult?.loaded).toBe(true)
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

  it('should replace single resource on ADDED event regardless of UID match', () => {
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
    expect(cachedResult?.data).toEqual({ cluster: mockCluster, ...mockPod })
  })

  it('should replace single resource when recreated with a new UID', () => {
    const originalPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'original-uid', resourceVersion: '100' },
    }

    const recreatedPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'new-uid-after-recreate', resourceVersion: '200' },
    }

    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, { cluster: mockCluster, ...originalPod }, true)

    const event = {
      data: JSON.stringify({
        type: 'ADDED',
        object: recreatedPod,
      }),
    }

    handleWebsocketEvent(event, mockRequestPath, false, mockCluster)

    const cachedResult = store.getResult(mockRequestPath)
    // Should replace with the recreated resource even though UID differs
    expect(cachedResult?.data).toEqual({ cluster: mockCluster, ...recreatedPod })
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

  it('should not open socket when initial data load fails', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockError = new Error('Network error')
    mockConsoleFetchJSON.mockRejectedValue(mockError)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Socket should not be opened when initial load fails
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loadError).toBe(mockError)
  })

  it('should open socket when valid cache exists', async () => {
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

    // Pre-populate cache with valid data (no socket, recent timestamp)
    const store = useFleetK8sWatchResourceStore.getState()
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)

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
    // But should still open socket
    expect(apiRequests.fleetWatch).toHaveBeenCalled()
  })
})

describe('Socket monitoring behavior', () => {
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

  it('should schedule monitoring check after starting watch', async () => {
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

    await startWatch(mockResource, mockModel, mockBasePath)

    // Verify initial socket was opened
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)

    // Clear mock to track subsequent calls
    ;(apiRequests.fleetWatch as jest.Mock).mockClear()
    mockConsoleFetchJSON.mockClear()

    // Advance time past the monitoring interval and flush async
    await jest.advanceTimersByTimeAsync(getSocketMonitoringInterval() + 1000)

    // The monitor should have checked - since data is now stale,
    // it should attempt to reload and reconnect
    expect(mockConsoleFetchJSON).toHaveBeenCalled()
  })

  it('should stop monitoring when refCount reaches 0', async () => {
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

    await startWatch(mockResource, mockModel, mockBasePath)

    // Stop watching (refCount goes to 0)
    stopWatch(mockResource, mockModel, mockBasePath)

    // Clear mocks
    ;(apiRequests.fleetWatch as jest.Mock).mockClear()
    mockConsoleFetchJSON.mockClear()

    // Advance time past the monitoring interval
    await jest.advanceTimersByTimeAsync(35000)

    // No reconnection should happen since refCount is 0
    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()
  })

  it('should close stale socket and reconnect when cache becomes stale', async () => {
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

    const mockSocket1 = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    const mockSocket2 = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValueOnce(mockSocket1).mockReturnValueOnce(mockSocket2)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Verify initial socket was opened
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)

    // Advance time past the monitoring interval
    await jest.advanceTimersByTimeAsync(getSocketMonitoringInterval() + 1000)

    // Old socket should be closed
    expect(mockSocket1.close).toHaveBeenCalled()

    // New socket should be opened after successful reload
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(2)
  })

  it('should not open new socket if reload fails during monitoring', async () => {
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

    // First call succeeds
    mockConsoleFetchJSON.mockResolvedValueOnce({
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

    // Subsequent calls fail (network offline)
    mockConsoleFetchJSON.mockRejectedValue(new Error('Network error'))
    ;(apiRequests.fleetWatch as jest.Mock).mockClear()

    // Advance time past the monitoring interval
    await jest.advanceTimersByTimeAsync(getSocketMonitoringInterval() + 1000)

    // Socket should be closed
    expect(mockSocket.close).toHaveBeenCalled()

    // New socket should NOT be opened since reload failed
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()

    // Error should be set in store
    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loadError).toBeDefined()
  })

  it('should retry after shorter interval when in error state', async () => {
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

    // First call succeeds (use Once so default can be overridden)
    mockConsoleFetchJSON.mockResolvedValueOnce({
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
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)

    // Subsequent calls fail (network offline)
    mockConsoleFetchJSON.mockRejectedValue(new Error('Network error'))
    ;(apiRequests.fleetWatch as jest.Mock).mockClear()

    // Advance past monitoring interval to trigger reconnect attempt (which will fail)
    await jest.advanceTimersByTimeAsync(getSocketMonitoringInterval() + 1000)

    // Socket should be closed and error stored
    expect(mockSocket.close).toHaveBeenCalled()
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()
    const storeAfterError = useFleetK8sWatchResourceStore.getState()
    expect(storeAfterError.getResult(mockRequestPath)?.loadError).toBeDefined()

    // Switch to success for the retry
    mockConsoleFetchJSON.mockResolvedValue({
      items: [mockPod],
      metadata: { resourceVersion: '2000' },
    })

    // Advance by just the error retry interval (not the full monitoring interval)
    // This proves the shorter retry is in effect
    await jest.advanceTimersByTimeAsync(getErrorRetryInterval() + 1000)

    // Should have successfully reconnected after the shorter error interval
    expect(apiRequests.fleetWatch).toHaveBeenCalled()
  })

  it('should continue monitoring after successful reconnection', async () => {
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

    const createMockSocket = () => ({
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    })

    ;(apiRequests.fleetWatch as jest.Mock).mockImplementation(createMockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    // First reconnection
    await jest.advanceTimersByTimeAsync(getSocketMonitoringInterval() + 1000)

    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(2)

    // Second reconnection
    await jest.advanceTimersByTimeAsync(getSocketMonitoringInterval() + 1000)

    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(3)
  })

  it('should handle fresh cache entry by scheduling check for remaining TTL', async () => {
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
      onmessage: null as ((event: any) => void) | null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Simulate WebSocket message that refreshes the timestamp
    const store = useFleetK8sWatchResourceStore.getState()

    // Advance 15 seconds
    await jest.advanceTimersByTimeAsync(15000)

    // Simulate a message updating the store (which refreshes timestamp)
    store.setResult(mockRequestPath, [{ cluster: 'test-cluster', ...mockPod }], true)

    // Clear mocks
    mockConsoleFetchJSON.mockClear()
    ;(apiRequests.fleetWatch as jest.Mock).mockClear()

    // Advance another 16 seconds (total 31 from start, but only 16 from last message)
    await jest.advanceTimersByTimeAsync(16000)

    // The monitoring check should have happened but found fresh data
    // So no reconnection should occur
    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()
  })

  it('should GET on single resource DELETED and keep socket open', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-pod',
      isList: false,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid', resourceVersion: '100' },
    }

    mockConsoleFetchJSON.mockResolvedValueOnce(mockPod)

    const mockSocket = {
      onmessage: null as ((event: any) => void) | null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
      readyState: 1,
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)

    // Set up 404 for the confirmation GET
    const notFoundError = Object.assign(new Error('Not Found'), { code: 404 })
    mockConsoleFetchJSON.mockRejectedValue(notFoundError)

    // Simulate DELETED event from websocket
    mockSocket.onmessage?.({
      data: JSON.stringify({
        type: 'DELETED',
        object: mockPod,
      }),
    })

    // Allow the async loadInitialData to complete
    await jest.advanceTimersByTimeAsync(0)

    // Should have done a GET to confirm the 404
    expect(mockConsoleFetchJSON).toHaveBeenCalledWith(mockRequestPath, 'GET')
    // Socket should NOT be closed — it stays open for future ADDED events
    expect(mockSocket.close).not.toHaveBeenCalled()

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loaded).toBe(true)
    expect(result?.loadError).toBe(notFoundError)
  })

  it('should open socket on startup even when initial GET returns 404', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-pod',
      isList: false,
    }

    // Initial GET returns 404
    const notFoundError = Object.assign(new Error('Not Found'), { code: 404 })
    mockConsoleFetchJSON.mockRejectedValue(notFoundError)

    const mockSocket = {
      onmessage: null as ((event: any) => void) | null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
      readyState: 1,
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Socket should be opened despite 404 (watching collection for future ADDED events)
    expect(apiRequests.fleetWatch).toHaveBeenCalledTimes(1)

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loadError).toBe(notFoundError)
    expect(store.cache[mockRequestPath]?.socket).toBeDefined()
  })

  it('should clear 404 when ADDED event is received', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-pod',
      isList: false,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid', resourceVersion: '200' },
    }

    // Initial GET returns 404
    const notFoundError = Object.assign(new Error('Not Found'), { code: 404 })
    mockConsoleFetchJSON.mockRejectedValue(notFoundError)

    const mockSocket = {
      onmessage: null as ((event: any) => void) | null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
      readyState: 1,
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Verify 404 is stored
    let store = useFleetK8sWatchResourceStore.getState()
    expect(store.getResult(mockRequestPath)?.loadError).toBe(notFoundError)

    // Simulate ADDED event — resource is created
    mockSocket.onmessage?.({
      data: JSON.stringify({
        type: 'ADDED',
        object: mockPod,
      }),
    })

    // 404 error should be cleared, resource data should be stored
    store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loadError).toBeUndefined()
    expect(result?.loaded).toBe(true)
    expect(result?.data).toEqual({ cluster: 'test-cluster', ...mockPod })
  })

  it('should not open socket on startup when non-404 error occurs', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-pod',
      isList: false,
    }

    // Initial GET returns 500
    const serverError = Object.assign(new Error('Internal Server Error'), { code: 500 })
    mockConsoleFetchJSON.mockRejectedValue(serverError)

    const mockSocket = {
      onmessage: null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
      readyState: 1,
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Socket should NOT be opened for non-404 errors
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()
  })

  it('should skip reconnect during monitoring when socket is alive and sending bookmarks', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      name: 'test-pod',
      isList: false,
    }

    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid', resourceVersion: '100' },
    }

    mockConsoleFetchJSON.mockResolvedValueOnce(mockPod)

    const mockSocket = {
      onmessage: null as ((event: any) => void) | null,
      onclose: null,
      onerror: null,
      close: jest.fn(),
      readyState: 1,
    }
    ;(apiRequests.fleetWatch as jest.Mock).mockReturnValue(mockSocket)

    await startWatch(mockResource, mockModel, mockBasePath)

    // Simulate DELETED then 404
    const notFoundError = Object.assign(new Error('Not Found'), { code: 404 })
    mockConsoleFetchJSON.mockRejectedValue(notFoundError)

    mockSocket.onmessage?.({
      data: JSON.stringify({
        type: 'DELETED',
        object: mockPod,
      }),
    })

    await jest.advanceTimersByTimeAsync(0)

    // Confirm 404 is stored
    const store = useFleetK8sWatchResourceStore.getState()
    expect(store.getResult(mockRequestPath)?.loadError).toBe(notFoundError)

    // Clear mocks to track monitoring behavior
    ;(apiRequests.fleetWatch as jest.Mock).mockClear()
    mockSocket.close.mockClear()

    // Simulate a BOOKMARK arriving midway through the monitoring interval
    // This keeps the entry fresh (proves socket is alive)
    await jest.advanceTimersByTimeAsync(30000)
    mockSocket.onmessage?.({
      data: JSON.stringify({
        type: 'BOOKMARK',
        object: { metadata: { resourceVersion: '200' } },
      }),
    })

    // Advance past the first monitoring check (at t=65s) but not the second
    // The BOOKMARK at t=30s makes the entry fresh (age=35s < 65s) when first check fires
    await jest.advanceTimersByTimeAsync(40000)

    // Socket should NOT be closed — bookmarks prove it's alive
    expect(mockSocket.close).not.toHaveBeenCalled()
    // Should NOT attempt to open a new socket
    expect(apiRequests.fleetWatch).not.toHaveBeenCalled()

    // The 404 error should still be preserved (bookmarks don't clear it)
    const storeAfter = useFleetK8sWatchResourceStore.getState()
    expect(storeAfter.getResult(mockRequestPath)?.loadError).toBe(notFoundError)
  })
})
