/* Copyright Contributors to the Open Cluster Management project */

import { getURLSearchParam } from './searchPaths'

describe('searchPaths', () => {
  describe('getURLSearchParam', () => {
    it('should create basic search param with only cluster', () => {
      const resource = { cluster: 'my-cluster' }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster')
    })

    it('should include kind when provided', () => {
      const resource = { cluster: 'my-cluster', kind: 'Pod' }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster%26kind%3DPod')
    })

    it('should include namespace when provided', () => {
      const resource = { cluster: 'my-cluster', namespace: 'default' }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster%26namespace%3Ddefault')
    })

    it('should include name when provided', () => {
      const resource = { cluster: 'my-cluster', name: 'my-pod' }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster%26name%3Dmy-pod')
    })

    it('should combine apigroup and apiversion with slash when both provided', () => {
      const resource = {
        cluster: 'my-cluster',
        apigroup: 'apps',
        apiversion: 'v1',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster%26apiversion%3Dapps%2Fv1')
    })

    it('should use only apiversion when apigroup is not provided', () => {
      const resource = {
        cluster: 'my-cluster',
        apiversion: 'v1',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster%26apiversion%3Dv1')
    })

    it('should not include apiversion when only apigroup is provided', () => {
      const resource = {
        cluster: 'my-cluster',
        apigroup: 'apps',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster')
    })

    it('should include _hubClusterResource when set to true', () => {
      const resource = {
        cluster: 'my-cluster',
        _hubClusterResource: 'true',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster%26_hubClusterResource%3Dtrue')
    })

    it('should not include _hubClusterResource when set to false', () => {
      const resource = {
        cluster: 'my-cluster',
        _hubClusterResource: 'false',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster')
    })

    it('should not include _hubClusterResource when set to other values', () => {
      const resource = {
        cluster: 'my-cluster',
        _hubClusterResource: 'yes',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster')
    })

    it('should handle all parameters together', () => {
      const resource = {
        cluster: 'production-cluster',
        kind: 'Deployment',
        apigroup: 'apps',
        apiversion: 'v1',
        namespace: 'production',
        name: 'my-app',
        _hubClusterResource: 'true',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe(
        '?cluster%3Dproduction-cluster%26kind%3DDeployment%26apiversion%3Dapps%2Fv1%26namespace%3Dproduction%26name%3Dmy-app%26_hubClusterResource%3Dtrue'
      )
    })

    it('should handle empty string values for optional parameters', () => {
      const resource = {
        cluster: 'my-cluster',
        kind: '',
        namespace: '',
        name: '',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster')
    })

    it('should properly encode special characters in cluster name', () => {
      const resource = { cluster: 'cluster with spaces & symbols' }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dcluster%20with%20spaces%20%26%20symbols')
    })

    it('should properly encode special characters in all parameters', () => {
      const resource = {
        cluster: 'test/cluster',
        kind: 'Custom Resource',
        namespace: 'test-ns/production',
        name: 'resource@domain.com',
        apigroup: 'custom.io',
        apiversion: 'v1beta1',
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe(
        '?cluster%3Dtest%2Fcluster%26kind%3DCustom%20Resource%26apiversion%3Dcustom.io%2Fv1beta1%26namespace%3Dtest-ns%2Fproduction%26name%3Dresource%40domain.com'
      )
    })

    it('should handle undefined cluster gracefully', () => {
      const resource = { kind: 'Pod' }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dundefined%26kind%3DPod')
    })

    it('should handle null cluster gracefully', () => {
      const resource = { cluster: null, kind: 'Pod' }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dnull%26kind%3DPod')
    })

    it('should handle numeric values in parameters', () => {
      const resource = {
        cluster: 123,
        kind: 'Pod',
        name: 456,
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3D123%26kind%3DPod%26name%3D456')
    })

    it('should not include parameters when they are null', () => {
      const resource = {
        cluster: 'my-cluster',
        kind: null,
        namespace: null,
        name: null,
        apiversion: null,
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster')
    })

    it('should not include parameters when they are undefined', () => {
      const resource = {
        cluster: 'my-cluster',
        kind: undefined,
        namespace: undefined,
        name: undefined,
        apiversion: undefined,
      }
      const result = getURLSearchParam(resource)
      expect(result).toBe('?cluster%3Dmy-cluster')
    })
  })
})
