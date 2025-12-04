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
  getInitialResult: jest.fn(),
  startWatch: jest.fn(),
  stopWatch: jest.fn(),
}))

import { renderHook } from '@testing-library/react-hooks'
import { useK8sModel, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useHubClusterName } from './useHubClusterName'
import { useFleetK8sWatchResource } from './useFleetK8sWatchResource'
import { getInitialResult, startWatch, stopWatch } from '../internal/fleetK8sWatchResource'
import { NO_FLEET_AVAILABLE_ERROR } from '../internal/constants'

const mockUseK8sModel = useK8sModel as jest.MockedFunction<typeof useK8sModel>
const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<typeof useK8sWatchResource>
const mockUseFleetK8sAPIPath = useFleetK8sAPIPath as jest.MockedFunction<typeof useFleetK8sAPIPath>
const mockUseIsFleetAvailable = useIsFleetAvailable as jest.MockedFunction<typeof useIsFleetAvailable>
const mockUseHubClusterName = useHubClusterName as jest.MockedFunction<typeof useHubClusterName>
const mockGetInitialResult = getInitialResult as jest.MockedFunction<typeof getInitialResult>
const mockStartWatch = startWatch as jest.MockedFunction<typeof startWatch>
const mockStopWatch = stopWatch as jest.MockedFunction<typeof stopWatch>

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
    mockGetInitialResult.mockReturnValue({ data: [], loaded: false })
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
      mockGetInitialResult.mockReturnValue({ data: mockFleetData, loaded: true })

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      // Should call startWatch with correct parameters
      expect(mockStartWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl, expect.any(Function))

      // Should not call useK8sWatchResource with the resource
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null)

      // Should return fleet result
      expect(result.current).toEqual([mockFleetData, true, undefined])
    })

    it('should call stopWatch on cleanup', () => {
      mockGetInitialResult.mockReturnValue({ data: [], loaded: false })

      const { unmount } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).toHaveBeenCalled()

      unmount()

      expect(mockStopWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)
    })

    it('should handle single resource (non-list)', () => {
      const singleResourceInit = {
        ...initResource,
        isList: false,
        name: 'specific-pod',
      }

      const mockSingleData = { metadata: { name: 'specific-pod', uid: 'uid1' }, cluster: remoteClusterName }
      mockGetInitialResult.mockReturnValue({ data: mockSingleData, loaded: true })

      const { result } = renderHook(() => useFleetK8sWatchResource(singleResourceInit))

      expect(mockStartWatch).toHaveBeenCalledWith(singleResourceInit, mockModel, mockFleetAPIUrl, expect.any(Function))

      expect(result.current).toEqual([mockSingleData, true, undefined])
    })

    it('should update result when startWatch callback is invoked', () => {
      const initialData = [{ metadata: { name: 'pod1' }, cluster: remoteClusterName }]
      const updatedData = [
        { metadata: { name: 'pod1' }, cluster: remoteClusterName },
        { metadata: { name: 'pod2' }, cluster: remoteClusterName },
      ]

      mockGetInitialResult.mockReturnValue({ data: initialData, loaded: true })

      let setResultCallback: any
      mockStartWatch.mockImplementation((_resource, _model, _basePath, setResult) => {
        setResultCallback = setResult
        return Promise.resolve()
      })

      const { result, rerender } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(result.current).toEqual([initialData, true, undefined])

      // Simulate watch update
      setResultCallback({ data: updatedData, loaded: true })
      rerender()

      expect(result.current).toEqual([updatedData, true, undefined])
    })

    it('should handle errors from fleet watch', () => {
      const mockError = new Error('Fleet watch error')
      mockGetInitialResult.mockReturnValue({ data: [], loaded: true, loadError: mockError })

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

      expect(result.current).toEqual([undefined, false, undefined])
      expect(mockStartWatch).not.toHaveBeenCalled()

      // Hub cluster name now loads
      mockUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])
      mockGetInitialResult.mockReturnValue({ data: [], loaded: false })

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

      mockGetInitialResult.mockReturnValue({ data: [], loaded: false })

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockStartWatch).not.toHaveBeenCalled()
      expect(result.current).toEqual([[], false, undefined])
    })

    it('should handle initial result with undefined data', () => {
      mockGetInitialResult.mockReturnValue({ data: undefined, loaded: false })

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
      mockGetInitialResult.mockReturnValue({ data: cachedData, loaded: true })

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

      expect(mockStartWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl, expect.any(Function))
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

      expect(mockStartWatch).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl, expect.any(Function))
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

      const mockLocalData = [{ metadata: { name: 'local-pod' } }]
      mockUseK8sWatchResource.mockReturnValue([mockLocalData, true, undefined])

      const { result, rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: remoteResource },
      })

      expect(mockStartWatch).toHaveBeenCalled()
      expect(mockStopWatch).not.toHaveBeenCalled()

      // Switch to hub cluster
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

      const mockLocalData = [{ metadata: { name: 'local-pod' } }]
      mockUseK8sWatchResource.mockReturnValue([mockLocalData, true, undefined])

      const { rerender } = renderHook(({ resource }) => useFleetK8sWatchResource(resource), {
        initialProps: { resource: hubResource },
      })

      expect(mockStartWatch).not.toHaveBeenCalled()

      // Switch to remote cluster
      mockGetInitialResult.mockReturnValue({ data: [], loaded: false })
      rerender({ resource: remoteResource })

      expect(mockStartWatch).toHaveBeenCalled()
    })
  })

  describe('integration with getInitialResult', () => {
    it('should call getInitialResult with correct parameters when all dependencies are loaded', () => {
      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockGetInitialResult).toHaveBeenCalledWith(initResource, mockModel, mockFleetAPIUrl)
    })

    it('should call getInitialResult with undefined when model is not loaded', () => {
      mockUseK8sModel.mockReturnValue([undefined as any, false])

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockGetInitialResult).toHaveBeenCalledWith(initResource, undefined, mockFleetAPIUrl)
    })

    it('should call getInitialResult with undefined when backendAPIPath is not loaded', () => {
      mockUseFleetK8sAPIPath.mockReturnValue([undefined, false, undefined])

      const initResource = {
        groupVersionKind: { version: 'v1', kind: 'Pod' },
        isList: true,
        cluster: remoteClusterName,
      }

      renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockGetInitialResult).toHaveBeenCalledWith(initResource, mockModel, undefined)
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

      // Mock getInitialResult to return the appropriate data based on the resource
      mockGetInitialResult.mockImplementation((resource) => {
        if (resource?.groupVersionKind?.kind === 'Pod') {
          return { data: podsInitialData, loaded: true }
        } else if (resource?.groupVersionKind?.kind === 'Deployment') {
          return { data: deploymentsInitialData, loaded: true }
        }
        return { data: [], loaded: false }
      })

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

      mockGetInitialResult.mockImplementation((resource) => {
        if (resource?.groupVersionKind?.kind === 'Pod') {
          return { data: podsInitialData, loaded: true }
        } else if (resource?.groupVersionKind?.kind === 'Deployment') {
          return { data: [], loaded: false }
        }
        return { data: [], loaded: false }
      })

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

      mockGetInitialResult.mockImplementation((resource) => {
        if (resource?.groupVersionKind?.kind === 'Pod') {
          return { data: podsInitialData, loaded: true }
        } else if (resource?.groupVersionKind?.kind === 'Deployment') {
          // In reality, getInitialResult would see a cached error and return empty state
          // This tests that when switching resources, the hook properly uses that empty state
          return { data: [], loaded: false }
        }
        return { data: [], loaded: false }
      })

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
