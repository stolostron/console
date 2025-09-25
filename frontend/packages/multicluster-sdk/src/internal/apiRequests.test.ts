/* Copyright Contributors to the Open Cluster Management project */
import {
  FleetK8sAPIOptions,
  buildResourceURL,
  fleetWatch,
  getClusterFromOptions,
  getNameFromOptions,
  getNamespaceFromOptions,
  getOptionsWithoutCluster,
  getResourcePath,
  getResourceURLFromOptions,
} from './apiRequests'

import { FleetK8sResourceCommon } from '../types'
import { getFleetK8sAPIPath } from '../api/getFleetK8sAPIPath'

// Mock the getFleetK8sAPIPath function
jest.mock('../api/getFleetK8sAPIPath', () => ({
  getFleetK8sAPIPath: jest.fn(),
}))

const mockGetFleetK8sAPIPath = getFleetK8sAPIPath as jest.MockedFunction<typeof getFleetK8sAPIPath>

// mock WebSocket
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  url: '',
  protocol: '',
  extensions: '',
  bufferedAmount: 0,
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  binaryType: 'blob' as BinaryType,
  dispatchEvent: jest.fn(),
})) as any

describe('apiRequests', () => {
  const mockModel = {
    apiVersion: 'v1',
    kind: 'Pod',
    plural: 'pods',
    namespaced: true,
    abbr: 'P',
    label: 'Pod',
    labelKey: 'public~Pod',
    labelPlural: 'Pods',
    labelPluralKey: 'public~Pods',
    id: 'pod',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetFleetK8sAPIPath.mockResolvedValue('/fake/api/path')
  })

  describe('fleetWatch', () => {
    it('should create WebSocket with correct URL', () => {
      const backendURL = '/proxy'
      const query = { ns: 'default', cluster: 'cluster1' }

      fleetWatch(mockModel, query, backendURL)

      expect(WebSocket).toHaveBeenCalledWith('/proxy/api/v1/namespaces/default/pods?watch=true')
    })

    it('should include labelSelector in query params', () => {
      const backendURL = '/proxy'
      const query = {
        ns: 'default',
        cluster: 'cluster1',
        labelSelector: { matchLabels: { app: 'test' } },
      }

      fleetWatch(mockModel, query, backendURL)

      expect(WebSocket).toHaveBeenCalledWith(
        '/proxy/api/v1/namespaces/default/pods?watch=true&labelSelector=app%3Dtest'
      )
    })

    it('should include fieldSelector in query params', () => {
      const backendURL = '/proxy'
      const query = {
        ns: 'default',
        cluster: 'cluster1',
        fieldSelector: 'metadata.name=test-pod',
      }

      fleetWatch(mockModel, query, backendURL)

      expect(WebSocket).toHaveBeenCalledWith(
        '/proxy/api/v1/namespaces/default/pods?watch=true&fieldSelector=metadata.name%3Dtest-pod'
      )
    })

    it('should include resourceVersion in query params', () => {
      const backendURL = '/proxy'
      const query = {
        ns: 'default',
        cluster: 'cluster1',
        resourceVersion: '12345',
      }

      fleetWatch(mockModel, query, backendURL)

      expect(WebSocket).toHaveBeenCalledWith('/proxy/api/v1/namespaces/default/pods?watch=true&resourceVersion=12345')
    })

    it('should handle cluster-scoped resources', () => {
      const clusterScopedModel = { ...mockModel, namespaced: false }
      const backendURL = '/proxy'
      const query = { cluster: 'cluster1' }

      fleetWatch(clusterScopedModel, query, backendURL)

      expect(WebSocket).toHaveBeenCalledWith('/proxy/api/v1/pods?watch=true')
    })

    it('should handle resources with names', () => {
      const backendURL = '/proxy'
      const query = {
        ns: 'default',
        cluster: 'cluster1',
      }

      // Note: fleetWatch doesn't handle 'name' in query, it's handled by getResourcePath
      fleetWatch(mockModel, query, backendURL)

      expect(WebSocket).toHaveBeenCalledWith('/proxy/api/v1/namespaces/default/pods?watch=true')
    })

    it('should handle non-core API groups', () => {
      const appsModel = {
        ...mockModel,
        apiVersion: 'apps/v1',
        apiGroup: 'apps',
      }
      const backendURL = '/proxy'
      const query = { ns: 'default', cluster: 'cluster1' }

      fleetWatch(appsModel, query, backendURL)

      expect(WebSocket).toHaveBeenCalledWith('/proxy/apis/apps/apps/v1/namespaces/default/pods?watch=true')
    })
  })

  describe('getResourcePath', () => {
    it('should build path for namespaced resource', () => {
      const result = getResourcePath({ model: mockModel, ns: 'default', name: 'test-pod' })
      expect(result).toBe('/api/v1/namespaces/default/pods/test-pod')
    })

    it('should build path for cluster-scoped resource', () => {
      const clusterScopedModel = { ...mockModel, namespaced: false, plural: 'nodes' }
      const result = getResourcePath({ model: clusterScopedModel, name: 'test-node' })
      expect(result).toBe('/api/v1/nodes/test-node')
    })

    it('should handle special characters in names', () => {
      const result = getResourcePath({ model: mockModel, ns: 'default', name: 'test#pod' })
      expect(result).toBe('/api/v1/namespaces/default/pods/test%23pod')
    })

    it('should include query parameters', () => {
      const result = getResourcePath({ model: mockModel, ns: 'default', queryParams: { labelSelector: 'app=test' } })
      expect(result).toBe('/api/v1/namespaces/default/pods?labelSelector=app%3Dtest')
    })
  })

  describe('buildResourceURL', () => {
    it('should build complete URL with base path', () => {
      const params = {
        model: mockModel,
        ns: 'default',
        name: 'test-pod',
        cluster: 'cluster1',
        basePath: '/api/proxy/plugin/mce/console/multicloud',
      }
      const result = buildResourceURL(params)
      expect(result).toBe('/api/proxy/plugin/mce/console/multicloud/api/v1/namespaces/default/pods/test-pod')
    })
  })

  describe('getClusterFromOptions', () => {
    it('should return cluster from options.cluster when present', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        cluster: 'options-cluster',
      }

      const result = getClusterFromOptions(options)

      expect(result).toBe('options-cluster')
    })

    it('should return cluster from data.cluster when options.cluster is not present', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'default' },
        cluster: 'data-cluster',
      }

      const options = {
        model: mockModel,
        data: mockResource,
      }

      const result = getClusterFromOptions(options)

      expect(result).toBe('data-cluster')
    })

    it('should return cluster from resource.cluster when options.cluster is not present', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'default' },
        cluster: 'resource-cluster',
      }

      const options = {
        model: mockModel,
        resource: mockResource,
      }

      const result = getClusterFromOptions(options)

      expect(result).toBe('resource-cluster')
    })

    it('should prioritize options.cluster over data.cluster', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'default' },
        cluster: 'data-cluster',
      }

      const options = {
        model: mockModel,
        cluster: 'options-cluster',
        data: mockResource,
      }

      const result = getClusterFromOptions(options)

      expect(result).toBe('options-cluster')
    })

    it('should return undefined when no cluster is found', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
      }

      const result = getClusterFromOptions(options)

      expect(result).toBeUndefined()
    })
  })

  describe('getNamespaceFromOptions', () => {
    it('should return namespace from options.ns when present', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        ns: 'options-namespace',
      }

      const result = getNamespaceFromOptions(options)

      expect(result).toBe('options-namespace')
    })

    it('should return namespace from data.metadata.namespace when options.ns is not present', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'data-namespace' },
      }

      const options = {
        model: mockModel,
        data: mockResource,
      }

      const result = getNamespaceFromOptions(options)

      expect(result).toBe('data-namespace')
    })

    it('should return namespace from resource.metadata.namespace when options.ns is not present', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'resource-namespace' },
      }

      const options = {
        model: mockModel,
        resource: mockResource,
      }

      const result = getNamespaceFromOptions(options)

      expect(result).toBe('resource-namespace')
    })

    it('should return namespace from queryParams.ns when other options are not present', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        queryParams: { ns: 'query-namespace' },
      }

      const result = getNamespaceFromOptions(options)

      expect(result).toBe('query-namespace')
    })

    it('should prioritize options.ns over other sources', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'data-namespace' },
      }

      const options = {
        model: mockModel,
        ns: 'options-namespace',
        data: mockResource,
        queryParams: { ns: 'query-namespace' },
      }

      const result = getNamespaceFromOptions(options)

      expect(result).toBe('options-namespace')
    })

    it('should return undefined when no namespace is found', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
      }

      const result = getNamespaceFromOptions(options)

      expect(result).toBeUndefined()
    })
  })

  describe('getNameFromOptions', () => {
    it('should return name from options.name when present', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        name: 'options-name',
      }

      const result = getNameFromOptions(options)

      expect(result).toBe('options-name')
    })

    it('should return name from data.metadata.name when options.name is not present', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'data-name', namespace: 'default' },
      }

      const options = {
        model: mockModel,
        data: mockResource,
      }

      const result = getNameFromOptions(options)

      expect(result).toBe('data-name')
    })

    it('should return name from resource.metadata.name when options.name is not present', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'resource-name', namespace: 'default' },
      }

      const options = {
        model: mockModel,
        resource: mockResource,
      }

      const result = getNameFromOptions(options)

      expect(result).toBe('resource-name')
    })

    it('should prioritize options.name over metadata.name', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'data-name', namespace: 'default' },
      }

      const options = {
        model: mockModel,
        name: 'options-name',
        data: mockResource,
      }

      const result = getNameFromOptions(options)

      expect(result).toBe('options-name')
    })

    it('should return undefined when no name is found', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
      }

      const result = getNameFromOptions(options)

      expect(result).toBeUndefined()
    })
  })

  describe('getOptionsWithoutCluster', () => {
    it('should remove cluster property from basic options', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        cluster: 'test-cluster',
        ns: 'default',
        name: 'test-pod',
      }

      const result = getOptionsWithoutCluster(options)

      expect(result).toEqual({
        model: mockModel,
        ns: 'default',
        name: 'test-pod',
      })
      expect(result).not.toHaveProperty('cluster')
    })

    it('should remove cluster property from options with data', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'default' },
        cluster: 'data-cluster',
      }

      const options = {
        model: mockModel,
        cluster: 'options-cluster',
        data: mockResource,
      }

      const result = getOptionsWithoutCluster(options)

      expect(result).toEqual({
        model: mockModel,
        data: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod', namespace: 'default' },
        },
      })
      expect(result).not.toHaveProperty('cluster')
      expect(result.data).not.toHaveProperty('cluster')
    })

    it('should remove cluster property from options with resource', () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'test-pod', namespace: 'default' },
        cluster: 'resource-cluster',
      }

      const options = {
        model: mockModel,
        cluster: 'options-cluster',
        resource: mockResource,
      }

      const result = getOptionsWithoutCluster(options)

      expect(result).toEqual({
        model: mockModel,
        resource: {
          apiVersion: 'v1',
          kind: 'Pod',
          metadata: { name: 'test-pod', namespace: 'default' },
        },
      })
      expect(result).not.toHaveProperty('cluster')
      expect(result.resource).not.toHaveProperty('cluster')
    })

    it('should handle options without cluster property', () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        ns: 'default',
        name: 'test-pod',
      }

      const result = getOptionsWithoutCluster(options)

      expect(result).toEqual({
        model: mockModel,
        ns: 'default',
        name: 'test-pod',
      })
    })
  })

  describe('getResourceURLFromOptions', () => {
    beforeEach(() => {
      mockGetFleetK8sAPIPath.mockResolvedValue('/fake/api/path')
    })

    it('should build URL for basic options', async () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        cluster: 'test-cluster',
        ns: 'default',
        name: 'test-pod',
      }

      const result = await getResourceURLFromOptions(options)

      expect(mockGetFleetK8sAPIPath).toHaveBeenCalledWith('test-cluster')
      expect(result).toBe('/fake/api/path/api/v1/namespaces/default/pods/test-pod')
    })

    it('should build URL for collection (without name)', async () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        cluster: 'test-cluster',
        ns: 'default',
      }

      const result = await getResourceURLFromOptions(options, true)

      expect(mockGetFleetK8sAPIPath).toHaveBeenCalledWith('test-cluster')
      expect(result).toBe('/fake/api/path/api/v1/namespaces/default/pods')
    })

    it('should build URL using cluster from data', async () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'data-pod', namespace: 'data-namespace' },
        cluster: 'data-cluster',
      }

      const options = {
        model: mockModel,
        data: mockResource,
      }

      const result = await getResourceURLFromOptions(options)

      expect(mockGetFleetK8sAPIPath).toHaveBeenCalledWith('data-cluster')
      expect(result).toBe('/fake/api/path/api/v1/namespaces/data-namespace/pods/data-pod')
    })

    it('should build URL using cluster from resource', async () => {
      const mockResource: FleetK8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { name: 'resource-pod', namespace: 'resource-namespace' },
        cluster: 'resource-cluster',
      }

      const options = {
        model: mockModel,
        resource: mockResource,
      }

      const result = await getResourceURLFromOptions(options)

      expect(mockGetFleetK8sAPIPath).toHaveBeenCalledWith('resource-cluster')
      expect(result).toBe('/fake/api/path/api/v1/namespaces/resource-namespace/pods/resource-pod')
    })

    it('should build URL with query parameters', async () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        cluster: 'test-cluster',
        ns: 'default',
        queryParams: { labelSelector: 'app=test' },
      }

      const result = await getResourceURLFromOptions(options, true)

      expect(result).toBe('/fake/api/path/api/v1/namespaces/default/pods?labelSelector=app%3Dtest')
    })

    it('should handle undefined cluster', async () => {
      const options: FleetK8sAPIOptions = {
        model: mockModel,
        ns: 'default',
        name: 'test-pod',
      }

      const result = await getResourceURLFromOptions(options)

      expect(mockGetFleetK8sAPIPath).toHaveBeenCalledWith(undefined)
      expect(result).toBe('/fake/api/path/api/v1/namespaces/default/pods/test-pod')
    })

    it('should handle cluster-scoped resources', async () => {
      const clusterScopedModel = { ...mockModel, namespaced: false, plural: 'nodes' }
      const options: FleetK8sAPIOptions = {
        model: clusterScopedModel,
        cluster: 'test-cluster',
        name: 'test-node',
      }

      const result = await getResourceURLFromOptions(options)

      expect(result).toBe('/fake/api/path/api/v1/nodes/test-node')
    })
  })
})
