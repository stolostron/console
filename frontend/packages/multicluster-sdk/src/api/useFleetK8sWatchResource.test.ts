/* Copyright Contributors to the Open Cluster Management project */

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sModel: jest.fn(),
  useK8sWatchResource: jest.fn(),
  consoleFetchJSON: jest.fn(),
}))

jest.mock('./apiRequests', () => ({
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

import { waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { useK8sModel, useK8sWatchResource, consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { buildResourceURL, fleetWatch } from './apiRequests'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useHubClusterName } from './useHubClusterName'
import { useFleetK8sWatchResource } from './useFleetK8sWatchResource'
import { clearFleetK8sWatchResourceCache } from '../internal/fleetK8sWatchResource'

const mockUseK8sModel = useK8sModel as jest.MockedFunction<typeof useK8sModel>
const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<typeof useK8sWatchResource>
const mockUseFleetK8sAPIPath = useFleetK8sAPIPath as jest.MockedFunction<typeof useFleetK8sAPIPath>
const mockConsoleFetchJSON = consoleFetchJSON as jest.MockedFunction<typeof consoleFetchJSON>
const mockFleetWatch = fleetWatch as jest.MockedFunction<typeof fleetWatch>
const mockBuildResourceURL = buildResourceURL as jest.MockedFunction<typeof buildResourceURL>
const mockUseIsFleetAvailable = useIsFleetAvailable as jest.MockedFunction<typeof useIsFleetAvailable>
const mockedUseHubClusterName = useHubClusterName as jest.MockedFunction<typeof useHubClusterName>

// Mock WebSocket
let mockWebSocket: any

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
    mockUseIsFleetAvailable.mockReturnValue(true) // Default: Fleet is available
    mockUseK8sModel.mockReturnValue([mockModel, true])
    mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, true, undefined])
    mockedUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])
    mockWebSocket = {
      onmessage: jest.fn(),
      onclose: jest.fn(),
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

      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData))

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      // Initially should be empty and not loaded
      expect(result.current[0]).toEqual([])
      expect(result.current[1]).toBe(false)

      // Wait for async fetch to complete
      await waitFor(() => {
        expect(result.current[1]).toBe(true)
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
      expect(result.current[0]).toEqual([
        { metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName },
        { metadata: { name: 'pod2', uid: 'uid2' }, cluster: remoteClusterName },
      ])
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

      // Reset and set new mock value for this test
      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData))
      const { result } = renderHook(() => useFleetK8sWatchResource(singleResourceInit))

      await waitFor(() => {
        expect(result.current[1]).toBe(true)
      })

      // Should include cluster info in single resource
      expect(result.current[0]).toEqual({
        metadata: { name: 'specific-pod', uid: 'uid1' },
        spec: { containers: [] },
        cluster: remoteClusterName,
      })

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

      // Reset and set new mock value for this test
      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData))
      const { result } = renderHook(() => useFleetK8sWatchResource(singleResourceInit))

      await waitFor(() => {
        expect(result.current[1]).toBe(true)
      })
      // Should call useK8sWatchResource with null value for fleet backend
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith(null)

      // Should include cluster info in single resource
      expect(result.current[0]).toEqual({
        metadata: { name: 'specific-pod', uid: 'uid1' },
        spec: { containers: [] },
        cluster: remoteClusterName,
      })
    })

    it('should not fetch if backend path is not loaded', () => {
      mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, false, undefined])

      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
      expect(result.current[1]).toBe(false)
      clearFleetK8sWatchResourceCache()
    })

    it('should handle WebSocket ADD, MODIFY, and DELETE events for live updating', async () => {
      jest.resetAllMocks()
      mockUseK8sModel.mockReturnValue([mockModel, true])
      mockUseFleetK8sAPIPath.mockReturnValue([mockFleetAPIUrl, true, undefined])
      mockWebSocket = {
        onmessage: jest.fn(),
        onclose: jest.fn(),
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
      mockConsoleFetchJSON.mockReturnValueOnce(Promise.resolve(mockFetchData1))
      const mockData = [{ metadata: { name: 'pod1' } }]
      mockUseK8sWatchResource.mockReturnValue([mockData, true, undefined])
      const { result } = renderHook(() => useFleetK8sWatchResource(initResource))

      await waitFor(() => {
        expect(result.current[1]).toBe(true)
      })
      // Simulate ADD event
      const addEvent = {
        data: JSON.stringify({
          type: 'ADDED',
          object: { metadata: { name: 'pod2', uid: 'uid2' } },
        }),
      }
      mockWebSocket.onmessage(addEvent as any)
      await waitFor(() => {
        expect(result.current[0]).toEqual([
          { metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName },
          { metadata: { name: 'pod2', uid: 'uid2' }, cluster: remoteClusterName },
        ])
      })
      // Simulate MODIFY event
      const modifyEvent = {
        data: JSON.stringify({
          type: 'MODIFIED',
          object: { metadata: { name: 'pod2', uid: 'uid2' }, spec: { foo: 'bar' } },
        }),
      }
      mockWebSocket.onmessage(modifyEvent as any)
      await waitFor(() => {
        expect(result.current[0]).toEqual([
          { metadata: { name: 'pod1', uid: 'uid1' }, cluster: remoteClusterName },
          { metadata: { name: 'pod2', uid: 'uid2' }, spec: { foo: 'bar' }, cluster: remoteClusterName },
        ])
      })
      // Simulate DELETE event
      const deleteEvent = {
        data: JSON.stringify({
          type: 'DELETED',
          object: { metadata: { name: 'pod1', uid: 'uid1' } },
        }),
      }
      mockWebSocket.onmessage(deleteEvent as any)
      await waitFor(() => {
        expect(result.current[0]).toEqual([
          { metadata: { name: 'pod2', uid: 'uid2' }, spec: { foo: 'bar' }, cluster: remoteClusterName },
        ])
      })
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
