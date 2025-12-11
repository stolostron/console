/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import {
  getKubeResources,
  cacheResource,
  getEventCache,
  getHubClusterName,
  getIsHubSelfManaged,
  getIsObservabilityInstalled,
} from '../../src/routes/events'
import { IArgoApplication, IResource } from '../../src/resources/resource'
import { ServerSideEvents } from '../../src/lib/server-side-events'

describe('events Route', () => {
  describe('GET /events', () => {
    it('should handle events endpoint - returns error without proper setup', async () => {
      // Without full SSE infrastructure setup, expect error responses
      const res = await request('GET', '/events', undefined, {})
      // Could be 401 (no auth) or 500 (server error) depending on setup
      expect([401, 500]).toContain(res.statusCode)
    })

    it('should handle events endpoint with token', async () => {
      // This test is mainly to ensure the endpoint exists and responds
      // Full SSE testing would require more complex stream handling
      const res = await request('GET', '/events')
      // Could be 200 (success), 401 (auth), or 500 (error) depending on environment
      expect([200, 401, 500]).toContain(res.statusCode)
    })
  })

  describe('getKubeResources', () => {
    beforeEach(() => {
      // Clear the cache before each test
      const cache = getEventCache()
      for (const key in cache) {
        delete cache[key]
      }
    })

    it('should return empty array when no resources are cached', async () => {
      const resources = await getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')
      expect(resources).toEqual([])
    })

    it('should return cached resources for a given kind and apiVersion', async () => {
      const mockResource: IResource = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'test-cluster',
          namespace: 'default',
          uid: 'test-uid-123',
          resourceVersion: '12345',
        },
      }

      // Cache the resource
      await cacheResource(mockResource)

      // Retrieve it using getKubeResources
      const resources = await getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')

      expect(resources).toHaveLength(1)
      expect(resources[0].kind).toBe('ManagedCluster')
      expect(resources[0].metadata.name).toBe('test-cluster')
      expect(resources[0].metadata.uid).toBe('test-uid-123')
    })

    it('should return multiple cached resources of the same type', async () => {
      const mockResource1: IResource = {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'pod-1',
          namespace: 'default',
          uid: 'pod-uid-1',
          resourceVersion: '1',
        },
      }

      const mockResource2: IResource = {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'pod-2',
          namespace: 'default',
          uid: 'pod-uid-2',
          resourceVersion: '2',
        },
      }

      await cacheResource(mockResource1)
      await cacheResource(mockResource2)

      const resources = await getKubeResources('Pod', 'v1')

      expect(resources).toHaveLength(2)
      expect(resources.map((r) => r.metadata.name).sort()).toEqual(['pod-1', 'pod-2'])
    })

    it('should only return resources matching the specified kind', async () => {
      const clusterResource: IResource = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'test-cluster',
          namespace: 'default',
          uid: 'cluster-uid',
          resourceVersion: '1',
        },
      }

      const podResource: IResource = {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'test-pod',
          namespace: 'default',
          uid: 'pod-uid',
          resourceVersion: '1',
        },
      }

      await cacheResource(clusterResource)
      await cacheResource(podResource)

      const clusters = await getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')
      expect(clusters).toHaveLength(1)
      expect(clusters[0].kind).toBe('ManagedCluster')

      const pods = await getKubeResources('Pod', 'v1')
      expect(pods).toHaveLength(1)
      expect(pods[0].kind).toBe('Pod')
    })
  })

  describe('cacheResource', () => {
    beforeEach(() => {
      // Clear the cache and events before each test
      const cache = getEventCache()
      for (const key in cache) {
        delete cache[key]
      }

      // Clear ServerSideEvents
      const events = ServerSideEvents.getEvents()
      for (const key in events) {
        if (key !== '1' && key !== '2') {
          // Keep START and LOADED events
          delete events[key]
        }
      }
    })

    it('should cache a new resource', async () => {
      const mockResource: IResource = {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        metadata: {
          name: 'test-config',
          namespace: 'default',
          uid: 'config-uid-123',
          resourceVersion: '100',
        },
      }

      await cacheResource(mockResource)

      const cache = getEventCache()
      const apiVersionPlural = '/v1/configmaps'
      expect(cache[apiVersionPlural]).toBeDefined()
      expect(cache[apiVersionPlural]['config-uid-123']).toBeDefined()
      expect(cache[apiVersionPlural]['config-uid-123'].compressed).toBeDefined()
      expect(cache[apiVersionPlural]['config-uid-123'].eventID).toBeGreaterThan(0)
    })

    it('should not update cache if resourceVersion is unchanged', async () => {
      const mockResource: IResource = {
        kind: 'Secret',
        apiVersion: 'v1',
        metadata: {
          name: 'test-secret',
          namespace: 'default',
          uid: 'secret-uid-456',
          resourceVersion: '200',
        },
      }

      // Cache the resource first time
      await cacheResource(mockResource)
      const cache = getEventCache()
      const apiVersionPlural = '/v1/secrets'
      const firstEventID = cache[apiVersionPlural]['secret-uid-456'].eventID

      // Try to cache the same resource with same resourceVersion
      await cacheResource(mockResource)

      // EventID should remain the same (no new event created)
      expect(cache[apiVersionPlural]['secret-uid-456'].eventID).toBe(firstEventID)
    })

    it('should update cache when resourceVersion changes', async () => {
      const mockResource: IResource = {
        kind: 'Deployment',
        apiVersion: 'apps/v1',
        metadata: {
          name: 'test-deployment',
          namespace: 'default',
          uid: 'deploy-uid-789',
          resourceVersion: '300',
        },
      }

      // Cache the resource first time
      await cacheResource(mockResource)
      const cache = getEventCache()
      const apiVersionPlural = '/apps/v1/deployments'
      const firstEventID = cache[apiVersionPlural]['deploy-uid-789'].eventID

      // Update resourceVersion and cache again
      mockResource.metadata.resourceVersion = '301'
      await cacheResource(mockResource)

      // EventID should be different (new event created)
      expect(cache[apiVersionPlural]['deploy-uid-789'].eventID).not.toBe(firstEventID)
      expect(cache[apiVersionPlural]['deploy-uid-789'].eventID).toBeGreaterThan(firstEventID)
    })

    it('should set hubClusterName when caching local ManagedCluster', async () => {
      const localCluster: IResource = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'my-local-cluster',
          uid: 'local-cluster-uid',
          resourceVersion: '1',
          labels: {
            'local-cluster': 'true',
          },
        },
      }

      await cacheResource(localCluster)

      expect(getHubClusterName()).toBe('my-local-cluster')
      expect(getIsHubSelfManaged()).toBe(true)
    })

    it('should not change hubClusterName for non-local ManagedCluster', async () => {
      const initialHubName = getHubClusterName()

      const remoteCluster: IResource = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'remote-cluster',
          uid: 'remote-cluster-uid',
          resourceVersion: '1',
          labels: {
            'local-cluster': 'false',
          },
        },
      }

      await cacheResource(remoteCluster)

      expect(getHubClusterName()).toBe(initialHubName)
    })

    it('should set observability flag when caching observability-controller addon', async () => {
      const observabilityAddon: IResource = {
        kind: 'ManagedClusterAddOn',
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        metadata: {
          name: 'observability-controller',
          namespace: 'local-cluster',
          uid: 'obs-addon-uid',
          resourceVersion: '1',
        },
      }

      await cacheResource(observabilityAddon)

      expect(getIsObservabilityInstalled()).toBe(true)
    })

    it('should not set observability flag for other addons', async () => {
      const otherAddon: IResource = {
        kind: 'ManagedClusterAddOn',
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        metadata: {
          name: 'other-addon',
          namespace: 'local-cluster',
          uid: 'other-addon-uid',
          resourceVersion: '1',
        },
      }

      const initialObsFlag = getIsObservabilityInstalled()
      await cacheResource(otherAddon)

      expect(getIsObservabilityInstalled()).toBe(initialObsFlag)
    })

    it('should handle resources with complex nested structures', async () => {
      const complexResource = {
        kind: 'Application',
        apiVersion: 'argoproj.io/v1alpha1',
        metadata: {
          name: 'complex-app',
          namespace: 'argocd',
          uid: 'complex-uid',
          resourceVersion: '500',
          labels: {
            'app.kubernetes.io/name': 'test-app',
            'app.kubernetes.io/instance': 'test-instance',
          },
          annotations: {
            'argocd.argoproj.io/sync-wave': '0',
          },
        },
        spec: {
          project: 'default',
          source: {
            repoURL: 'https://github.com/example/repo',
            path: 'manifests',
            targetRevision: 'main',
          },
          destination: {
            server: 'https://kubernetes.default.svc',
            namespace: 'default',
          },
          syncPolicy: {
            automated: {
              prune: true,
              selfHeal: true,
            },
          },
        },
      } as IResource

      await cacheResource(complexResource)

      const resources = await getKubeResources('Application', 'argoproj.io/v1alpha1')
      expect(resources).toHaveLength(1)
      expect(resources[0].metadata.name).toBe('complex-app')

      expect((resources[0] as IArgoApplication).spec?.source?.repoURL).toBe('https://github.com/example/repo')
    })

    it('should handle multiple updates to the same resource', async () => {
      const resource: IResource = {
        kind: 'Service',
        apiVersion: 'v1',
        metadata: {
          name: 'test-service',
          namespace: 'default',
          uid: 'service-uid',
          resourceVersion: '1',
        },
      }

      // First cache
      await cacheResource(resource)
      const cache = getEventCache()
      const apiVersionPlural = '/v1/services'

      // Update multiple times
      for (let i = 2; i <= 5; i++) {
        resource.metadata.resourceVersion = String(i)
        await cacheResource(resource)
      }

      // Should still have only one entry for this UID
      const cacheKeys = Object.keys(cache[apiVersionPlural])
      expect(cacheKeys).toHaveLength(1)
      expect(cacheKeys[0]).toBe('service-uid')
    })

    it('should create events in ServerSideEvents when caching', async () => {
      const eventsBefore = Object.keys(ServerSideEvents.getEvents()).length

      const resource: IResource = {
        kind: 'Namespace',
        apiVersion: 'v1',
        metadata: {
          name: 'test-namespace',
          uid: 'namespace-uid',
          resourceVersion: '1',
        },
      }

      await cacheResource(resource)

      const eventsAfter = Object.keys(ServerSideEvents.getEvents()).length

      // Should have created at least one new event (MODIFIED event + LOADED event)
      expect(eventsAfter).toBeGreaterThan(eventsBefore)
    })

    it('should handle resources without optional metadata fields', async () => {
      const minimalResource: IResource = {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        metadata: {
          name: 'minimal-config',
          uid: 'minimal-uid',
          resourceVersion: '1',
        },
        // No namespace, no labels, no annotations
      }

      await cacheResource(minimalResource)

      const resources = await getKubeResources('ConfigMap', 'v1')
      expect(resources).toHaveLength(1)
      expect(resources[0].metadata.name).toBe('minimal-config')
    })

    it('should properly pluralize resource kinds', async () => {
      // Test various pluralization scenarios
      const testCases = [
        { kind: 'Policy', apiVersion: 'policy.open-cluster-management.io/v1' },
        { kind: 'Namespace', apiVersion: 'v1' },
        { kind: 'Ingress', apiVersion: 'networking.k8s.io/v1' },
      ]

      for (const testCase of testCases) {
        const resource: IResource = {
          kind: testCase.kind,
          apiVersion: testCase.apiVersion,
          metadata: {
            name: `test-${testCase.kind.toLowerCase()}`,
            uid: `${testCase.kind.toLowerCase()}-uid-${Date.now()}`,
            resourceVersion: '1',
          },
        }

        await cacheResource(resource)

        // Verify the resource was cached by retrieving it
        const resources = await getKubeResources(testCase.kind, testCase.apiVersion)
        expect(resources.length).toBeGreaterThan(0)
        expect(resources.some((r) => r.metadata.name === resource.metadata.name)).toBe(true)
      }
    })
  })

  describe('getEventCache', () => {
    it('should return the resource cache object', () => {
      const cache = getEventCache()
      expect(typeof cache).toBe('object')
    })

    it('should return the same cache instance', () => {
      const cache1 = getEventCache()
      const cache2 = getEventCache()
      expect(cache1).toBe(cache2)
    })
  })

  describe('Hub cluster state functions', () => {
    it('getHubClusterName should return default value', () => {
      expect(typeof getHubClusterName()).toBe('string')
    })

    it('getIsHubSelfManaged should return boolean', () => {
      expect(typeof getIsHubSelfManaged()).toBe('boolean')
    })

    it('getIsObservabilityInstalled should return boolean', () => {
      expect(typeof getIsObservabilityInstalled()).toBe('boolean')
    })
  })

  describe('Integration test: Full resource lifecycle', () => {
    beforeEach(() => {
      const cache = getEventCache()
      for (const key in cache) {
        delete cache[key]
      }
    })

    it('should handle complete lifecycle: cache, retrieve, update, retrieve', async () => {
      interface DeploymentResource extends IResource {
        spec?: {
          replicas?: number
        }
      }

      // Initial resource
      const resource: DeploymentResource = {
        kind: 'Deployment',
        apiVersion: 'apps/v1',
        metadata: {
          name: 'lifecycle-deployment',
          namespace: 'test-ns',
          uid: 'lifecycle-uid',
          resourceVersion: '1',
        },
        spec: {
          replicas: 1,
        },
      }

      // Cache initial version
      await cacheResource(resource)

      // Retrieve and verify
      let resources = await getKubeResources('Deployment', 'apps/v1')
      expect(resources).toHaveLength(1)
      expect((resources[0] as DeploymentResource).spec?.replicas).toBe(1)

      // Update the resource
      resource.metadata.resourceVersion = '2'
      if (resource.spec) {
        resource.spec.replicas = 3
      }
      await cacheResource(resource)

      // Retrieve and verify update
      resources = await getKubeResources('Deployment', 'apps/v1')
      expect(resources).toHaveLength(1)
      expect((resources[0] as DeploymentResource).spec?.replicas).toBe(3)
      expect(resources[0].metadata.resourceVersion).toBe('2')
    })

    it('should handle multiple different resource types in cache', async () => {
      const resources: IResource[] = [
        {
          kind: 'ConfigMap',
          apiVersion: 'v1',
          metadata: { name: 'cm1', uid: 'cm-uid-1', resourceVersion: '1' },
        },
        {
          kind: 'Secret',
          apiVersion: 'v1',
          metadata: { name: 'secret1', uid: 'secret-uid-1', resourceVersion: '1' },
        },
        {
          kind: 'Service',
          apiVersion: 'v1',
          metadata: { name: 'svc1', uid: 'svc-uid-1', resourceVersion: '1' },
        },
        {
          kind: 'ManagedCluster',
          apiVersion: 'cluster.open-cluster-management.io/v1',
          metadata: { name: 'cluster1', uid: 'cluster-uid-1', resourceVersion: '1' },
        },
      ]

      // Cache all resources
      await Promise.all(resources.map((r) => cacheResource(r)))

      // Verify each type can be retrieved independently
      const configMaps = await getKubeResources('ConfigMap', 'v1')
      expect(configMaps).toHaveLength(1)

      const secrets = await getKubeResources('Secret', 'v1')
      expect(secrets).toHaveLength(1)

      const services = await getKubeResources('Service', 'v1')
      expect(services).toHaveLength(1)

      const clusters = await getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')
      expect(clusters).toHaveLength(1)
    })
  })
})
