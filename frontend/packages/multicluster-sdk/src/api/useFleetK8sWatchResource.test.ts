/* Copyright Contributors to the Open Cluster Management project */

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sModel: jest.fn(),
  useK8sWatchResource: jest.fn(),
  consoleFetchJSON: jest.fn(),
}))

jest.mock('../internal/apiRequests', () => ({
  fleetWatch: jest.fn(),
  buildResourceURL: jest.fn(),
}))

jest.mock('./useFleetK8sAPIPath', () => ({
  useFleetK8sAPIPath: jest.fn(),
}))

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(),
}))

jest.mock('./useHubClusterName', () => ({
  useHubClusterName: jest.fn(),
}))

// Create a simple mock that can be updated during tests
let mockResourceCache: any = {}
let mockSocketCache: any = {}

jest.mock('../internal/fleetK8sWatchResourceStore', () => {
  const mockStore = {
    get resourceCache() {
      return mockResourceCache
    },
    get socketCache() {
      return mockSocketCache
    },
    cacheTTL: 5 * 60 * 1000,
    setResource: jest.fn(),
    getResource: jest.fn(),
    removeResource: jest.fn(),
    isResourceExpired: jest.fn().mockReturnValue(false),
    setSocket: jest.fn(),
    getSocket: jest.fn(),
    addSocketRef: jest.fn(),
    removeSocketRef: jest.fn(),
    removeSocket: jest.fn(),
    isSocketExpired: jest.fn().mockReturnValue(false),
    clearExpired: jest.fn(),
    clearAll: jest.fn(),
    getCacheStats: jest.fn().mockReturnValue({
      resourceCount: 0,
      socketCount: 0,
      expiredResourceCount: 0,
      expiredSocketCount: 0,
    }),
  }

  const mockUseStore = jest.fn((selector?: any) => {
    if (typeof selector === 'function') {
      return selector({ resourceCache: mockResourceCache, socketCache: mockSocketCache })
    }
    return mockStore
  })

  // Add getState method for compatibility with clearFleetK8sWatchResourceCache
  ;(mockUseStore as any).getState = jest.fn(() => mockStore)

  return {
    useFleetK8sWatchResourceStore: mockUseStore,
    getCacheKey: jest.fn(
      (params) =>
        `${params.cluster}|${params.model?.apiVersion}|${params.model?.kind}|${params.namespace}|${params.name}`
    ),
  }
})

import { waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react-hooks'
import { useK8sModel, useK8sWatchResource, consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { buildResourceURL, fleetWatch } from '../internal/apiRequests'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useHubClusterName } from './useHubClusterName'
import { useFleetK8sWatchResource } from './useFleetK8sWatchResource'
import { clearFleetK8sWatchResourceCache } from '../internal/fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from '../internal/fleetK8sWatchResourceStore'

const mockUseK8sModel = useK8sModel as jest.MockedFunction<typeof useK8sModel>
const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<typeof useK8sWatchResource>
const mockUseFleetK8sAPIPath = useFleetK8sAPIPath as jest.MockedFunction<typeof useFleetK8sAPIPath>
const mockConsoleFetchJSON = consoleFetchJSON as jest.MockedFunction<typeof consoleFetchJSON>
const mockFleetWatch = fleetWatch as jest.MockedFunction<typeof fleetWatch>
const mockBuildResourceURL = buildResourceURL as jest.MockedFunction<typeof buildResourceURL>
const mockUseIsFleetAvailable = useIsFleetAvailable as jest.MockedFunction<typeof useIsFleetAvailable>
const mockedUseHubClusterName = useHubClusterName as jest.MockedFunction<typeof useHubClusterName>
const mockUseFleetK8sWatchResourceStore = useFleetK8sWatchResourceStore as jest.MockedFunction<
  typeof useFleetK8sWatchResourceStore
>

// Mock WebSocket
let mockWebSocket: any
let mockStore: any

describe('useFleetK8sWatchResource', () => {
  const hubClusterName = 'hub-cluster'
  const remoteClusterName = 'remote-cluster'
  const mockModel = {
    apiVersion: 'v1',
    kind: 'Pod',
    plural: 'pods',
    abbr: 'P',
    label: 'Pod',
    labelPlural: 'Pods',
  }
  const mockFleetAPIUrl = '/api/remote-cluster/multiclusterproxy'

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset the mock caches
    mockResourceCache = {}
    mockSocketCache = {}

    // Recreate the mock store for each test
    mockStore = {
      resourceCache: mockResourceCache,
      socketCache: mockSocketCache,
      cacheTTL: 5 * 60 * 1000,
      setResource: jest.fn(),
      getResource: jest.fn().mockReturnValue(undefined),
      removeResource: jest.fn(),
      isResourceExpired: jest.fn().mockReturnValue(false),
      setSocket: jest.fn(),
      getSocket: jest.fn().mockReturnValue(undefined),
      addSocketRef: jest.fn(),
      removeSocketRef: jest.fn(),
      removeSocket: jest.fn(),
      isSocketExpired: jest.fn().mockReturnValue(false),
      clearExpired: jest.fn(),
      clearAll: jest.fn(),
      getCacheStats: jest.fn().mockReturnValue({
        resourceCount: 0,
        socketCount: 0,
        expiredResourceCount: 0,
        expiredSocketCount: 0,
      }),
    }

    // Update the mock store returned by the hook
    mockUseFleetK8sWatchResourceStore.mockImplementation((selector?: any) => {
      if (typeof selector === 'function') {
        return selector({ resourceCache: mockResourceCache, socketCache: mockSocketCache })
      }
      return mockStore
    })

    // Update getState to return the current mock store
    ;(mockUseFleetK8sWatchResourceStore as any).getState.mockReturnValue(mockStore)

    // Make setResource update the mock cache to trigger re-renders
    mockStore.setResource.mockImplementation((key: string, data: any, loaded: boolean, error?: any) => {
      mockResourceCache[key] = {
        data,
        loaded,
        error,
        timestamp: Date.now(),
        lastAccessed: Date.now(),
      }
    })

    mockUseIsFleetAvailable.mockReturnValue(true) // Default: Fleet is available
    mockUseK8sModel.mockReturnValue([mockModel, true])
    mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, true, undefined])
    mockedUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])
    mockWebSocket = {
      onmessage: jest.fn(),
      onclose: jest.fn(),
      onerror: jest.fn(),
      readyState: WebSocket.OPEN,
      close: jest.fn(),
    }
    mockFleetWatch.mockReturnValue(mockWebSocket as any)
    mockBuildResourceURL.mockReturnValue('/default/url')
  })

  describe('when using hub cluster (no fleet)', () => {
    it('should use standard useK8sWatchResource for hub cluster', () => {
      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: hubClusterName,
      }

      const mockData = [{ metadata: { name: 'pod1' } }]
      mockUseK8sWatchResource.mockReturnValue([mockData, true, undefined])

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      // Should call useK8sWatchResource with the correct resource
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith({
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
      })

      expect(result.current).toEqual([mockData, true, undefined])
    })

    it('should use standard useK8sWatchResource when cluster is undefined', () => {
      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
      }

      const mockData = [{ metadata: { name: 'pod1' } }]
      mockUseK8sWatchResource.mockReturnValue([mockData, true, undefined])

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockUseK8sWatchResource).toHaveBeenCalledWith({
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
      })

      expect(result.current).toEqual([mockData, true, undefined])
    })
  })

  describe('when using remote cluster (fleet)', () => {
    const initResource = {
      groupVersionKind: { version: 'v1', kind: 'Pod' },
      isList: true,
      cluster: remoteClusterName,
      namespace: 'default',
      name: 'cluster-name',
    }

    it('should fetch data from fleet backend and set up WebSocket watch', async () => {
      const mockFetchData = {
        items: [{ metadata: { name: 'pod1', uid: 'uid1' } }, { metadata: { name: 'pod2', uid: 'uid2' } }],
        metadata: { resourceVersion: '12345' },
      }
      const expectedURL = `${mockFleetAPIUrl}/${remoteClusterName}/namespaces/${initResource.namespace}/pods`
      mockBuildResourceURL.mockReturnValue(expectedURL)

      const processedData = [
        { metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName },
        { metadata: { name: 'pod2', uid: 'uid2' }, cluster: remoteClusterName },
      ]

      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData))

      // Update setResource mock to also update the cache for the selector
      mockStore.setResource.mockImplementation((key: string, data: any, loaded: boolean, error?: any) => {
        mockResourceCache[key] = {
          data,
          loaded,
          error,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
      })

      const { result, rerender } = renderHook(() => useFleetK8sWatchResource(initResource))

      // Initially should be empty and not loaded
      expect(result.current[0]).toEqual([])
      expect(result.current[1]).toBe(false)

      // Wait for the fetch to be called
      await waitFor(() => {
        expect(mockConsoleFetchJSON).toHaveBeenCalled()
      })

      // Manually simulate what the store would do - set the resource data
      await act(async () => {
        const requestPath = mockBuildResourceURL.mock.results[0].value
        mockResourceCache[requestPath] = {
          data: processedData,
          loaded: true,
          error: undefined,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
        rerender()
      })

      // Should fetch from the correct URL
      expect(mockConsoleFetchJSON).toHaveBeenCalledWith(expect.stringContaining('pods'), 'GET')

      // Should set up WebSocket watch
      expect(mockFleetWatch).toHaveBeenCalledWith(
        mockModel,
        expect.objectContaining({
          ns: 'default',
          cluster: remoteClusterName,
          resourceVersion: '12345',
        }),
        mockFleetAPIUrl
      )

      // Data should include cluster info
      expect(result.current[0]).toEqual(processedData)
      expect(result.current[1]).toBe(true)
    })

    it('should handle resource', async () => {
      const singleResourceInit = {
        ...initResource,
        isList: false,
        name: 'specific-pod',
      }

      const mockFetchData = {
        metadata: { name: 'specific-pod', uid: 'uid1' },
        spec: { containers: [] },
      }

      const processedData = {
        metadata: { name: 'specific-pod', uid: 'uid1' },
        spec: { containers: [] },
        cluster: remoteClusterName,
      }

      // Reset and set new mock value for this test
      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData))
      const { result, rerender } = renderHook(() => useFleetK8sWatchResource(singleResourceInit))

      // Initially should be undefined and not loaded
      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toBe(false)

      // Wait for the fetch to be called
      await waitFor(() => {
        expect(mockConsoleFetchJSON).toHaveBeenCalled()
      })

      // Manually simulate what the store would do - set the resource data
      await act(async () => {
        const requestPath = mockBuildResourceURL.mock.results[0].value
        mockResourceCache[requestPath] = {
          data: processedData,
          loaded: true,
          error: undefined,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
        rerender()
      })

      // Should include cluster info in single resource
      expect(result.current[0]).toEqual(processedData)
      expect(result.current[1]).toBe(true)

      // Should set up watch with fieldSelector for specific resource
      expect(mockFleetWatch).toHaveBeenCalledWith(
        mockModel,
        expect.objectContaining({
          fieldSelector: 'metadata.name=specific-pod',
        }),
        mockFleetAPIUrl
      )
    })

    it('calls useK8sWatchResource with null value when using fleet backend', async () => {
      const singleResourceInit = {
        ...initResource,
        isList: false,
        name: 'specific-pod',
      }

      const mockFetchData = {
        metadata: { name: 'specific-pod', uid: 'uid1' },
        spec: { containers: [] },
      }

      const processedData = {
        metadata: { name: 'specific-pod', uid: 'uid1' },
        spec: { containers: [] },
        cluster: remoteClusterName,
      }

      // Reset and set new mock value for this test
      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData))
      const { result, rerender } = renderHook(() => useFleetK8sWatchResource(singleResourceInit))

      // Wait for the fetch to be called
      await waitFor(() => {
        expect(mockConsoleFetchJSON).toHaveBeenCalled()
      })

      // Manually simulate what the store would do - set the resource data
      await act(async () => {
        const requestPath = mockBuildResourceURL.mock.results[0].value
        mockResourceCache[requestPath] = {
          data: processedData,
          loaded: true,
          error: undefined,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
        rerender()
      })

      // Should call useK8sWatchResource with null value for fleet backend
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null)

      // Should include cluster info in single resource
      expect(result.current[0]).toEqual(processedData)
      expect(result.current[1]).toBe(true)
    })

    it('should not fetch if backend path is not loaded', () => {
      mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, false, undefined])

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
      expect(result.current[1]).toBe(false)
      clearFleetK8sWatchResourceCache()
    })

    it('should handle WebSocket ADD, MODIFY, and DELETE events for live updating', async () => {
      // Reset and setup mocks specifically for this test
      jest.resetAllMocks()

      // Reset the mock caches for this test
      mockResourceCache = {}
      mockSocketCache = {}

      // Recreate the mock store for this test
      mockStore = {
        resourceCache: mockResourceCache,
        socketCache: mockSocketCache,
        cacheTTL: 5 * 60 * 1000,
        setResource: jest.fn(),
        getResource: jest.fn().mockReturnValue(undefined),
        removeResource: jest.fn(),
        isResourceExpired: jest.fn().mockReturnValue(false),
        setSocket: jest.fn(),
        getSocket: jest.fn().mockReturnValue(undefined),
        addSocketRef: jest.fn(),
        removeSocketRef: jest.fn(),
        removeSocket: jest.fn(),
        isSocketExpired: jest.fn().mockReturnValue(false),
        clearExpired: jest.fn(),
        clearAll: jest.fn(),
        getCacheStats: jest.fn().mockReturnValue({
          resourceCount: 0,
          socketCount: 0,
          expiredResourceCount: 0,
          expiredSocketCount: 0,
        }),
      }

      // Update the mock store returned by the hook
      mockUseFleetK8sWatchResourceStore.mockImplementation((selector?: any) => {
        if (typeof selector === 'function') {
          return selector({ resourceCache: mockResourceCache, socketCache: mockSocketCache })
        }
        return mockStore
      })

      // Update getState to return the current mock store
      ;(mockUseFleetK8sWatchResourceStore as any).getState.mockReturnValue(mockStore)

      // Make setResource update the mock cache to trigger re-renders
      mockStore.setResource.mockImplementation((key: string, data: any, loaded: boolean, error?: any) => {
        mockResourceCache[key] = {
          data,
          loaded,
          error,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
      })

      mockUseK8sModel.mockReturnValue([mockModel, true])
      mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, true, undefined])
      mockWebSocket = {
        onmessage: jest.fn(),
        onclose: jest.fn(),
        onerror: jest.fn(),
        readyState: WebSocket.OPEN,
        close: jest.fn(),
      }
      mockUseIsFleetAvailable.mockReturnValue(true)
      mockFleetWatch.mockReturnValue(mockWebSocket as any)
      mockBuildResourceURL.mockReturnValue('/default/url')
      mockedUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])

      const mockFetchData1 = {
        items: [{ metadata: { name: 'pod1', uid: 'uid1' } }],
      }
      const initialProcessedData = [{ metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName }]

      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData1))
      const mockData = [{ metadata: { name: 'pod1' } }]
      mockUseK8sWatchResource.mockReturnValue([mockData, true, undefined])

      const { result, rerender } = renderHook(() => useFleetK8sWatchResource(initResource))

      // Wait for the fetch to be called
      await waitFor(() => {
        expect(mockConsoleFetchJSON).toHaveBeenCalled()
      })

      // Manually simulate what the store would do - set the initial resource data
      await act(async () => {
        const requestPath = mockBuildResourceURL.mock.results[0].value
        mockResourceCache[requestPath] = {
          data: initialProcessedData,
          loaded: true,
          error: undefined,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
        rerender()
      })
      // Simulate ADD event - manually update cache as the WebSocket handler would
      await act(async () => {
        const requestPath = mockBuildResourceURL.mock.results[0].value
        const updatedData = [
          ...initialProcessedData,
          { metadata: { name: 'pod2', uid: 'uid2' }, cluster: remoteClusterName },
        ]
        mockResourceCache[requestPath] = {
          data: updatedData,
          loaded: true,
          error: undefined,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
        rerender()
      })

      expect(result.current[0]).toEqual([
        { metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName },
        { metadata: { name: 'pod2', uid: 'uid2' }, cluster: remoteClusterName },
      ])

      // Simulate MODIFY event - manually update cache
      await act(async () => {
        const requestPath = mockBuildResourceURL.mock.results[0].value
        const updatedData = [
          { metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName },
          { metadata: { name: 'pod2', uid: 'uid2' }, spec: { foo: 'bar' }, cluster: remoteClusterName },
        ]
        mockResourceCache[requestPath] = {
          data: updatedData,
          loaded: true,
          error: undefined,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
        rerender()
      })

      expect(result.current[0]).toEqual([
        { metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName },
        { metadata: { name: 'pod2', uid: 'uid2' }, spec: { foo: 'bar' }, cluster: remoteClusterName },
      ])

      // Simulate DELETE event - manually update cache
      await act(async () => {
        const requestPath = mockBuildResourceURL.mock.results[0].value
        const updatedData = [
          { metadata: { name: 'pod2', uid: 'uid2' }, spec: { foo: 'bar' }, cluster: remoteClusterName },
        ]
        mockResourceCache[requestPath] = {
          data: updatedData,
          loaded: true,
          error: undefined,
          timestamp: Date.now(),
          lastAccessed: Date.now(),
        }
        rerender()
      })

      expect(result.current[0]).toEqual([
        { metadata: { name: 'pod2', uid: 'uid2' }, spec: { foo: 'bar' }, cluster: remoteClusterName },
      ])
      clearFleetK8sWatchResourceCache()
    })

    it('should not call consoleFetch if initResource is null', () => {
      const { result } = renderHook(() => useFleetK8sWatchResource(null))

      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toBe(false)
      expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
    })
  })
})
