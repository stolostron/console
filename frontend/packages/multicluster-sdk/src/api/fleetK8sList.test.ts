/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sListOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sList } from '@openshift-console/dynamic-plugin-sdk'
import { fleetK8sList, fleetK8sListItems } from './fleetK8sList'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

// Mock all dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: jest.fn(),
  k8sList: jest.fn(),
}))

jest.mock('../internal/apiRequests', () => ({
  getOptionsWithoutCluster: jest.fn(),
  getClusterFromOptions: jest.fn(),
  getResourceURLFromOptions: jest.fn(),
}))

jest.mock('../internal/isHubRequest', () => ({
  isHubRequest: jest.fn(),
}))

// Type the mocks
const mockConsoleFetchJSON = consoleFetchJSON as jest.MockedFunction<typeof consoleFetchJSON>
const mockK8sList = k8sList as jest.MockedFunction<typeof k8sList>
const mockGetOptionsWithoutCluster = getOptionsWithoutCluster as jest.MockedFunction<typeof getOptionsWithoutCluster>
const mockGetClusterFromOptions = getClusterFromOptions as jest.MockedFunction<typeof getClusterFromOptions>
const mockGetResourceURLFromOptions = getResourceURLFromOptions as jest.MockedFunction<typeof getResourceURLFromOptions>
const mockIsHubRequest = isHubRequest as jest.MockedFunction<typeof isHubRequest>

describe.each([
  ['fleetK8sList', fleetK8sList],
  ['fleetK8sListItems', fleetK8sListItems],
])('%s', (_functionName, fleetFunction) => {
  // Mock data
  const mockModel = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    plural: 'configmaps',
    abbr: 'cm',
    label: 'ConfigMap',
    labelPlural: 'ConfigMaps',
  }

  const mockOptions = {
    cluster: 'test-cluster',
    model: mockModel,
    queryParams: { labelSelector: 'app=test' },
  } as FleetK8sListOptions & { cluster?: string }

  const mockOptionsWithoutCluster = {
    model: mockModel,
    queryParams: { labelSelector: 'app=test' },
  } as any

  const mockResourceList: FleetK8sResourceCommon[] = [
    {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'test-configmap-1',
        namespace: 'default',
        uid: '12345-67890',
        resourceVersion: '1',
      },
    },
    {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: 'test-configmap-2',
        namespace: 'default',
        uid: '12345-67891',
        resourceVersion: '2',
      },
    },
  ]

  const mockManagedClusterResponse = {
    apiVersion: 'v1',
    kind: 'List',
    items: [
      {
        metadata: {
          name: 'test-configmap-1',
          namespace: 'default',
          uid: '12345-67890',
          resourceVersion: '1',
        },
      },
      {
        metadata: {
          name: 'test-configmap-2',
          namespace: 'default',
          uid: '12345-67891',
          resourceVersion: '2',
        },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when request is for hub cluster', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('local-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sList.mockResolvedValue(mockResourceList)
    })

    it('should use k8sList for hub cluster requests', async () => {
      const result = await fleetFunction(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('local-cluster')
      expect(mockK8sList).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
      expect(mockGetResourceURLFromOptions).not.toHaveBeenCalled()
      expect(result).toEqual([
        { ...mockResourceList[0], cluster: 'local-cluster' },
        { ...mockResourceList[1], cluster: 'local-cluster' },
      ])
    })

    it('should handle undefined cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue(undefined)

      const result = await fleetFunction(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith(undefined)
      expect(mockK8sList).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual([
        { ...mockResourceList[0], cluster: undefined },
        { ...mockResourceList[1], cluster: undefined },
      ])
    })

    it('should handle empty string cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue('')

      const result = await fleetFunction(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith('')
      expect(mockK8sList).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual([
        { ...mockResourceList[0], cluster: '' },
        { ...mockResourceList[1], cluster: '' },
      ])
    })

    it('should handle empty list from hub cluster', async () => {
      mockK8sList.mockResolvedValue([])

      const result = await fleetFunction(mockOptions)

      expect(result).toEqual([])
    })
  })

  describe('when request is for managed cluster', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('remote-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('/mock/resource/url')
      mockConsoleFetchJSON.mockResolvedValue(mockManagedClusterResponse)
    })

    it('should use consoleFetchJSON for managed cluster requests', async () => {
      const result = await fleetFunction(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('remote-cluster')
      expect(mockGetResourceURLFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockConsoleFetchJSON).toHaveBeenCalledWith('/mock/resource/url', 'GET', undefined)
      expect(mockK8sList).not.toHaveBeenCalled()
      expect(result).toEqual([
        {
          kind: 'ConfigMap',
          apiVersion: 'v1',
          metadata: {
            name: 'test-configmap-1',
            namespace: 'default',
            uid: '12345-67890',
            resourceVersion: '1',
          },
          cluster: 'remote-cluster',
        },
        {
          kind: 'ConfigMap',
          apiVersion: 'v1',
          metadata: {
            name: 'test-configmap-2',
            namespace: 'default',
            uid: '12345-67891',
            resourceVersion: '2',
          },
          cluster: 'remote-cluster',
        },
      ])
    })

    it('should pass requestInit when provided', async () => {
      const requestInit = { headers: { Authorization: 'Bearer token' } }
      const optionsWithRequestInit = { ...mockOptions, requestInit }

      await fleetFunction(optionsWithRequestInit)

      expect(mockConsoleFetchJSON).toHaveBeenCalledWith('/mock/resource/url', 'GET', requestInit)
    })

    it('should handle empty items array from managed cluster', async () => {
      const emptyResponse = { apiVersion: 'v1', kind: 'List', items: [] }
      mockConsoleFetchJSON.mockResolvedValue(emptyResponse)

      const result = await fleetFunction(mockOptions)

      expect(result).toEqual([])
    })

    it('should handle response without items property', async () => {
      const responseWithoutItems = { apiVersion: 'v1', kind: 'List' }
      mockConsoleFetchJSON.mockResolvedValue(responseWithoutItems)

      const result = await fleetFunction(mockOptions)

      expect(result).toEqual(undefined)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('test-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
    })

    it('should propagate errors from k8sList for hub requests', async () => {
      const error = new Error('K8s list failed')
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sList.mockRejectedValue(error)

      await expect(fleetFunction(mockOptions)).rejects.toThrow('K8s list failed')
    })

    it('should propagate errors from consoleFetchJSON for managed cluster requests', async () => {
      const error = new Error('Fetch failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('http://test-url')
      mockConsoleFetchJSON.mockRejectedValue(error)

      await expect(fleetFunction(mockOptions)).rejects.toThrow('Fetch failed')
    })

    it('should propagate errors from isHubRequest', async () => {
      const error = new Error('Hub request check failed')
      mockIsHubRequest.mockRejectedValue(error)

      await expect(fleetFunction(mockOptions)).rejects.toThrow('Hub request check failed')
    })

    it('should propagate errors from getResourceURLFromOptions', async () => {
      const error = new Error('URL generation failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockRejectedValue(error)

      await expect(fleetFunction(mockOptions)).rejects.toThrow('URL generation failed')
    })
  })
})
