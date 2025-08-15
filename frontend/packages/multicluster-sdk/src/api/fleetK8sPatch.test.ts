/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sPatchOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sPatch } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { Patch } from '@openshift-console/dynamic-plugin-sdk'
import { fleetK8sPatch } from './fleetK8sPatch'
import { isHubRequest } from '../internal/isHubRequest'

// Mock all dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  consoleFetchJSON: {
    patch: jest.fn(),
  },
  k8sPatch: jest.fn(),
}))

jest.mock('../internal/apiRequests', () => ({
  getOptionsWithoutCluster: jest.fn(),
  getClusterFromOptions: jest.fn(),
  getResourceURLFromOptions: jest.fn(),
}))

jest.mock('../internal/isHubRequest', () => ({
  isHubRequest: jest.fn(),
}))

const mockConsoleFetchJSON = consoleFetchJSON as jest.Mocked<typeof consoleFetchJSON>
const mockK8sPatch = k8sPatch as jest.MockedFunction<typeof k8sPatch>
const mockGetOptionsWithoutCluster = getOptionsWithoutCluster as jest.MockedFunction<typeof getOptionsWithoutCluster>
const mockGetClusterFromOptions = getClusterFromOptions as jest.MockedFunction<typeof getClusterFromOptions>
const mockGetResourceURLFromOptions = getResourceURLFromOptions as jest.MockedFunction<typeof getResourceURLFromOptions>
const mockIsHubRequest = isHubRequest as jest.MockedFunction<typeof isHubRequest>

describe('fleetK8sPatch', () => {
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
      uid: '12345-67890',
      resourceVersion: '1',
    },
  }

  const mockPatchData: Patch[] = [
    {
      op: 'replace',
      path: '/metadata/labels/env',
      value: 'production',
    },
    {
      op: 'add',
      path: '/metadata/annotations/updated',
      value: 'true',
    },
  ]

  const mockOptions: FleetK8sPatchOptions<FleetK8sResourceCommon> = {
    cluster: 'test-cluster',
    model: mockModel,
    resource: mockResource,
    data: mockPatchData,
  }

  const mockOptionsWithoutCluster = {
    model: mockModel,
    resource: { ...mockResource },
    data: mockPatchData,
  } as any

  const mockPatchedResource: FleetK8sResourceCommon = {
    ...mockResource,
    metadata: {
      ...mockResource.metadata,
      labels: {
        env: 'production',
      },
      annotations: {
        updated: 'true',
      },
      resourceVersion: '2',
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
      mockK8sPatch.mockResolvedValue(mockPatchedResource)
    })

    it('should use k8sPatch for hub cluster requests', async () => {
      const result = await fleetK8sPatch(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('local-cluster')
      expect(mockK8sPatch).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(mockConsoleFetchJSON.patch).not.toHaveBeenCalled()
      expect(mockGetResourceURLFromOptions).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockPatchedResource,
        cluster: 'local-cluster',
      })
    })

    it('should handle undefined cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue(undefined)

      const result = await fleetK8sPatch(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith(undefined)
      expect(mockK8sPatch).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockPatchedResource,
        cluster: undefined,
      })
    })

    it('should handle empty string cluster name as hub request', async () => {
      mockGetClusterFromOptions.mockReturnValue('')

      const result = await fleetK8sPatch(mockOptions)

      expect(mockIsHubRequest).toHaveBeenCalledWith('')
      expect(mockK8sPatch).toHaveBeenCalledWith(mockOptionsWithoutCluster)
      expect(result).toEqual({
        ...mockPatchedResource,
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
      mockConsoleFetchJSON.patch.mockResolvedValue(mockPatchedResource)
    })

    it('should use consoleFetchJSON.patch for managed cluster requests', async () => {
      const result = await fleetK8sPatch(mockOptions)

      expect(mockGetClusterFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockGetOptionsWithoutCluster).toHaveBeenCalledWith(mockOptions)
      expect(mockIsHubRequest).toHaveBeenCalledWith('remote-cluster')
      expect(mockGetResourceURLFromOptions).toHaveBeenCalledWith(mockOptions)
      expect(mockConsoleFetchJSON.patch).toHaveBeenCalledWith('/mock/resource/url', mockPatchData)
      expect(mockK8sPatch).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockPatchedResource,
        cluster: 'remote-cluster',
      })
    })

    it('should handle empty patches array for managed cluster', async () => {
      const emptyPatchesData = [null, undefined, false, 0, '']
      const optionsWithEmptyPatches = { ...mockOptions, data: emptyPatchesData }

      const result = await fleetK8sPatch(optionsWithEmptyPatches as any)

      expect(mockConsoleFetchJSON.patch).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockResource,
        cluster: 'remote-cluster',
      })
    })

    it('should filter out null/undefined patches using compact', async () => {
      const patchesWithNulls = [mockPatchData[0], null, mockPatchData[1], undefined]
      const optionsWithNulls = { ...mockOptions, data: patchesWithNulls }

      await fleetK8sPatch(optionsWithNulls as any)

      expect(mockConsoleFetchJSON.patch).toHaveBeenCalledWith('/mock/resource/url', mockPatchData)
    })

    it('should handle single patch operation', async () => {
      const singlePatch = [mockPatchData[0]]
      const optionsWithSinglePatch = { ...mockOptions, data: singlePatch }

      await fleetK8sPatch(optionsWithSinglePatch)

      expect(mockConsoleFetchJSON.patch).toHaveBeenCalledWith('/mock/resource/url', singlePatch)
    })

    it('should handle different patch operations', async () => {
      const complexPatches: Patch[] = [
        { op: 'add', path: '/metadata/labels/new-label', value: 'new-value' },
        { op: 'remove', path: '/metadata/labels/old-label' },
        { op: 'replace', path: '/metadata/labels/env', value: 'staging' },
        { op: 'add', path: '/metadata/labels/environment', value: 'production' },
        { op: 'test', path: '/metadata/labels/env', value: 'staging' },
      ]
      const optionsWithComplexPatches = { ...mockOptions, data: complexPatches }

      await fleetK8sPatch(optionsWithComplexPatches)

      expect(mockConsoleFetchJSON.patch).toHaveBeenCalledWith('/mock/resource/url', complexPatches)
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('test-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
    })

    it('should propagate errors from k8sPatch for hub requests', async () => {
      const error = new Error('K8s patch failed')
      mockIsHubRequest.mockResolvedValue(true)
      mockK8sPatch.mockRejectedValue(error)

      await expect(fleetK8sPatch(mockOptions)).rejects.toThrow('K8s patch failed')
    })

    it('should propagate errors from consoleFetchJSON.patch for managed cluster requests', async () => {
      const error = new Error('Fetch patch failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('http://test-url')
      mockConsoleFetchJSON.patch.mockRejectedValue(error)

      await expect(fleetK8sPatch(mockOptions)).rejects.toThrow('Fetch patch failed')
    })

    it('should propagate errors from isHubRequest', async () => {
      const error = new Error('Hub request check failed')
      mockIsHubRequest.mockRejectedValue(error)

      await expect(fleetK8sPatch(mockOptions)).rejects.toThrow('Hub request check failed')
    })

    it('should propagate errors from getResourceURLFromOptions', async () => {
      const error = new Error('URL generation failed')
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockRejectedValue(error)

      await expect(fleetK8sPatch(mockOptions)).rejects.toThrow('URL generation failed')
    })
  })

  describe('patch data processing', () => {
    beforeEach(() => {
      mockGetClusterFromOptions.mockReturnValue('remote-cluster')
      mockGetOptionsWithoutCluster.mockReturnValue(mockOptionsWithoutCluster)
      mockIsHubRequest.mockResolvedValue(false)
      mockGetResourceURLFromOptions.mockResolvedValue('/mock/resource/url')
      mockConsoleFetchJSON.patch.mockResolvedValue(mockPatchedResource)
    })

    it('should correctly process patch data with compact', async () => {
      const patchesWithFalsyValues = [mockPatchData[0], null, mockPatchData[1], undefined, false, 0, '']
      const expectedCompactResult = [mockPatchData[0], mockPatchData[1]]

      const optionsWithFalsyPatches = { ...mockOptions, data: patchesWithFalsyValues }

      await fleetK8sPatch(optionsWithFalsyPatches as any)

      expect(mockConsoleFetchJSON.patch).toHaveBeenCalledWith('/mock/resource/url', expectedCompactResult)
    })

    it('should handle when compact returns empty array', async () => {
      const patchesWithOnlyFalsyValues = [null, undefined, false, 0, '']
      const optionsWithFalsyPatches = { ...mockOptions, data: patchesWithOnlyFalsyValues }

      const result = await fleetK8sPatch(optionsWithFalsyPatches as any)

      expect(mockConsoleFetchJSON.patch).not.toHaveBeenCalled()
      expect(result).toEqual({
        ...mockResource,
        cluster: 'remote-cluster',
      })
    })
  })
})
