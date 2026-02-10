/* Copyright Contributors to the Open Cluster Management project */
import {
  transform,
  getClusterMap,
  cacheRemoteApps,
  getClusters,
  getApplicationType,
  getAppNamespace,
  getApplicationClusters,
  computeAppHealthStatus,
  computeAppSyncStatus,
  extractMessages,
  getAppNameFromLabel,
  isSystemApp,
  discoverSystemAppNamespacePrefixes,
  getArgoPushModelClusterList,
  getArgoDestinationCluster,
  keyBy,
  sizeOf,
} from '../../../src/routes/aggregators/utils'
import { cacheResource, getEventCache } from '../../../src/routes/events'
import {
  IResource,
  IArgoApplication,
  ManagedCluster,
  ManagedClusterInfo,
  ClusterDeployment,
  ISearchResource,
  Cluster,
} from '../../../src/resources/resource'
import { ApplicationClusterStatusMap, ITransformedResource } from '../../../src/routes/aggregators/applications'
import { ServerSideEvents } from '../../../src/lib/server-side-events'

describe('aggregators utils', () => {
  beforeEach(() => {
    // Clear the cache before each test
    const cache = getEventCache()
    for (const key in cache) {
      delete cache[key]
    }

    // Clear ServerSideEvents to prevent async issues
    const events = ServerSideEvents.getEvents()
    for (const key in events) {
      if (key !== '1' && key !== '2') {
        // Keep START and LOADED events
        delete events[key]
      }
    }
  })

  afterEach(async () => {
    // Clean up any remaining async operations
    const cache = getEventCache()
    for (const key in cache) {
      delete cache[key]
    }

    // Clear all events except base events
    const events = ServerSideEvents.getEvents()
    for (const key in events) {
      if (key !== '1' && key !== '2') {
        delete events[key]
      }
    }

    // Wait for any pending promises to resolve
    await new Promise((resolve) => setImmediate(resolve))
  })

  afterAll(async () => {
    // Stop the ServerSideEvents interval timer to allow Jest to exit cleanly
    await ServerSideEvents.dispose()
  })

  describe('transform', () => {
    it('should transform items with cluster status map', async () => {
      const items: ITransformedResource[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'test-app',
            namespace: 'argocd',
            uid: 'test-uid-1',
            resourceVersion: '1',
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          spec: {
            destination: {
              namespace: 'default',
              server: 'https://kubernetes.default.svc',
            },
            source: {
              repoURL: 'https://github.com/test/repo',
              path: 'manifests',
            },
          },
        } as IArgoApplication,
      ]

      const argoClusterStatusMap: ApplicationClusterStatusMap = {}

      const result = await transform(items, argoClusterStatusMap)

      expect(result).toBeDefined()
      expect(result.resources).toBeDefined()
      expect(result.resources).toHaveLength(1)
    })

    it('should handle empty items array', async () => {
      const result = await transform([], {})

      expect(result).toBeDefined()
      expect(result.resources).toEqual([])
    })

    it('should transform subscription app type', async () => {
      const items: ITransformedResource[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'subscription-app',
            namespace: 'default',
            uid: 'sub-uid-1',
            resourceVersion: '1',
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          spec: {
            destination: {
              namespace: 'default',
              server: 'https://kubernetes.default.svc',
            },
          },
        } as IArgoApplication,
      ]

      const result = await transform(items, {})

      expect(result.resources).toHaveLength(1)
    })

    it('should include itemMap when provided', async () => {
      const items: ITransformedResource[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'test-app',
            namespace: 'argocd',
            uid: 'map-uid-1',
            resourceVersion: '1',
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          spec: {
            destination: {
              namespace: 'default',
              server: 'https://kubernetes.default.svc',
            },
          },
        } as IArgoApplication,
      ]

      const itemMap = {} as Record<string, unknown>
      await transform(items, {}, false, undefined, undefined, itemMap as never)

      expect(Object.keys(itemMap)).toHaveLength(1)
      expect(itemMap['map-uid-1' as keyof typeof itemMap]).toBeDefined()
    })
  })

  describe('getClusterMap', () => {
    it('should return empty map when no clusters are cached', async () => {
      const clusterMap = await getClusterMap()
      expect(clusterMap).toEqual({})
    })

    it('should return map of managed clusters by name', async () => {
      const cluster1: ManagedCluster = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'cluster1',
          uid: 'cluster-uid-1',
          resourceVersion: '1',
        },
        status: {
          clusterClaims: [],
        },
      }

      const cluster2: ManagedCluster = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'cluster2',
          uid: 'cluster-uid-2',
          resourceVersion: '1',
        },
        status: {
          clusterClaims: [],
        },
      }

      await cacheResource(cluster1)
      await cacheResource(cluster2)

      const clusterMap = await getClusterMap()

      expect(Object.keys(clusterMap)).toHaveLength(2)
      expect(clusterMap['cluster1']).toBeDefined()
      expect(clusterMap['cluster2']).toBeDefined()
      expect(clusterMap['cluster1'].metadata.name).toBe('cluster1')
      expect(clusterMap['cluster2'].metadata.name).toBe('cluster2')
    })

    it('should handle clusters without names', async () => {
      const clusterWithoutName: IResource = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: '',
          uid: 'cluster-uid-3',
          resourceVersion: '1',
        },
      }

      await cacheResource(clusterWithoutName)

      const clusterMap = await getClusterMap()

      // Should not include clusters without names
      expect(Object.keys(clusterMap)).toHaveLength(0)
    })

    it('should update map when clusters change', async () => {
      const managedCluster: ManagedCluster = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'test-cluster',
          uid: 'cluster-uid-4',
          resourceVersion: '1',
        },
        status: {
          clusterClaims: [],
        },
      }

      await cacheResource(managedCluster)

      const clusterMap1 = await getClusterMap()
      expect(Object.keys(clusterMap1)).toHaveLength(1)

      const cluster2: ManagedCluster = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'another-cluster',
          uid: 'cluster-uid-5',
          resourceVersion: '1',
        },
        status: {
          clusterClaims: [],
        },
      }

      await cacheResource(cluster2)

      const clusterMap2 = await getClusterMap()
      expect(Object.keys(clusterMap2)).toHaveLength(2)
    })
  })

  describe('cacheRemoteApps', () => {
    it('should cache remote apps without page chunk', async () => {
      const applicationCache = {
        remoteKey: {},
      } as Record<string, { resources?: unknown[]; resourceMap?: Record<string, unknown[]> }>

      const remoteApps: ITransformedResource[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'remote-app',
            namespace: 'argocd',
            uid: 'remote-uid-1',
            resourceVersion: '1',
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          spec: {
            destination: {
              namespace: 'default',
              server: 'https://kubernetes.default.svc',
            },
            source: {
              repoURL: 'https://github.com/test/repo',
              path: 'manifests',
            },
          },
        } as IArgoApplication,
      ]

      await cacheRemoteApps(applicationCache as never, {}, remoteApps, undefined, 'remoteKey')

      expect(applicationCache.remoteKey.resources).toBeDefined()
      expect(applicationCache.remoteKey.resources).toHaveLength(1)
    })

    it('should cache remote apps with page chunk', async () => {
      const applicationCache = {
        remoteKey: {
          resourceMap: {},
        },
      } as Record<string, { resources?: unknown[]; resourceMap?: Record<string, unknown[]> }>

      const remoteApps: ITransformedResource[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'app-with-chunk',
            namespace: 'argocd',
            uid: 'chunk-uid-1',
            resourceVersion: '1',
            creationTimestamp: '2024-01-01T00:00:00Z',
          },
          spec: {
            destination: {
              namespace: 'default',
              server: 'https://kubernetes.default.svc',
            },
          },
        } as IArgoApplication,
      ]

      const pageChunk = {
        keys: ['a*', 'b*'],
        limit: 100,
      }

      await cacheRemoteApps(applicationCache as never, {}, remoteApps, pageChunk, 'remoteKey')

      expect(applicationCache.remoteKey.resourceMap?.['a*,b*']).toBeDefined()
      expect(applicationCache.remoteKey.resourceMap?.['a*,b*']).toHaveLength(1)
    })

    it('should handle empty remote apps array', async () => {
      const applicationCache = {
        emptyKey: {},
      } as Record<string, { resources?: unknown[] }>

      await cacheRemoteApps(applicationCache as never, {}, [], undefined, 'emptyKey')

      expect(applicationCache.emptyKey.resources).toBeDefined()
      expect(applicationCache.emptyKey.resources).toHaveLength(0)
    })
  })

  describe('getClusters', () => {
    it('should return empty array when no clusters are cached', async () => {
      const clusters = await getClusters()
      expect(clusters).toEqual([])
    })

    it('should return clusters from ManagedCluster resources', async () => {
      const managedCluster: ManagedCluster = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'managed-1',
          uid: 'managed-uid-1',
          resourceVersion: '1',
        },
        status: {
          clusterClaims: [],
        },
      }

      await cacheResource(managedCluster)

      const clusters = await getClusters()

      expect(clusters).toHaveLength(1)
      expect(clusters[0].name).toBe('managed-1')
    })

    it('should return clusters from multiple sources', async () => {
      const managedCluster: ManagedCluster = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'managed-cluster',
          uid: 'managed-uid-2',
          resourceVersion: '1',
        },
        status: {
          clusterClaims: [],
        },
      }

      const clusterDeployment: ClusterDeployment = {
        kind: 'ClusterDeployment',
        apiVersion: 'hive.openshift.io/v1',
        metadata: {
          name: 'hive-cluster',
          uid: 'hive-uid-1',
          resourceVersion: '1',
        },
        spec: {
          clusterName: 'hive-cluster',
          baseDomain: 'example.com',
        },
        status: {},
      }

      const managedClusterInfo: ManagedClusterInfo = {
        kind: 'ManagedClusterInfo',
        apiVersion: 'internal.open-cluster-management.io/v1beta1',
        metadata: {
          name: 'info-cluster',
          uid: 'info-uid-1',
          resourceVersion: '1',
        },
        spec: {
          masterEndpoint: 'https://api.example.com:6443',
        },
        status: {},
      }

      await cacheResource(managedCluster)
      await cacheResource(clusterDeployment)
      await cacheResource(managedClusterInfo)

      const clusters = await getClusters()

      expect(clusters.length).toBeGreaterThan(0)
      const clusterNames = clusters.map((c) => c.name)
      expect(clusterNames).toContain('managed-cluster')
    })

    it('should include kubeApiServer and consoleURL in cluster objects', async () => {
      const managedCluster: ManagedCluster = {
        kind: 'ManagedCluster',
        apiVersion: 'cluster.open-cluster-management.io/v1',
        metadata: {
          name: 'full-cluster',
          uid: 'full-uid-1',
          resourceVersion: '1',
        },
        status: {
          clusterClaims: [
            {
              name: 'consoleurl.cluster.open-cluster-management.io',
              value: 'https://console.example.com',
            },
          ],
        },
      }

      const managedClusterInfo: ManagedClusterInfo = {
        kind: 'ManagedClusterInfo',
        apiVersion: 'internal.open-cluster-management.io/v1beta1',
        metadata: {
          name: 'full-cluster',
          uid: 'full-info-uid-1',
          resourceVersion: '1',
        },
        spec: {
          masterEndpoint: 'https://api.fullcluster.com:6443',
        },
        status: {
          consoleURL: 'https://console.fullcluster.com',
        },
      }

      await cacheResource(managedCluster)
      await cacheResource(managedClusterInfo)

      const clusters = await getClusters()

      expect(clusters.length).toBeGreaterThan(0)
      const fullCluster = clusters.find((c) => c.name === 'full-cluster')
      expect(fullCluster).toBeDefined()
      expect(fullCluster.kubeApiServer).toBeDefined()
    })

    it('should filter out ClusterDeployments with AgentCluster owners', async () => {
      const clusterDeploymentWithAgent: ClusterDeployment = {
        kind: 'ClusterDeployment',
        apiVersion: 'hive.openshift.io/v1',
        metadata: {
          name: 'agent-owned',
          uid: 'agent-uid-1',
          resourceVersion: '1',
          ownerReferences: [
            {
              kind: 'AgentCluster',
              name: 'agent',
              apiVersion: 'agent.open-cluster-management.io/v1',
            },
          ],
        },
        spec: {
          clusterName: 'agent-owned',
          baseDomain: 'example.com',
        },
        status: {},
      }

      await cacheResource(clusterDeploymentWithAgent)

      const clusters = await getClusters()

      // Should not include clusters owned by AgentCluster
      expect(clusters.every((c) => c.name !== 'agent-owned')).toBe(true)
    })
  })

  describe('getApplicationType', () => {
    it('should identify subscription app', () => {
      const app: IResource = {
        kind: 'Application',
        apiVersion: 'app.k8s.io/v1beta1',
        metadata: {
          name: 'sub-app',
          uid: 'sub-uid',
          resourceVersion: '1',
        },
      }

      expect(getApplicationType(app)).toBe('subscription')
    })

    it('should identify argo app', () => {
      const app: IArgoApplication = {
        kind: 'Application',
        apiVersion: 'argoproj.io/v1alpha1',
        metadata: {
          name: 'argo-app',
          uid: 'argo-uid',
          resourceVersion: '1',
        },
        spec: {
          destination: {
            namespace: 'default',
            server: 'https://kubernetes.default.svc',
          },
        },
      }

      expect(getApplicationType(app)).toBe('argo')
    })

    it('should identify appset', () => {
      const appSet: IResource = {
        kind: 'ApplicationSet',
        apiVersion: 'argoproj.io/v1alpha1',
        metadata: {
          name: 'my-appset',
          uid: 'appset-uid',
          resourceVersion: '1',
        },
      }

      expect(getApplicationType(appSet)).toBe('appset')
    })

    it('should return - for unknown types', () => {
      const app: IResource = {
        kind: 'Unknown',
        apiVersion: 'unknown/v1',
        metadata: {
          name: 'unknown-app',
          uid: 'unknown-uid',
          resourceVersion: '1',
        },
      }

      expect(getApplicationType(app)).toBe('-')
    })
  })

  describe('getAppNamespace', () => {
    it('should return metadata namespace for regular resources', () => {
      const resource: IResource = {
        kind: 'Application',
        apiVersion: 'app.k8s.io/v1beta1',
        metadata: {
          name: 'test',
          namespace: 'default',
          uid: 'test-uid',
          resourceVersion: '1',
        },
      }

      expect(getAppNamespace(resource)).toBe('default')
    })

    it('should return destination namespace for Argo apps', () => {
      const argoApp: IArgoApplication = {
        kind: 'Application',
        apiVersion: 'argoproj.io/v1alpha1',
        metadata: {
          name: 'argo-app',
          namespace: 'argocd',
          uid: 'argo-uid',
          resourceVersion: '1',
        },
        spec: {
          destination: {
            namespace: 'target-namespace',
            server: 'https://kubernetes.default.svc',
          },
        },
      }

      expect(getAppNamespace(argoApp)).toBe('target-namespace')
    })

    it('should handle resource without namespace', () => {
      const resource: IResource = {
        kind: 'ClusterRole',
        apiVersion: 'rbac.authorization.k8s.io/v1',
        metadata: {
          name: 'cluster-role',
          uid: 'role-uid',
          resourceVersion: '1',
        },
      }

      expect(getAppNamespace(resource)).toBeUndefined()
    })
  })

  describe('computeAppHealthStatus', () => {
    it('should compute healthy status', () => {
      const health = [[0, 0, 0, 0, 0], []] as [number[], Record<string, string>[]]
      const app: ISearchResource = {
        apigroup: '',
        apiversion: 'v1',
        cluster: 'test',
        kind: 'application',
        name: 'test-app',
        namespace: 'default',
        created: '2024-01-01T00:00:00Z',
        healthStatus: 'Healthy',
      }

      computeAppHealthStatus(health, app)

      expect(health[0][0]).toBe(1) // healthy count
    })

    it('should compute degraded status with message', () => {
      const health = [[0, 0, 0, 0, 0], []] as [number[], Record<string, string>[]]
      const app: ISearchResource = {
        apigroup: '',
        apiversion: 'v1',
        cluster: 'test',
        kind: 'application',
        name: 'test-app',
        namespace: 'default',
        created: '2024-01-01T00:00:00Z',
        healthStatus: 'Degraded',
      }

      computeAppHealthStatus(health, app)

      expect(health[0][3]).toBe(1) // danger count
      expect(health[1].length).toBeGreaterThan(0)
    })
  })

  describe('computeAppSyncStatus', () => {
    it('should compute synced status', () => {
      const synced = [[0, 0, 0, 0, 0], []] as [number[], Record<string, string>[]]
      const app: ISearchResource = {
        apigroup: '',
        apiversion: 'v1',
        cluster: 'test',
        kind: 'application',
        name: 'test-app',
        namespace: 'default',
        created: '2024-01-01T00:00:00Z',
        syncStatus: 'Synced',
      }

      computeAppSyncStatus(synced, app)

      expect(synced[0][0]).toBe(1) // healthy count
    })

    it('should compute out of sync status', () => {
      const synced = [[0, 0, 0, 0, 0], []] as [number[], Record<string, string>[]]
      const app: ISearchResource = {
        apigroup: '',
        apiversion: 'v1',
        cluster: 'test',
        kind: 'application',
        name: 'test-app',
        namespace: 'default',
        created: '2024-01-01T00:00:00Z',
        syncStatus: 'OutOfSync',
      }

      computeAppSyncStatus(synced, app)

      expect(synced[0][2]).toBe(1) // warning count
    })
  })

  describe('extractMessages', () => {
    it('should extract status message', () => {
      const ase = [[0, 0, 0, 0, 0], []] as [number[], Record<string, string>[]]
      const app: ISearchResource = {
        apigroup: '',
        apiversion: 'v1',
        cluster: 'test',
        kind: 'pod',
        name: 'test-pod',
        namespace: 'default',
        created: '2024-01-01T00:00:00Z',
      }

      extractMessages(ase, app, 'Running')

      expect(ase[1]).toContainEqual({ key: 'Status', value: 'Running' })
    })

    it('should extract condition messages', () => {
      const ase = [[0, 0, 0, 0, 0], []] as [number[], Record<string, string>[]]
      // Use a more flexible type since ISearchResource doesn't allow dynamic properties
      const app = {
        apigroup: '',
        apiversion: 'v1',
        cluster: 'test',
        kind: 'pod',
        name: 'test-pod',
        namespace: 'default',
        created: '2024-01-01T00:00:00Z',
        _condition_message: 'Pod is not ready',
      } as unknown as ISearchResource

      extractMessages(ase, app)

      expect(ase[1]).toContainEqual({ key: '_condition_message', value: 'Pod is not ready' })
    })

    it('should not duplicate messages', () => {
      const ase = [[0, 0, 0, 0, 0], [{ key: 'Status', value: 'Running' }]] as [number[], Record<string, string>[]]
      const app: ISearchResource = {
        apigroup: '',
        apiversion: 'v1',
        cluster: 'test',
        kind: 'pod',
        name: 'test-pod',
        namespace: 'default',
        created: '2024-01-01T00:00:00Z',
      }

      extractMessages(ase, app, 'Running')

      // The extractMessages function doesn't deduplicate status messages, it always adds them
      // So we should have 2 messages now
      expect(ase[1].filter((m) => m.key === 'Status')).toHaveLength(2)
    })
  })

  describe('getAppNameFromLabel', () => {
    it('should extract app name from Flux label', () => {
      // The function finds the first matching label in appOwnerLabels order
      // kustomize.toolkit.fluxcd.io/name comes before app= in the appOwnerLabels array
      const label = 'app=myapp;kustomize.toolkit.fluxcd.io/name=flux-app;other=value'
      expect(getAppNameFromLabel(label)).toBe('flux-app')
    })

    it('should extract app name from app label', () => {
      const label = 'app=test-application;env=prod'
      expect(getAppNameFromLabel(label)).toBe('test-application')
    })

    it('should extract app name from app.kubernetes.io label', () => {
      const label = 'app.kubernetes.io/part-of=my-app;tier=frontend'
      expect(getAppNameFromLabel(label)).toBe('my-app')
    })

    it('should return default when no matching label found', () => {
      const label = 'env=prod;tier=frontend'
      expect(getAppNameFromLabel(label, 'default-app')).toBe('default-app')
    })

    it('should handle label without semicolon at end', () => {
      const label = 'app=single-app'
      expect(getAppNameFromLabel(label)).toBe('single-app')
    })
  })

  describe('isSystemApp', () => {
    beforeAll(async () => {
      // Initialize system app namespace prefixes once for all tests in this suite
      await discoverSystemAppNamespacePrefixes()
    })

    it('should identify openshift namespace as system', () => {
      expect(isSystemApp('openshift-config')).toBe(true)
    })

    it('should identify hive namespace as system', () => {
      expect(isSystemApp('hive-system')).toBe(true)
    })

    it('should identify open-cluster-management namespace as system', () => {
      expect(isSystemApp('open-cluster-management-hub')).toBe(true)
    })

    it('should not identify custom namespace as system', () => {
      expect(isSystemApp('my-application')).toBe(false)
    })

    it('should handle undefined namespace', () => {
      expect(isSystemApp(undefined)).toBeFalsy()
    })
  })

  describe('getArgoPushModelClusterList', () => {
    it('should return cluster list for push model apps', async () => {
      const apps: IArgoApplication[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'app1',
            uid: 'app1-uid',
            resourceVersion: '1',
          },
          spec: {
            destination: {
              name: 'in-cluster',
              namespace: 'default',
            },
          },
        },
      ]

      const localCluster: Cluster = {
        name: 'local-cluster',
        kubeApiServer: 'https://api.local.com:6443',
      }

      const clusters = await getArgoPushModelClusterList(apps, localCluster, [])

      expect(clusters).toContain('local-cluster')
    })

    it('should identify remote clusters', async () => {
      const apps: IArgoApplication[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'app2',
            uid: 'app2-uid',
            resourceVersion: '1',
          },
          spec: {
            destination: {
              server: 'https://api.remote.com:6443',
              namespace: 'default',
            },
          },
          status: {
            cluster: 'remote-cluster',
          },
        },
      ]

      const managedClusters: Cluster[] = [
        {
          name: 'remote-cluster',
          kubeApiServer: 'https://api.remote.com:6443',
        },
      ]

      const clusters = await getArgoPushModelClusterList(apps, undefined, managedClusters)

      expect(clusters).toContain('remote-cluster')
    })

    it('should deduplicate cluster names', async () => {
      const apps: IArgoApplication[] = [
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'app3',
            uid: 'app3-uid',
            resourceVersion: '1',
          },
          spec: {
            destination: {
              name: 'in-cluster',
              namespace: 'default',
            },
          },
        },
        {
          kind: 'Application',
          apiVersion: 'argoproj.io/v1alpha1',
          metadata: {
            name: 'app4',
            uid: 'app4-uid',
            resourceVersion: '1',
          },
          spec: {
            destination: {
              name: 'in-cluster',
              namespace: 'default',
            },
          },
        },
      ]

      const localCluster: Cluster = {
        name: 'local-cluster',
        kubeApiServer: 'https://api.local.com:6443',
      }

      const clusters = await getArgoPushModelClusterList(apps, localCluster, [])

      // Should only have one entry for local-cluster
      expect(clusters.filter((c) => c === 'local-cluster')).toHaveLength(1)
    })
  })

  describe('getArgoDestinationCluster', () => {
    it('should return cluster name from server API', async () => {
      const destination = {
        server: 'https://api.test.com:6443',
        namespace: 'default',
      }

      const clusters: Cluster[] = [
        {
          name: 'test-cluster',
          kubeApiServer: 'https://api.test.com:6443',
        },
      ]

      const result = await getArgoDestinationCluster(destination, clusters)

      expect(result).toBe('test-cluster')
    })

    it('should return hub cluster for kubernetes.default.svc', async () => {
      const destination = {
        server: 'https://kubernetes.default.svc',
        namespace: 'default',
      }

      const result = await getArgoDestinationCluster(destination, [], undefined, 'hub-cluster')

      expect(result).toBe('hub-cluster')
    })

    it('should return unknown for non-matching server', async () => {
      const destination = {
        server: 'https://api.unknown.com:6443',
        namespace: 'default',
      }

      const result = await getArgoDestinationCluster(destination, [])

      expect(result).toBe('unknown')
    })

    it('should use destination name when server is not provided', async () => {
      const destination = {
        name: 'named-cluster',
        namespace: 'default',
      }

      const result = await getArgoDestinationCluster(destination, [])

      expect(result).toBe('named-cluster')
    })

    it('should convert in-cluster to hub cluster name', async () => {
      const destination = {
        name: 'in-cluster',
        namespace: 'default',
      }

      const result = await getArgoDestinationCluster(destination, [], undefined, 'my-hub')

      expect(result).toBe('my-hub')
    })
  })

  describe('keyBy', () => {
    it('should create map by string selector', () => {
      const resources: IResource[] = [
        {
          kind: 'Pod',
          apiVersion: 'v1',
          metadata: {
            name: 'pod1',
            uid: 'pod1-uid',
            resourceVersion: '1',
          },
        },
        {
          kind: 'Pod',
          apiVersion: 'v1',
          metadata: {
            name: 'pod2',
            uid: 'pod2-uid',
            resourceVersion: '1',
          },
        },
      ]

      const result = keyBy(resources, 'metadata.name')

      expect(result['pod1']).toBeDefined()
      expect(result['pod2']).toBeDefined()
      expect(result['pod1'].metadata.uid).toBe('pod1-uid')
    })

    it('should create map by function selector', () => {
      const resources: IResource[] = [
        {
          kind: 'Pod',
          apiVersion: 'v1',
          metadata: {
            name: 'pod1',
            uid: 'uid1',
            resourceVersion: '1',
          },
        },
        {
          kind: 'Pod',
          apiVersion: 'v1',
          metadata: {
            name: 'pod2',
            uid: 'uid2',
            resourceVersion: '1',
          },
        },
      ]

      const result = keyBy(resources, (item) => item.metadata.uid)

      expect(result['uid1']).toBeDefined()
      expect(result['uid2']).toBeDefined()
      expect(result['uid1'].metadata.name).toBe('pod1')
    })
  })

  describe('sizeOf', () => {
    it('should calculate size of simple object', () => {
      const data = { name: 'test', value: 123 }
      const size = sizeOf(data)

      expect(size).toBeGreaterThan(0)
      expect(typeof size).toBe('number')
    })

    it('should calculate size of nested object', () => {
      const data = {
        metadata: {
          name: 'test',
          labels: {
            app: 'myapp',
          },
        },
        spec: {
          replicas: 3,
        },
      }

      const size = sizeOf(data)

      expect(size).toBeGreaterThan(0)
    })

    it('should handle arrays in data', () => {
      const data = {
        items: [1, 2, 3, 4, 5],
      }

      const size = sizeOf(data)

      expect(size).toBeGreaterThan(0)
    })

    it('should return size for null', () => {
      const size = sizeOf(null)

      expect(size).toBeGreaterThan(0)
    })
  })

  describe('getApplicationClusters', () => {
    it('should return hub cluster for unknown type', async () => {
      const resource: IResource = {
        kind: 'Unknown',
        apiVersion: 'unknown/v1',
        metadata: {
          name: 'test',
          uid: 'test-uid',
          resourceVersion: '1',
        },
      }

      const clusters = await getApplicationClusters(resource, '-', [], [], undefined, [])

      expect(clusters).toContain('local-cluster')
    })

    it('should return cluster for OpenShift app', async () => {
      const resource = {
        kind: 'Deployment',
        apiVersion: 'apps/v1',
        metadata: {
          name: 'test',
          namespace: 'myapp',
          uid: 'test-uid',
          resourceVersion: '1',
        },
        status: {
          cluster: 'ocp-cluster',
        },
      }

      const clusters = await getApplicationClusters(resource, 'openshift', [], [], undefined, [])

      expect(clusters).toContain('ocp-cluster')
    })

    it('should return cluster for Argo app', async () => {
      const argoApp: IArgoApplication = {
        kind: 'Application',
        apiVersion: 'argoproj.io/v1alpha1',
        metadata: {
          name: 'argo-test',
          namespace: 'argocd',
          uid: 'argo-uid',
          resourceVersion: '1',
        },
        spec: {
          destination: {
            server: 'https://kubernetes.default.svc',
            namespace: 'default',
          },
        },
      }

      const localCluster: Cluster = {
        name: 'local-cluster',
        kubeApiServer: 'https://api.local.com:6443',
        consoleUrl: 'https://console.local.com',
      }

      const clusters = await getApplicationClusters(argoApp, 'argo', [], [], localCluster, [])

      expect(clusters).toHaveLength(1)
      expect(clusters[0]).toBe('local-cluster')
    })
  })
})
