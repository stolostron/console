import { FleetK8sGetOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sGet } from '@openshift-console/dynamic-plugin-sdk'
/* Copyright Contributors to the Open Cluster Management project */
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { fleetK8sGet } from './fleetK8sGet'
import { isHubRequest } from '../internal/isHubRequest'

// Mock all dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: jest.fn(),
  k8sGet: jest.fn(),
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
const mockK8sGet = k8sGet as jest.MockedFunction<typeof k8sGet>
const mockGetOptionsWithoutCluster = getOptionsWithoutCluster as jest.MockedFunction<typeof getOptionsWithoutCluster>
const mockGetClusterFromOptions = getClusterFromOptions as jest.MockedFunction<typeof getClusterFromOptions>
const mockGetResourceURLFromOptions = getResourceURLFromOptions as jest.MockedFunction<typeof getResourceURLFromOptions>
const mockIsHubRequest = isHubRequest as jest.MockedFunction<typeof isHubRequest>

describe('fleetK8sGet', () => {
  // Mock data
  const mockModel = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    plural: 'configmaps',
    abbr: 'cm',
    label: 'ConfigMap',
    labelPlural: 'ConfigMaps',
  }

  const mockOptions: FleetK8sGetOptions = {
    cluster: 'test-cluster',
    model: mockModel,
    name: 'test-configmap',
    ns: 'default',
  }

  const mockOptionsWithoutCluster = {
    model: mockModel,
    name: 'test-configmap',
    ns: 'default',
  } as any

  const mockRetrievedResource: FleetK8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'test-configmap',
      namespace: 'default',
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
      mockK8sGet.mockResolvedValue(mockRetrievedResource)
    })

    it('should use k8sGet for hub cluster requests', async () => {
      const result = await fleetK8sGet(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('local-cluster')
      expect(mockK8sGet).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(mockConsoleFetchJSON).not.toHaveBeenCalled()
      expect(mockGetResourceURLFromOptions).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockRetrievedResource,
        cluster: 'local-cluster',
      })
    })

    it('should handle undefined cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue(undefined)

      const result = await fleetK8sGet(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith(undefined)
      expect(mockK8sGet).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockRetrievedResource,
        cluster: undefined,
      })
    })

    it('should handle empty string cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue('')

      const result = await fleetK8sGet(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith('')
      expect(mockK8sGet).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockRetrievedResource,
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
      mockConsoleFetchJSON.mockResolvedValue(mockRetrievedResource)
    })

    it('should use consoleFetchJSON for managed cluster requests', async () => {
      const result = await fleetK8sGet(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('remote-cluster')
      expect(mockGetResourceURLFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockConsoleFetchJSON).toHaveBeenCalledWith('/mock/resource/url', 'GET', undefined)
      expect(mockK8sGet).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockRetrievedResource,
        cluster: 'remote-cluster',
      })
    })

    it('should pass requestInit when provided', async () => {
      const requestInit = { headers: { Authorization: 'Bearer token' } }
      const optionsWithRequestInit = { ...mockOptions, requestInit }

      await fleetK8sGet(optionsWithRequestInit)

      expect(mockConsoleFetchJSON).toHaveBeenCalledWith('/mock/resource/url', 'GET', requestInit)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('test-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
    })

    it('should propagate errors from k8sGet for hub requests', async () => {
      const error = new Error('K8s get failed')
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sGet.mockRejectedValue(error)

      await expect(fleetK8sGet(mockOptions)).rejects.toThrow('K8s get failed')
    })

    it('should propagate errors from consoleFetchJSON for managed cluster requests', async () => {
      const error = new Error('Fetch failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('http://test-url')
      mockConsoleFetchJSON.mockRejectedValue(error)

      await expect(fleetK8sGet(mockOptions)).rejects.toThrow('Fetch failed')
    })

    it('should propagate errors from isHubRequest', async () => {
      const error = new Error('Hub request check failed')
      mockIsHubRequest.mockRejectedValue(error)

      await expect(fleetK8sGet(mockOptions)).rejects.toThrow('Hub request check failed')
    })

    it('should propagate errors from getResourceURLFromOptions', async () => {
      const error = new Error('URL generation failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockRejectedValue(error)

      await expect(fleetK8sGet(mockOptions)).rejects.toThrow('URL generation failed')
    })
  })
})
