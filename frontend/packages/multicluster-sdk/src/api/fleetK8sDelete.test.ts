import { FleetK8sDeleteOptions, FleetK8sResourceCommon } from '../types'
/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON, k8sDelete } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { fleetK8sDelete } from './fleetK8sDelete'
import { isHubRequest } from '../internal/isHubRequest'

// Mock all dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: {
    delete: jest.fn(),
  },
  k8sDelete: jest.fn(),
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
const mockK8sDelete = k8sDelete as jest.MockedFunction<typeof k8sDelete>
const mockGetOptionsWithoutCluster = getOptionsWithoutCluster as jest.MockedFunction<typeof getOptionsWithoutCluster>
const mockGetClusterFromOptions = getClusterFromOptions as jest.MockedFunction<typeof getClusterFromOptions>
const mockGetResourceURLFromOptions = getResourceURLFromOptions as jest.MockedFunction<typeof getResourceURLFromOptions>
const mockIsHubRequest = isHubRequest as jest.MockedFunction<typeof isHubRequest>

describe('fleetK8sDelete', () => {
  // Mock data
  const mockModel = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    plural: 'configmaps',
    abbr: 'cm',
    label: 'ConfigMap',
    labelPlural: 'ConfigMaps',
    propagationPolicy: 'Foreground' as const,
  }

  const mockResource: FleetK8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name: 'test-configmap',
      namespace: 'default',
      uid: '12345-67890',
      resourceVersion: '1',
    },
  }

  const mockOptions: FleetK8sDeleteOptions<FleetK8sResourceCommon> = {
    cluster: 'test-cluster',
    model: mockModel,
    resource: mockResource,
  }

  const mockOptionsWithoutCluster = {
    model: mockModel,
    resource: { ...mockResource },
  } as any

  const mockDeletedResource: FleetK8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'Status',
    metadata: {
      name: 'test-configmap',
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
      mockK8sDelete.mockResolvedValue(mockDeletedResource)
    })

    it('should use k8sDelete for hub cluster requests', async () => {
      const result = await fleetK8sDelete(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('local-cluster')
      expect(mockK8sDelete).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(mockConsoleFetchJSON.delete).not.toHaveBeenCalled()
      expect(mockGetResourceURLFromOptions).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockDeletedResource,
        cluster: 'local-cluster',
      })
    })

    it('should handle undefined cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue(undefined)

      const result = await fleetK8sDelete(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith(undefined)
      expect(mockK8sDelete).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockDeletedResource,
        cluster: undefined,
      })
    })

    it('should handle empty string cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue('')

      const result = await fleetK8sDelete(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith('')
      expect(mockK8sDelete).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockDeletedResource,
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
      mockConsoleFetchJSON.delete.mockResolvedValue(mockDeletedResource)
    })

    it('should use consoleFetchJSON.delete for managed cluster requests', async () => {
      const result = await fleetK8sDelete(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('remote-cluster')
      expect(mockGetResourceURLFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockConsoleFetchJSON.delete).toHaveBeenCalledWith(
        '/mock/resource/url',
        { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground' },
        undefined
      )
      expect(mockK8sDelete).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockDeletedResource,
        cluster: 'remote-cluster',
      })
    })

    it('should use custom json when provided', async () => {
      const customJson = { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Background' }
      const optionsWithJson = { ...mockOptions, json: customJson }

      await fleetK8sDelete(optionsWithJson)

      expect(mockConsoleFetchJSON.delete).toHaveBeenCalledWith('/mock/resource/url', customJson, undefined)
    })

    it('should pass requestInit when provided', async () => {
      const requestInit = { headers: { Authorization: 'Bearer token' } }
      const optionsWithRequestInit = { ...mockOptions, requestInit }

      await fleetK8sDelete(optionsWithRequestInit)

      expect(mockConsoleFetchJSON.delete).toHaveBeenCalledWith(
        '/mock/resource/url',
        { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy: 'Foreground' },
        requestInit
      )
    })

    it('should handle model without propagationPolicy', async () => {
      const { propagationPolicy, ...modelWithoutPropPolicy } = mockModel
      const optionsWithoutPropPolicy = { ...mockOptions, model: modelWithoutPropPolicy }

      mockGetOptionsWithoutCluster.mockReturnValue({
        model: modelWithoutPropPolicy,
        resource: { ...mockResource },
      } as Omit<FleetK8sDeleteOptions<FleetK8sResourceCommon>, 'cluster'>)

      await fleetK8sDelete(optionsWithoutPropPolicy)

      expect(mockConsoleFetchJSON.delete).toHaveBeenCalledWith('/mock/resource/url', undefined, undefined)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('test-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
    })

    it('should propagate errors from k8sDelete for hub requests', async () => {
      const error = new Error('K8s delete failed')
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sDelete.mockRejectedValue(error)

      await expect(fleetK8sDelete(mockOptions)).rejects.toThrow('K8s delete failed')
    })

    it('should propagate errors from consoleFetchJSON.delete for managed cluster requests', async () => {
      const error = new Error('Fetch delete failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('http://test-url')
      mockConsoleFetchJSON.delete.mockRejectedValue(error)

      await expect(fleetK8sDelete(mockOptions)).rejects.toThrow('Fetch delete failed')
    })

    it('should propagate errors from isHubRequest', async () => {
      const error = new Error('Hub request check failed')
      mockIsHubRequest.mockRejectedValue(error)

      await expect(fleetK8sDelete(mockOptions)).rejects.toThrow('Hub request check failed')
    })

    it('should propagate errors from getResourceURLFromOptions', async () => {
      const error = new Error('URL generation failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockRejectedValue(error)

      await expect(fleetK8sDelete(mockOptions)).rejects.toThrow('URL generation failed')
    })
  })
})
