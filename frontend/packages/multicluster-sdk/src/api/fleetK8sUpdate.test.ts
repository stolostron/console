/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sCreateUpdateOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sUpdate } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { fleetK8sUpdate } from './fleetK8sUpdate'
import { isHubRequest } from '../internal/isHubRequest'

// Mock all dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: {
    put: jest.fn(),
  },
  k8sUpdate: jest.fn(),
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
const mockK8sUpdate = k8sUpdate as jest.MockedFunction<typeof k8sUpdate>
const mockGetOptionsWithoutCluster = getOptionsWithoutCluster as jest.MockedFunction<typeof getOptionsWithoutCluster>
const mockGetClusterFromOptions = getClusterFromOptions as jest.MockedFunction<typeof getClusterFromOptions>
const mockGetResourceURLFromOptions = getResourceURLFromOptions as jest.MockedFunction<typeof getResourceURLFromOptions>
const mockIsHubRequest = isHubRequest as jest.MockedFunction<typeof isHubRequest>

describe('fleetK8sUpdate', () => {
  // Mock data
  const mockModel = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    plural: 'configmaps',
    abbr: 'cm',
    label: 'ConfigMap',
    labelPlural: 'ConfigMaps',
  }

  const mockResource = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'test-configmap',
      namespace: 'default',
      uid: '12345-67890',
      resourceVersion: '1',
    },
    data: {
      'config.yaml': 'updated-value',
      'new-config.yaml': 'new-value',
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

  const mockUpdatedResource: FleetK8sResourceCommon = {
    ...mockResource,
    metadata: {
      ...mockResource.metadata,
      resourceVersion: '2',
      labels: {
        'app.kubernetes.io/managed-by': 'fleet-k8s-update',
      },
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
      mockK8sUpdate.mockResolvedValue(mockUpdatedResource)
    })

    it('should use k8sUpdate for hub cluster requests', async () => {
      const result = await fleetK8sUpdate(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('local-cluster')
      expect(mockK8sUpdate).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(mockConsoleFetchJSON.put).not.toHaveBeenCalled()
      expect(mockGetResourceURLFromOptions).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockUpdatedResource,
        cluster: 'local-cluster',
      })
    })

    it('should handle undefined cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue(undefined)

      const result = await fleetK8sUpdate(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith(undefined)
      expect(mockK8sUpdate).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockUpdatedResource,
        cluster: undefined,
      })
    })

    it('should handle empty string cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue('')

      const result = await fleetK8sUpdate(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith('')
      expect(mockK8sUpdate).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockUpdatedResource,
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
      mockConsoleFetchJSON.put.mockResolvedValue(mockUpdatedResource)
    })

    it('should use consoleFetchJSON.put for managed cluster requests', async () => {
      const result = await fleetK8sUpdate(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('remote-cluster')
      expect(mockGetResourceURLFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockConsoleFetchJSON.put).toHaveBeenCalledWith('/mock/resource/url', mockOptionsWithoutCluster.data)
      expect(mockK8sUpdate).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockUpdatedResource,
        cluster: 'remote-cluster',
      })
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('test-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
    })

    it('should propagate errors from k8sUpdate for hub requests', async () => {
      const error = new Error('K8s update failed')
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sUpdate.mockRejectedValue(error)

      await expect(fleetK8sUpdate(mockOptions)).rejects.toThrow('K8s update failed')
    })

    it('should propagate errors from consoleFetchJSON.put for managed cluster requests', async () => {
      const error = new Error('Fetch failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('http://test-url')
      mockConsoleFetchJSON.put.mockRejectedValue(error)

      await expect(fleetK8sUpdate(mockOptions)).rejects.toThrow('Fetch failed')
    })

    it('should propagate errors from isHubRequest', async () => {
      const error = new Error('Hub request check failed')
      mockIsHubRequest.mockRejectedValue(error)

      await expect(fleetK8sUpdate(mockOptions)).rejects.toThrow('Hub request check failed')
    })

    it('should propagate errors from getResourceURLFromOptions', async () => {
      const error = new Error('URL generation failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockRejectedValue(error)

      await expect(fleetK8sUpdate(mockOptions)).rejects.toThrow('URL generation failed')
    })
  })
})
