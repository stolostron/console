/* Copyright Contributors to the Open Cluster Management project */
import { fleetWatch, buildResourceURL, getResourcePath } from './apiRequests'

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
      const options = { ns: 'default', name: 'test-pod' }
      const result = getResourcePath(mockModel, options)
      expect(result).toBe('/api/v1/namespaces/default/pods/test-pod')
    })

    it('should build path for cluster-scoped resource', () => {
      const clusterScopedModel = { ...mockModel, namespaced: false, plural: 'nodes' }
      const options = { name: 'test-node' }
      const result = getResourcePath(clusterScopedModel, options)
      expect(result).toBe('/api/v1/nodes/test-node')
    })

    it('should handle special characters in names', () => {
      const options = { ns: 'default', name: 'test#pod' }
      const result = getResourcePath(mockModel, options)
      expect(result).toBe('/api/v1/namespaces/default/pods/test%23pod')
    })

    it('should include query parameters', () => {
      const options = {
        ns: 'default',
        queryParams: { labelSelector: 'app=test' },
      }
      const result = getResourcePath(mockModel, options)
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
        basePath: '/api/proxy/plugin/acm/console/multicloud',
      }
      const result = buildResourceURL(params)
      expect(result).toBe('/api/proxy/plugin/acm/console/multicloud/api/v1/namespaces/default/pods/test-pod')
    })
  })
})
