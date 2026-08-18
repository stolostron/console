/* Copyright Contributors to the Open Cluster Management project */

import { useGetInitialResult, startWatch, stopWatch, subscribe } from './fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'
import type { K8sResourceCommon, K8sModel } from '@openshift-console/dynamic-plugin-sdk'
import type { FleetWatchK8sResource } from '../types'
import { renderHook } from '@testing-library/react-hooks'
import { NO_FLEET_AVAILABLE_ERROR } from './constants'

// Mock apiRequests
jest.mock('./apiRequests', () => ({
  buildResourceURL: jest.fn(),
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
  useFleetK8sWatchResourceStore.setState({ cache: {} })

  mockConsoleFetchJSON.mockClear()
  ;(apiRequests.buildResourceURL as jest.Mock).mockClear()

  mockUseIsFleetAvailable.mockReturnValue(true)
  mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])
})

afterEach(() => {
  const store = useFleetK8sWatchResourceStore.getState()
  Object.keys(store.cache).forEach((key) => {
    if (store.cache[key]?.pollTimer) {
      clearInterval(store.cache[key].pollTimer)
    }
  })
  useFleetK8sWatchResourceStore.setState({ cache: {} })
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

  it('should fetch initial data and start polling on first watch', async () => {
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

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(mockConsoleFetchJSON).toHaveBeenCalledWith(mockRequestPath, 'GET')

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.data).toEqual([{ cluster: 'test-cluster', ...mockPod }])
    expect(result?.loaded).toBe(true)
    expect(store.getResourceVersion(mockRequestPath)).toBe('1000')
    expect(store.getRefCount(mockRequestPath)).toBe(1)
    expect(store.cache[mockRequestPath]?.pollTimer).toBeDefined()
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

    await startWatch(mockResource, mockModel, mockBasePath)

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.data).toEqual({ cluster: 'test-cluster', ...mockPod })
    expect(result?.loaded).toBe(true)
  })

  it('should clear poll timer and decrement ref count on stopWatch', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [],
      metadata: { resourceVersion: '1000' },
    })

    await startWatch(mockResource, mockModel, mockBasePath)

    const store = useFleetK8sWatchResourceStore.getState()
    expect(store.cache[mockRequestPath]?.pollTimer).toBeDefined()

    stopWatch(mockResource, mockModel, mockBasePath)

    const storeAfter = useFleetK8sWatchResourceStore.getState()
    expect(storeAfter.getRefCount(mockRequestPath)).toBe(0)
    expect(storeAfter.cache[mockRequestPath]?.pollTimer).toBeUndefined()
  })

  it('should not fetch or start polling on subsequent watches', async () => {
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
    const mockTimer = setInterval(() => {}, 10000)
    store.setPollTimer(mockRequestPath, mockTimer)

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    expect(store.getRefCount(mockRequestPath)).toBe(2)
    clearInterval(mockTimer)
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

  it('should not start polling when initial data load fails', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    const mockError = new Error('Network error')
    mockConsoleFetchJSON.mockRejectedValue(mockError)

    await startWatch(mockResource, mockModel, mockBasePath)

    const store = useFleetK8sWatchResourceStore.getState()
    const result = store.getResult(mockRequestPath)
    expect(result?.loadError).toBe(mockError)
    expect(store.cache[mockRequestPath]?.pollTimer).toBeUndefined()
  })

  it('should start polling when valid cache exists', async () => {
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

    await startWatch(mockResource, mockModel, mockBasePath)

    expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    const storeAfter = useFleetK8sWatchResourceStore.getState()
    expect(storeAfter.cache[mockRequestPath]?.pollTimer).toBeDefined()
  })

  it('should enforce minimum poll interval of 10 seconds', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [],
      metadata: { resourceVersion: '1000' },
    })

    const setIntervalSpy = jest.spyOn(global, 'setInterval')

    await startWatch(mockResource, mockModel, mockBasePath, 1)

    const intervalCalls = setIntervalSpy.mock.calls
    const lastCall = intervalCalls[intervalCalls.length - 1]
    expect(lastCall[1]).toBe(10000)

    setIntervalSpy.mockRestore()
  })

  it('should accept custom poll intervals above minimum', async () => {
    const mockResource: FleetWatchK8sResource = {
      cluster: 'test-cluster',
      namespace: 'default',
      isList: true,
    }

    mockConsoleFetchJSON.mockResolvedValue({
      items: [],
      metadata: { resourceVersion: '1000' },
    })

    const setIntervalSpy = jest.spyOn(global, 'setInterval')

    await startWatch(mockResource, mockModel, mockBasePath, 30)

    const intervalCalls = setIntervalSpy.mock.calls
    const lastCall = intervalCalls[intervalCalls.length - 1]
    expect(lastCall[1]).toBe(30000)

    setIntervalSpy.mockRestore()
  })
})
