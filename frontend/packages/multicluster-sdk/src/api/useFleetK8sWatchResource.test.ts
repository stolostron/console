/* Copyright Contributors to the Open Cluster Management project */

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sModel: jest.fn(),
  useK8sWatchResource: jest.fn(),
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

jest.mock('../internal/fleetK8sWatchResource', () => ({
  useGetInitialResult: jest.fn(),
  getRequestPathFromResource: jest.fn(),
  startWatch: jest.fn(),
  stopWatch: jest.fn(),
  subscribe: jest.fn(),
}))

import { renderHook } from '@testing-library/react-hooks'
import { useK8sModel, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useHubClusterName } from './useHubClusterName'
import { useFleetK8sWatchResource } from './useFleetK8sWatchResource'
import {
  useGetInitialResult,
  getRequestPathFromResource,
  startWatch,
  stopWatch,
  subscribe,
} from '../internal/fleetK8sWatchResource'
import { NO_FLEET_AVAILABLE_ERROR } from '../internal/constants'

const mockUseK8sModel = useK8sModel as jest.MockedFunction<typeof useK8sModel>
const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<typeof useK8sWatchResource>
const mockUseFleetK8sAPIPath = useFleetK8sAPIPath as jest.MockedFunction<typeof useFleetK8sAPIPath>
const mockUseIsFleetAvailable = useIsFleetAvailable as jest.MockedFunction<typeof useIsFleetAvailable>
const mockUseHubClusterName = useHubClusterName as jest.MockedFunction<typeof useHubClusterName>
const mockUseGetInitialResult = useGetInitialResult as jest.MockedFunction<typeof useGetInitialResult>
const mockGetRequestPathFromResource = getRequestPathFromResource as jest.MockedFunction<
  typeof getRequestPathFromResource
>
const mockStartWatch = startWatch as jest.MockedFunction<typeof startWatch>
const mockStopWatch = stopWatch as jest.MockedFunction<typeof stopWatch>
const mockSubscribe = subscribe as jest.MockedFunction<typeof subscribe>

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

    // Set up default mocks
    mockUseIsFleetAvailable.mockReturnValue(true)
    mockUseK8sModel.mockReturnValue([mockModel, false]) // modelLoading = false
    mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, true, undefined])
    mockUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])

    // Mock useGetInitialResult to return a function that returns result object
    const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
    mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)
    mockGetRequestPathFromResource.mockReturnValue('/api/test/path')
    mockSubscribe.mockReturnValue(jest.fn()) // Return unsubscribe function
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

      // Should call useK8sWatchResource with the resource (without cluster)
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith({
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
      })

      // Should not call startWatch since we're using local cluster
      expect(mockStartWatch).not.toHaveBeenCalled()

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

      expect(mockStartWatch).not.toHaveBeenCalled()

      expect(result.current).toEqual([mockData, true, undefined])
    })

    it('should return undefined values when resource is null', () => {
      mockUseK8sWatchResource.mockReturnValue([undefined as any, false, undefined])

      const { result } = renderHook(() => useFleetK8sWatchResource(null))

      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null)
      expect(mockStartWatch).not.toHaveBeenCalled()
      expect(result.current).toEqual([undefined, false, undefined])
    })
  })

  describe('when using remote cluster (fleet)', () => {
    const initResource = {
      groupVersionKind: { version: 'v1', kind: 'Pod' },
      isList: true,
      cluster: remoteClusterName,
      namespace: 'default',
      name: undefined,
    }

    it('should call startWatch for remote cluster when fleet is available', () => {
      const mockFleetData = [{ metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName }]
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: mockFleetData, loaded: true })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      // Should call getRequestPathFromResource to get the path
      expect(mockGetRequestPathFromResource).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)

      // Should call subscribe with correct parameters
      expect(mockSubscribe).toHaveBeenCalledWith(initResource, '/api/test/path', expect.any(Function))

      // Should call startWatch with correct parameters
      expect(mockStartWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)

      // Should not call useK8sWatchResource with the resource
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null)

      // Should return fleet result
      expect(result.current).toEqual([mockFleetData, true, undefined])
    })

    it('should call stopWatch on cleanup', () => {
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)
      const mockUnsubscribe = jest.fn()
      mockSubscribe.mockReturnValue(mockUnsubscribe)

      const { unmount } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).toHaveBeenCalled()
      expect(mockSubscribe).toHaveBeenCalled()

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(mockStopWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)
    })

    it('should handle single resource (non-list)', () => {
      const singleResourceInit = {
        ...initResource,
        isList: false,
        name: 'specific-pod',
      }

      const mockSingleData = { metadata: { name: 'specific-pod', uid: 'uid1' }, cluster: remoteClusterName }
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: mockSingleData, loaded: true })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { result } = renderHook(() => useFleetK8sWatchResource(singleResourceInit))

      expect(mockStartWatch).toHaveBeenCalledWith(singleResourceInit, mockModel, mockFleetAPIUrl)

      expect(result.current).toEqual([mockSingleData, true, undefined])
    })

    it('should update result when subscribe callback is invoked', () => {
      const initialData = [{ metadata: { name: 'pod1' }, cluster: remoteClusterName }]
      const updatedData = [
        { metadata: { name: 'pod1' }, cluster: remoteClusterName },
        { metadata: { name: 'pod2' }, cluster: remoteClusterName },
      ]

      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: initialData, loaded: true })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      let setResultCallback: any
      mockSubscribe.mockImplementation((_resource, _requestPath, setResult) => {
        setResultCallback = setResult
        return jest.fn() // return unsubscribe function
      })

      const { result, rerender } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([initialData, true, undefined])

      // Simulate watch update via subscribe callback
      setResultCallback({ data: updatedData, loaded: true })
      rerender()

      expect(result.current).toEqual([updatedData, true, undefined])
    })

    it('should handle errors from fleet watch', () => {
      const mockError = new Error('Fleet watch error')
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: true, loadError: mockError })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([[], true, mockError])
    })

    it('should not call startWatch if backend path is not loaded', () => {
      mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, false, undefined])

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).not.toHaveBeenCalled()
    })

    it('should not call startWatch if model is still loading', () => {
      mockUseK8sModel.mockReturnValue([mockModel, true]) // modelLoading = true

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).not.toHaveBeenCalled()
    })

    it('should not call startWatch if model is not available', () => {
      mockUseK8sModel.mockReturnValue([undefined as any, false])

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).not.toHaveBeenCalled()
    })

    it('should not call startWatch if resource is null', () => {
      renderHook(() => useFleetK8sWatchResource(null))

      expect(mockStartWatch).not.toHaveBeenCalled()
    })

    it('should call startWatch when dependencies change', () => {
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: initResource },
      })

      expect(mockStartWatch).toHaveBeenCalledTimes(1)

      // Update resource
      const updatedResource = { ...initResource, namespace: 'other-namespace' }
      rerender({ resource: updatedResource })

      expect(mockStartWatch).toHaveBeenCalledTimes(2)
      expect(mockStopWatch).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should return error when fleet is not available but needed', () => {
      mockUseIsFleetAvailable.mockReturnValue(false)

      // Mock getInitialResult to return the fleet unavailable error
      const mockGetInitialResultFn = jest.fn().mockReturnValue({
        data: undefined,
        loaded: false,
        loadError: NO_FLEET_AVAILABLE_ERROR,
      })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([undefined, false, NO_FLEET_AVAILABLE_ERROR])
      expect(mockStartWatch).not.toHaveBeenCalled()
    })

    it('should return error when hub cluster name fails to load', () => {
      const hubLoadError = new Error('Failed to load hub cluster name')
      mockUseHubClusterName.mockReturnValue([undefined, false, hubLoadError])

      // Mock getInitialResult to return the error when hub cluster name failed to load
      const mockGetInitialResultFn = jest.fn().mockReturnValue({
        data: undefined,
        loaded: false,
        loadError: hubLoadError,
      })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([undefined, false, hubLoadError])
      expect(mockStartWatch).not.toHaveBeenCalled()
    })

    it('should wait for hub cluster name before making fleet decision', () => {
      mockUseHubClusterName.mockReturnValue([undefined, false, undefined])

      // Mock getInitialResult to return loading state while waiting for hub cluster name
      const mockGetInitialResultFn = jest.fn().mockReturnValue({
        data: undefined,
        loaded: false,
        loadError: undefined,
      })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([undefined, false, undefined])
      expect(mockStartWatch).not.toHaveBeenCalled()
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null)
    })

    it('should handle transition from waiting to loaded hub cluster name', () => {
      mockUseHubClusterName.mockReturnValue([undefined, false, undefined])

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const { result, rerender } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([[], false, undefined])
      expect(mockStartWatch).not.toHaveBeenCalled()

      // Hub cluster name now loads
      mockUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      rerender()

      expect(mockStartWatch).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle resource without groupVersionKind', () => {
      const initResource = {
        isList: true,
        cluster: remoteClusterName,
      } as any

      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).not.toHaveBeenCalled()
      expect(result.current).toEqual([[], false, undefined])
    })

    it('should handle initial result with undefined data', () => {
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: undefined, loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: false,
        cluster: remoteClusterName,
      }

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([undefined, false, undefined])
    })

    it('should use cached initial result if available', () => {
      const cachedData = [{ metadata: { name: 'cached-pod' }, cluster: remoteClusterName }]
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: cachedData, loaded: true })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([cachedData, true, undefined])
    })

    it('should handle namespace and name parameters correctly', () => {
      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: false,
        cluster: remoteClusterName,
        namespace: 'kube-system',
        name: 'kube-apiserver',
      }

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)
    })

    it('should handle fieldSelector and selector parameters', () => {
      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
        namespace: 'default',
        fieldSelector: 'status.phase=Running',
        selector: { matchLabels: { app: 'myapp' } },
      }

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)
    })

    it('should memoize resource to prevent unnecessary re-renders', () => {
      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const { rerender } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).toHaveBeenCalledTimes(1)

      // Rerender with same resource (should not trigger new watch)
      rerender()

      expect(mockStartWatch).toHaveBeenCalledTimes(1)
    })

    it('should handle switching from remote to hub cluster', () => {
      const remoteResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const hubResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: hubClusterName,
      }

      // Initial setup for remote cluster (fleet)
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      // For remote resource, useK8sWatchResource should be called with null
      mockUseK8sWatchResource.mockReturnValue([undefined as any, false, undefined])

      const { result, rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: remoteResource },
      })

      expect(mockStartWatch).toHaveBeenCalled()
      expect(mockStopWatch).not.toHaveBeenCalled()
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null)

      // Switch to hub cluster
      const mockLocalData = [{ metadata: { name: 'local-pod' } }]
      mockUseK8sWatchResource.mockReturnValue([mockLocalData, true, undefined])
      rerender({ resource: hubResource })

      expect(mockStopWatch).toHaveBeenCalled()
      expect(result.current).toEqual([mockLocalData, true, undefined])
    })

    it('should handle switching from hub to remote cluster', () => {
      const hubResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: hubClusterName,
      }

      const remoteResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      // Initial setup for hub cluster (local)
      const mockLocalData = [{ metadata: { name: 'local-pod' } }]
      mockUseK8sWatchResource.mockReturnValue([mockLocalData, true, undefined])

      const { rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: hubResource },
      })

      // Initially on hub cluster, should not start fleet watch
      expect(mockStartWatch).not.toHaveBeenCalled()

      // Switch to remote cluster
      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)
      // After switching, useK8sWatchResource should be called with null for remote cluster
      mockUseK8sWatchResource.mockReturnValue([undefined as any, false, undefined])
      rerender({ resource: remoteResource })

      expect(mockStartWatch).toHaveBeenCalled()
    })
  })

  describe('integration with useGetInitialResult', () => {
    it('should call the returned function with correct parameters when all dependencies are loaded', () => {
      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockGetInitialResultFn).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)
    })

    it('should call the returned function with undefined when model is not loaded', () => {
      mockUseK8sModel.mockReturnValue([undefined as any, false])

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockGetInitialResultFn).toHaveBeenCalledWith(initResource, undefined, mockFleetAPIUrl)
    })

    it('should call the returned function with undefined when backendAPIPath is not loaded', () => {
      mockUseFleetK8sAPIPath.mockReturnValue([undefined, false, undefined])

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      const mockGetInitialResultFn = jest.fn().mockReturnValue({ data: [], loaded: false })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockGetInitialResultFn).toHaveBeenCalledWith(initResource, mockModel, undefined)
    })

    it('should immediately return correct initial value when initResource changes', () => {
      const podsResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
        namespace: 'default',
      }

      const deploymentsResource = {
        groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
        isList: true,
        cluster: remoteClusterName,
        namespace: 'default',
      }

      // Mock getInitialResult to return different values for different resources
      const podsInitialData = [{ metadata: { name: 'pod1' }, cluster: remoteClusterName }]
      const deploymentsInitialData = [{ metadata: { name: 'deployment1' }, cluster: remoteClusterName }]

      // Mock the hook to return a function that behaves based on the resource
      const mockGetInitialResultFn = jest.fn().mockImplementation((resource) => {
        if (resource?.groupVersionKind?.kind === 'Pod') {
          return { data: podsInitialData, loaded: true }
        } else if (resource?.groupVersionKind?.kind === 'Deployment') {
          return { data: deploymentsInitialData, loaded: true }
        }
        return { data: [], loaded: false }
      })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { result, rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: podsResource },
      })

      // Initial render should return pods data
      expect(result.current).toEqual([podsInitialData, true, undefined])

      // Change to deployments resource
      rerender({ resource: deploymentsResource })

      // Should immediately return deployments initial data (either cached or empty loading state)
      expect(result.current).toEqual([deploymentsInitialData, true, undefined])
    })

    it('should return empty loading state when initResource changes and no cache exists', () => {
      const podsResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
        namespace: 'default',
      }

      const deploymentsResource = {
        groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
        isList: true,
        cluster: remoteClusterName,
        namespace: 'default',
      }

      // Mock getInitialResult to return cached data for pods, but empty state for deployments
      const podsInitialData = [{ metadata: { name: 'pod1' }, cluster: remoteClusterName }]

      const mockGetInitialResultFn = jest.fn().mockImplementation((resource) => {
        if (resource?.groupVersionKind?.kind === 'Pod') {
          return { data: podsInitialData, loaded: true }
        } else if (resource?.groupVersionKind?.kind === 'Deployment') {
          return { data: [], loaded: false }
        }
        return { data: [], loaded: false }
      })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { result, rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: podsResource },
      })

      // Initial render should return pods data
      expect(result.current).toEqual([podsInitialData, true, undefined])

      // Change to deployments resource (no cache)
      rerender({ resource: deploymentsResource })

      // Should immediately return empty loading state for the new resource
      expect(result.current).toEqual([[], false, undefined])
    })

    it('should not use cached error result when initResource changes', () => {
      const podsResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
        namespace: 'default',
      }

      const deploymentsResource = {
        groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
        isList: true,
        cluster: remoteClusterName,
        namespace: 'default',
      }

      // Mock getInitialResult to return valid data for pods
      // For deployments, it should filter out any cached error and return empty state
      const podsInitialData = [{ metadata: { name: 'pod1' }, cluster: remoteClusterName }]

      const mockGetInitialResultFn = jest.fn().mockImplementation((resource) => {
        if (resource?.groupVersionKind?.kind === 'Pod') {
          return { data: podsInitialData, loaded: true }
        } else if (resource?.groupVersionKind?.kind === 'Deployment') {
          // In reality, getInitialResult would see a cached error and return empty state
          // This tests that when switching resources, the hook properly uses that empty state
          return { data: [], loaded: false }
        }
        return { data: [], loaded: false }
      })
      mockUseGetInitialResult.mockReturnValue(mockGetInitialResultFn)

      const { result, rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: podsResource },
      })

      // Initial render should return pods data
      expect(result.current).toEqual([podsInitialData, true, undefined])

      // Change to deployments resource (has cached error, but getInitialResult filters it)
      rerender({ resource: deploymentsResource })

      // Should not use the cached error result - should return empty loading state to retry
      expect(result.current[2]).toBeUndefined() // no error should be returned
      expect(result.current[1]).toBe(false) // should be in loading state to retry
      expect(result.current[0]).toEqual([]) // should have empty data, not stale cached data
    })
  })
})
