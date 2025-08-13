/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sCreateUpdateOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sCreate } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { fleetK8sCreate } from './fleetK8sCreate'
import { isHubRequest } from '../internal/isHubRequest'

// Mock all dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: {
    post: jest.fn(),
  },
  k8sCreate: jest.fn(),
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
const mockConsoleFetchJSON = consoleFetchJSON as jest.Mocked<typeof consoleFetchJSON>
const mockK8sCreate = k8sCreate as jest.MockedFunction<typeof k8sCreate>
const mockGetOptionsWithoutCluster = getOptionsWithoutCluster as jest.MockedFunction<typeof getOptionsWithoutCluster>
const mockGetClusterFromOptions = getClusterFromOptions as jest.MockedFunction<typeof getClusterFromOptions>
const mockGetResourceURLFromOptions = getResourceURLFromOptions as jest.MockedFunction<typeof getResourceURLFromOptions>
const mockIsHubRequest = isHubRequest as jest.MockedFunction<typeof isHubRequest>

describe('fleetK8sCreate', () => {
  // Mock data
  const mockModel = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    plural: 'configmaps',
    abbr: 'cm',
    label: 'ConfigMap',
    labelPlural: 'ConfigMaps',
  }

  const mockResource: FleetK8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'test-configmap',
      namespace: 'default',
    },
  }

  const mockOptions: FleetK8sCreateUpdateOptions<FleetK8sResourceCommon> = {
    cluster: 'test-cluster',
    model: mockModel,
    data: mockResource,
  }

  const mockOptionsWithoutCluster = {
    model: mockModel,
    data: { ...mockResource },
  }

  const mockCreatedResource: FleetK8sResourceCommon = {
    ...mockResource,
    metadata: {
      ...mockResource.metadata,
      uid: '12345-67890',
      resourceVersion: '1',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('when request is for hub cluster', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('local-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sCreate.mockResolvedValue(mockCreatedResource)
    })

    it('should use k8sCreate for hub cluster requests', async () => {
      const result = await fleetK8sCreate(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('local-cluster')
      expect(mockK8sCreate).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(mockConsoleFetchJSON.post).not.toHaveBeenCalled()
      expect(mockGetResourceURLFromOptions).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockCreatedResource,
        cluster: 'local-cluster',
      })
    })

    it('should handle undefined cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue(undefined)

      const result = await fleetK8sCreate(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith(undefined)
      expect(mockK8sCreate).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockCreatedResource,
        cluster: undefined,
      })
    })

    it('should handle empty string cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue('')

      const result = await fleetK8sCreate(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith('')
      expect(mockK8sCreate).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockCreatedResource,
        cluster: '',
      })
    })
  })

  describe('when request is for managed cluster', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('remote-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('/mock/resource/url')
      mockConsoleFetchJSON.post.mockResolvedValue(mockCreatedResource)
    })

    it('should use consoleFetchJSON.post for managed cluster requests', async () => {
      const result = await fleetK8sCreate(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('remote-cluster')
      expect(mockGetResourceURLFromOptions).toHaveBeenCalledWith(mockOptions, true)
      expect(mockConsoleFetchJSON.post).toHaveBeenCalledWith('/mock/resource/url', mockOptionsWithoutCluster.data)
      expect(mockK8sCreate).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockCreatedResource,
        cluster: 'remote-cluster',
      })
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('test-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
    })

    it('should propagate errors from k8sCreate for hub requests', async () => {
      const error = new Error('K8s create failed')
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sCreate.mockRejectedValue(error)

      await expect(fleetK8sCreate(mockOptions)).rejects.toThrow('K8s create failed')
    })

    it('should propagate errors from consoleFetchJSON.post for managed cluster requests', async () => {
      const error = new Error('Fetch failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('http://test-url')
      mockConsoleFetchJSON.post.mockRejectedValue(error)

      await expect(fleetK8sCreate(mockOptions)).rejects.toThrow('Fetch failed')
    })

    it('should propagate errors from isHubRequest', async () => {
      const error = new Error('Hub request check failed')
      mockIsHubRequest.mockRejectedValue(error)

      await expect(fleetK8sCreate(mockOptions)).rejects.toThrow('Hub request check failed')
    })

    it('should propagate errors from getResourceURLFromOptions', async () => {
      const error = new Error('URL generation failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockRejectedValue(error)

      await expect(fleetK8sCreate(mockOptions)).rejects.toThrow('URL generation failed')
    })
  })
})
