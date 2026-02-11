/* Copyright Contributors to the Open Cluster Management project */
import { jest } from '@jest/globals'

// Mock the serviceAccountToken module BEFORE any imports that use it
const mockGetServiceAccountToken = jest.fn(() => 'mock-token')
const mockGetCACertificate = jest.fn(() => undefined)

jest.unstable_mockModule('../../src/lib/serviceAccountToken', () => ({
  getServiceAccountToken: mockGetServiceAccountToken,
  getCACertificate: mockGetCACertificate,
  getNamespace: jest.fn(),
  getServiceCACertificate: jest.fn(),
}))

import { Writable } from 'node:stream'
import nock from 'nock'
import { request } from '../mock-request'
import {
  getKubeResources,
  cacheResource,
  getEventCache,
  getHubClusterName,
  getIsHubSelfManaged,
  createSplitStream,
  errorToString,
  createWatchEventProcessor,
  listAndWatch,
  stopWatching,
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
      expect(await cache[apiVersionPlural]['config-uid-123'].compressed).toBeDefined()
      expect(await cache[apiVersionPlural]['config-uid-123'].eventID).toBeGreaterThan(0)
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
      const firstEventID = await cache[apiVersionPlural]['deploy-uid-789'].eventID

      // Update resourceVersion and cache again
      mockResource.metadata.resourceVersion = '301'
      await cacheResource(mockResource)

      // EventID should be different (new event created)
      expect(await cache[apiVersionPlural]['deploy-uid-789'].eventID).not.toBe(firstEventID)
      expect(await cache[apiVersionPlural]['deploy-uid-789'].eventID).toBeGreaterThan(firstEventID)
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
    it('should avoid race condition when caching same resource concurrently', async () => {
      // This test guards against a race condition where concurrent calls to cacheResource
      // for the same UID could create duplicate/orphaned events in ServerSideEvents.
      //
      // The race condition occurred when:
      // 1. First call checks cache (finds nothing)
      // 2. First call starts async compression (await deflateResource yields control)
      // 3. Second call checks cache (still finds nothing because first hasn't written yet)
      // 4. Second call starts async compression (await deflateResource yields control)
      // 5. Both calls create separate events, first event becomes orphaned
      //
      // The fix stores promises immediately in the cache so concurrent calls see pending entries.
      // This allows the second call to see the pending entry and properly coordinate.

      const resource1: IResource = {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        metadata: {
          name: 'race-test-config',
          namespace: 'default',
          uid: 'race-test-uid-concurrent',
          resourceVersion: '1',
        },
      }

      const resource2: IResource = {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        metadata: {
          name: 'race-test-config',
          namespace: 'default',
          uid: 'race-test-uid-concurrent', // Same UID as resource1
          resourceVersion: '2', // Different resourceVersion
        },
      }

      // Reset ServerSideEvents to a clean state to ensure test isolation
      ServerSideEvents.reset()

      // Flush the microtask queue multiple times to ensure any pending promises
      // from previous tests (like getKubeResources) have resolved
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }

      // Reset AGAIN after flushing to clear any events created by resolved promises
      ServerSideEvents.reset()

      // Snapshot event IDs BEFORE our concurrent calls (should only be START=1 and LOADED=2)
      const eventIdsBefore = new Set(Object.keys(ServerSideEvents.getEvents()).map(Number))

      // Start both cache operations concurrently WITHOUT awaiting first
      // This simulates the race condition scenario
      const promise1 = cacheResource(resource1)
      const promise2 = cacheResource(resource2)
      await Promise.all([promise1, promise2])

      // With the fix, cacheResource stores promises and returns without awaiting pushEvent.
      // We must await the eventID promise to ensure pushEvent has been called.
      const cache = getEventCache()
      const cachedEventID = await Promise.resolve(cache['/v1/configmaps']['race-test-uid-concurrent'].eventID)

      // Snapshot event IDs AFTER our concurrent calls
      const events = ServerSideEvents.getEvents()
      const eventIdsAfter = new Set(Object.keys(events).map(Number))

      // Find NEW MODIFIED events created during this test
      const newModifiedEventIds = [...eventIdsAfter]
        .filter((id) => !eventIdsBefore.has(id))
        .filter((id) => {
          const event = events[id]
          return event && (event.data as { type: string }).type === 'MODIFIED'
        })

      // THE KEY ASSERTION:
      // With the fix: Only 1 MODIFIED event should survive (the second call properly removes the first)
      // Without the fix: 2 MODIFIED events survive (one is orphaned - created but never removed)
      expect(newModifiedEventIds.length).toBe(1)

      // The surviving event should be the one in the cache
      expect(newModifiedEventIds[0]).toBe(cachedEventID)
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
      const cache = getEventCache()
      const apiVersionPlural = '/v1/namespaces'
      await cache[apiVersionPlural]['namespace-uid'].eventID

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

  describe('createSplitStream', () => {
    it('should split data by newline characters', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from('line1\nline2\nline3\n'))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual(['line1', 'line2', 'line3'])
    })

    it('should buffer incomplete lines across chunks', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from('partial'))
      splitStream.write(Buffer.from('_line\ncomplete\n'))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual(['partial_line', 'complete'])
    })

    it('should flush remaining buffered data on end', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from('line1\nno_newline_at_end'))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual(['line1', 'no_newline_at_end'])
    })

    it('should skip empty lines', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from('line1\n\n\nline2\n'))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual(['line1', 'line2'])
    })

    it('should skip lines with only whitespace', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from('line1\n   \n\t\nline2\n'))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual(['line1', 'line2'])
    })

    it('should handle empty input', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from(''))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual([])
    })

    it('should handle single line without newline', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from('single_line'))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual(['single_line'])
    })

    it('should handle multiple chunks forming one line', async () => {
      const collected: string[] = []
      const splitStream = createSplitStream()
      const collectStream = new Writable({
        objectMode: true,
        write(chunk: string, _encoding, callback) {
          collected.push(chunk)
          callback()
        },
      })

      splitStream.pipe(collectStream)
      splitStream.write(Buffer.from('part1'))
      splitStream.write(Buffer.from('part2'))
      splitStream.write(Buffer.from('part3\n'))
      splitStream.end()

      await new Promise((resolve) => collectStream.on('finish', resolve))

      expect(collected).toEqual(['part1part2part3'])
    })
  })

  describe('errorToString', () => {
    it('should convert Error instance to message string', () => {
      const error = new Error('test error message')
      expect(errorToString(error)).toBe('test error message')
    })

    it('should handle Error with empty message', () => {
      const error = new Error('')
      expect(errorToString(error)).toBe('')
    })

    it('should return string directly if input is string', () => {
      expect(errorToString('simple string error')).toBe('simple string error')
    })

    it('should JSON stringify objects', () => {
      const errorObj = { code: 500, message: 'Internal error' }
      expect(errorToString(errorObj)).toBe('{"code":500,"message":"Internal error"}')
    })
  })

  describe('createWatchEventProcessor', () => {
    beforeEach(() => {
      // Clear the cache before each test
      const cache = getEventCache()
      for (const key in cache) {
        delete cache[key]
      }
    })

    it('should process ADDED event and cache the resource', async () => {
      const options = { kind: 'ConfigMap', apiVersion: 'v1' }
      const resourceVersionRef = { value: '0' }
      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      const watchEvent = {
        type: 'ADDED',
        object: {
          kind: 'ConfigMap',
          apiVersion: 'v1',
          metadata: {
            name: 'test-config',
            namespace: 'default',
            uid: 'added-uid-123',
            resourceVersion: '100',
          },
        },
      }

      processor.write(JSON.stringify(watchEvent))
      processor.end()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(resourceVersionRef.value).toBe('100')
      const cache = getEventCache()
      expect(cache['/v1/configmaps']?.['added-uid-123']).toBeDefined()
    })

    it('should process MODIFIED event and update the cache', async () => {
      const options = { kind: 'Secret', apiVersion: 'v1' }
      const resourceVersionRef = { value: '0' }

      // First cache a resource
      await cacheResource({
        kind: 'Secret',
        apiVersion: 'v1',
        metadata: {
          name: 'test-secret',
          namespace: 'default',
          uid: 'modified-uid-456',
          resourceVersion: '50',
        },
      })

      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      const watchEvent = {
        type: 'MODIFIED',
        object: {
          kind: 'Secret',
          apiVersion: 'v1',
          metadata: {
            name: 'test-secret',
            namespace: 'default',
            uid: 'modified-uid-456',
            resourceVersion: '200',
          },
        },
      }

      processor.write(JSON.stringify(watchEvent))
      processor.end()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(resourceVersionRef.value).toBe('200')
    })

    it('should process DELETED event and remove from cache', async () => {
      const options = { kind: 'Pod', apiVersion: 'v1' }
      const resourceVersionRef = { value: '0' }

      // First cache a resource
      await cacheResource({
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          name: 'test-pod',
          namespace: 'default',
          uid: 'deleted-uid-789',
          resourceVersion: '100',
        },
      })

      const cache = getEventCache()
      expect(cache['/v1/pods']?.['deleted-uid-789']).toBeDefined()

      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      const watchEvent = {
        type: 'DELETED',
        object: {
          kind: 'Pod',
          apiVersion: 'v1',
          metadata: {
            name: 'test-pod',
            namespace: 'default',
            uid: 'deleted-uid-789',
            resourceVersion: '300',
          },
        },
      }

      processor.write(JSON.stringify(watchEvent))
      processor.end()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(resourceVersionRef.value).toBe('300')
      expect(cache['/v1/pods']?.['deleted-uid-789']).toBeUndefined()
    })

    it('should process BOOKMARK event and update resourceVersion', async () => {
      const options = { kind: 'Namespace', apiVersion: 'v1' }
      const resourceVersionRef = { value: '0' }
      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      const watchEvent = {
        type: 'BOOKMARK',
        object: {
          kind: 'Namespace',
          apiVersion: 'v1',
          metadata: {
            resourceVersion: '500',
          },
        },
      }

      processor.write(JSON.stringify(watchEvent))
      processor.end()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(resourceVersionRef.value).toBe('500')
    })

    it('should handle ERROR event with too old resource version', async () => {
      const options = { kind: 'Service', apiVersion: 'v1' }
      const resourceVersionRef = { value: '100' }
      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      const watchEvent = {
        type: 'ERROR',
        object: {
          kind: 'Status',
          apiVersion: 'v1',
          metadata: {},
          message: 'too old resource version: 100 (12345)',
          reason: 'Expired',
        },
      }

      let caughtError: Error | null = null
      processor.on('error', (err) => {
        caughtError = err
      })

      processor.write(JSON.stringify(watchEvent))
      processor.end()

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should throw an error so that listAndWatch will retry
      expect(caughtError).not.toBeNull()
      expect(caughtError?.message).toBe('too old resource version: 100 (12345)')
      expect(resourceVersionRef.value).toBe('100') // Should remain unchanged for ERROR
    })

    it('should handle ERROR event with other error messages', async () => {
      const options = { kind: 'Deployment', apiVersion: 'apps/v1' }
      const resourceVersionRef = { value: '100' }
      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      const watchEvent = {
        type: 'ERROR',
        object: {
          kind: 'Status',
          apiVersion: 'v1',
          metadata: {},
          message: 'some other error',
          reason: 'InternalError',
        },
      }

      let caughtError: Error | null = null
      processor.on('error', (err) => {
        caughtError = err
      })

      processor.write(JSON.stringify(watchEvent))
      processor.end()

      await new Promise((resolve) => setTimeout(resolve, 50))

      // Should throw an error so that listAndWatch will retry
      expect(caughtError).not.toBeNull()
      expect(caughtError?.message).toBe('some other error')
      expect(resourceVersionRef.value).toBe('100')
    })

    it('should handle invalid JSON and throw error', async () => {
      const options = { kind: 'ConfigMap', apiVersion: 'v1' }
      const resourceVersionRef = { value: '0' }
      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      let caughtError: Error | null = null
      processor.on('error', (err) => {
        caughtError = err
      })

      processor.write('not valid json')
      processor.end()

      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(caughtError).not.toBeNull()
      expect(caughtError).toBeInstanceOf(SyntaxError)
    })

    it('should work with pipeline and splitStream', async () => {
      const options = { kind: 'ConfigMap', apiVersion: 'v1' }
      const resourceVersionRef = { value: '0' }

      const splitStream = createSplitStream()
      const processor = createWatchEventProcessor(options, 'http://test/url', resourceVersionRef)

      const event1 = JSON.stringify({
        type: 'ADDED',
        object: {
          kind: 'ConfigMap',
          apiVersion: 'v1',
          metadata: { name: 'cm1', namespace: 'ns1', uid: 'uid-1', resourceVersion: '1' },
        },
      })

      const event2 = JSON.stringify({
        type: 'ADDED',
        object: {
          kind: 'ConfigMap',
          apiVersion: 'v1',
          metadata: { name: 'cm2', namespace: 'ns2', uid: 'uid-2', resourceVersion: '2' },
        },
      })

      splitStream.pipe(processor)

      splitStream.write(Buffer.from(event1 + '\n' + event2 + '\n'))
      splitStream.end()

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(resourceVersionRef.value).toBe('2')
      const cache = getEventCache()
      expect(cache['/v1/configmaps']?.['uid-1']).toBeDefined()
      expect(cache['/v1/configmaps']?.['uid-2']).toBeDefined()
    })
  })

  describe('listAndWatch', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      process.env.CLUSTER_API_URL = 'https://api.test-cluster.com:6443'
      mockGetServiceAccountToken.mockReturnValue('mock-token')
      mockGetCACertificate.mockReturnValue(undefined)
    })

    afterEach(() => {
      stopWatching()
      nock.abortPendingRequests()
      nock.cleanAll()
      delete process.env.CLUSTER_API_URL
    })

    it('should retry immediately when receiving "too old resource version" error', async () => {
      // This test verifies that line 289 in events.ts handles "too old resource version"
      // errors by retrying immediately without the 60-second delay.

      const options = { kind: 'ConfigMap', apiVersion: 'v1' }
      let listCallCount = 0
      let secondListTime = 0

      // First list call - succeeds
      nock('https://api.test-cluster.com:6443')
        .get('/api/v1/configmaps')
        .query(true)
        .reply(200, {
          kind: 'ConfigMapList',
          apiVersion: 'v1',
          metadata: { resourceVersion: '1000' },
          items: [],
        })

      // Watch call - returns ERROR event with "too old resource version"
      const errorEvent = JSON.stringify({
        type: 'ERROR',
        object: {
          kind: 'Status',
          apiVersion: 'v1',
          metadata: {},
          message: 'too old resource version: 1000 (5000)',
          reason: 'Expired',
        },
      })

      nock('https://api.test-cluster.com:6443')
        .get('/api/v1/configmaps')
        .query((query) => query.watch !== undefined)
        .reply(200, errorEvent + '\n')

      // Second list call - after immediate retry due to "too old resource version" error
      nock('https://api.test-cluster.com:6443')
        .get('/api/v1/configmaps')
        .query((query) => query.watch === undefined && query.limit !== undefined)
        .reply(200, () => {
          listCallCount++
          secondListTime = Date.now()
          return {
            kind: 'ConfigMapList',
            apiVersion: 'v1',
            metadata: { resourceVersion: '5000' },
            items: [],
          }
        })

      // Second watch - will hang until stopWatching is called
      nock('https://api.test-cluster.com:6443')
        .get('/api/v1/configmaps')
        .query((query) => query.watch !== undefined)
        .delay(60000) // Long delay - will be interrupted by stopWatching
        .reply(200, '')

      const startTime = Date.now()

      // Start listAndWatch and schedule stopWatching after a brief delay
      const listAndWatchPromise = listAndWatch(options)

      // Wait for the second list to happen, then stop
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (listCallCount >= 1) {
            clearInterval(checkInterval)
            // Give a small buffer then stop
            setTimeout(() => {
              stopWatching()
              resolve()
            }, 100)
          }
        }, 50)
      })

      await listAndWatchPromise

      // The second list should have happened quickly (< 5 seconds) because "too old resource version"
      // triggers an immediate retry without the 60-second delay (line 289)
      const retryTime = secondListTime - startTime
      expect(retryTime).toBeLessThan(5000)
      expect(listCallCount).toBe(1) // Only counting second list call
    })
  })
})
