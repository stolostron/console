/* Copyright Contributors to the Open Cluster Management project */
import {
  getAppNamespace,
  getApplicationType,
  computeAppHealthStatus,
  computeAppSyncStatus,
  computeDeployedPodStatuses,
  computePodStatuses,
  extractMessages,
  discoverSystemAppNamespacePrefixes,
  isSystemApp,
  getArgoPushModelClusterList,
  getArgoDestinationCluster,
  getClusters,
  getConsoleUrl,
  sizeOf,
  keyBy,
  systemAppNamespacePrefixes,
} from '../../src/routes/aggregators/utils'
import {
  IResource,
  IArgoApplication,
  Cluster,
  ManagedCluster,
  ManagedClusterInfo,
  ClusterDeployment,
  HostedClusterK8sResource,
  ISearchResource,
  SearchResult,
} from '../../src/resources/resource'
import { StatusColumn, ScoreColumn, ApplicationStatuses } from '../../src/routes/aggregators/applications'
import { cacheResource } from '../../src/routes/events'
import nock from 'nock'

describe('aggregator utils', () => {
  beforeEach(() => {
    systemAppNamespacePrefixes.length = 0
  })

  describe('getApplicationType', () => {
    it('should return subscription for app.k8s.io/v1beta1 Application', () => {
      const resource: IResource = {
        apiVersion: 'app.k8s.io/v1beta1',
        kind: 'Application',
        metadata: { name: 'test-app', namespace: 'default' },
      }
      expect(getApplicationType(resource)).toBe('subscription')
    })

    it('should return argo for argoproj.io/v1alpha1 Application', () => {
      const resource: IResource = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: { name: 'test-app', namespace: 'default' },
      }
      expect(getApplicationType(resource)).toBe('argo')
    })

    it('should return appset for argoproj.io/v1alpha1 ApplicationSet', () => {
      const resource: IResource = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'test-appset', namespace: 'default' },
      }
      expect(getApplicationType(resource)).toBe('appset')
    })

    it('should return flux for flux applications', () => {
      const resource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        label: 'helm.toolkit.fluxcd.io/name=test;helm.toolkit.fluxcd.io/namespace=test-ns',
        metadata: { name: 'test-app', namespace: 'default' },
      }
      expect(getApplicationType(resource)).toBe('flux')
    })

    it('should return flux for kustomize flux applications', () => {
      const resource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        label: 'kustomize.toolkit.fluxcd.io/name=test;kustomize.toolkit.fluxcd.io/namespace=test-ns',
        metadata: { name: 'test-app', namespace: 'default' },
      }
      expect(getApplicationType(resource)).toBe('flux')
    })

    it('should return openshift-default for system namespaces', () => {
      const resource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        label: 'app=test',
        metadata: { name: 'test-app', namespace: 'openshift-console' },
      }
      systemAppNamespacePrefixes.push('openshift')
      expect(getApplicationType(resource)).toBe('openshift-default')
    })

    it('should return openshift for OCP applications', () => {
      const resource = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        label: 'app=test',
        metadata: { name: 'test-app', namespace: 'default' },
      }
      expect(getApplicationType(resource)).toBe('openshift')
    })

    it('should return - for unknown types', () => {
      const resource: IResource = {
        apiVersion: 'unknown/v1',
        kind: 'Unknown',
        metadata: { name: 'test-app', namespace: 'default' },
      }
      expect(getApplicationType(resource)).toBe('-')
    })
  })

  describe('getAppNamespace', () => {
    it('should return resource namespace for non-Argo apps', () => {
      const resource: IResource = {
        apiVersion: 'app.k8s.io/v1beta1',
        kind: 'Application',
        metadata: { name: 'test-app', namespace: 'my-namespace' },
      }
      expect(getAppNamespace(resource)).toBe('my-namespace')
    })

    it('should return destination namespace for Argo apps', () => {
      const resource: IArgoApplication = {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: { name: 'test-app', namespace: 'argo-namespace' },
        spec: {
          destination: {
            namespace: 'target-namespace',
          },
        },
      }
      expect(getAppNamespace(resource)).toBe('target-namespace')
    })

    it('should handle undefined metadata', () => {
      const resource: IResource = {
        apiVersion: 'app.k8s.io/v1beta1',
        kind: 'Application',
      }
      expect(getAppNamespace(resource)).toBeUndefined()
    })
  })

  describe('computeAppHealthStatus', () => {
    it('should increment healthy count for Healthy status', () => {
      const health: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        healthStatus: 'Healthy',
      }
      computeAppHealthStatus(health, app)
      expect(health[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    })

    it('should increment danger count and extract messages for Degraded status', () => {
      const health: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        healthStatus: 'Degraded',
      }
      computeAppHealthStatus(health, app)
      expect(health[StatusColumn.counts][ScoreColumn.danger]).toBe(1)
      expect(health[StatusColumn.messages].length).toBeGreaterThan(0)
    })

    it('should increment progress count for Progressing status', () => {
      const health: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        healthStatus: 'Progressing',
      }
      computeAppHealthStatus(health, app)
      expect(health[StatusColumn.counts][ScoreColumn.progress]).toBe(1)
    })

    it('should increment unknown count for Unknown status', () => {
      const health: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        healthStatus: 'Unknown',
      }
      computeAppHealthStatus(health, app)
      expect(health[StatusColumn.counts][ScoreColumn.unknown]).toBe(1)
    })

    it('should increment warning count for other statuses', () => {
      const health: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        healthStatus: 'Missing',
      }
      computeAppHealthStatus(health, app)
      expect(health[StatusColumn.counts][ScoreColumn.warning]).toBe(1)
    })
  })

  describe('computeAppSyncStatus', () => {
    it('should increment healthy count for Synced status', () => {
      const synced: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        syncStatus: 'Synced',
      }
      computeAppSyncStatus(synced, app)
      expect(synced[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    })

    it('should increment unknown count for Unknown status', () => {
      const synced: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        syncStatus: 'Unknown',
      }
      computeAppSyncStatus(synced, app)
      expect(synced[StatusColumn.counts][ScoreColumn.unknown]).toBe(1)
    })

    it('should increment danger count for OutOfSync status', () => {
      const synced: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        syncStatus: 'OutOfSync',
      }
      computeAppSyncStatus(synced, app)
      expect(synced[StatusColumn.counts][ScoreColumn.danger]).toBe(1)
    })
  })

  describe('extractMessages', () => {
    it('should add status message when status is provided', () => {
      const entry: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
      }
      extractMessages(entry, app, 'Failed')
      expect(entry[StatusColumn.messages]).toContainEqual({ key: 'Status', value: 'Failed' })
    })

    it('should extract condition messages from app properties', () => {
      const entry: [number[], Record<string, string>[]] = [[0, 0, 0, 0, 0], []]
      const app: ISearchResource & Record<string, string> = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        _condition_message: 'Pod failed',
      }
      extractMessages(entry, app as ISearchResource)
      expect(entry[StatusColumn.messages]).toContainEqual({ key: '_condition_message', value: 'Pod failed' })
    })

    it('should not add duplicate messages', () => {
      const entry: [number[], Record<string, string>[]] = [
        [0, 0, 0, 0, 0],
        [{ key: '_condition_message', value: 'Pod failed' }],
      ]
      const app: ISearchResource & Record<string, string> = {
        apigroup: 'argoproj.io',
        apiversion: 'v1alpha1',
        kind: 'Application',
        name: 'test-app',
        namespace: 'default',
        cluster: 'local-cluster',
        created: '2024-01-01',
        _condition_message: 'Pod failed',
      }
      extractMessages(entry, app as ISearchResource)
      expect(entry[StatusColumn.messages].length).toBe(1)
    })
  })

  describe('computePodStatuses', () => {
    it('should compute statuses for pods in error states', () => {
      const app2AppsetMap: Record<string, ApplicationStatuses> = {
        'app-uid-1': {
          health: [[0, 0, 0, 0, 0], []],
          synced: [[0, 0, 0, 0, 0], []],
          deployed: [[0, 0, 0, 0, 0], []],
        },
      }

      const related: SearchResult['related'] = [
        {
          kind: 'Pod',
          items: [
            {
              _uid: 'pod-1',
              _relatedUids: ['app-uid-1'],
              apigroup: '',
              apiversion: 'v1',
              kind: 'Pod',
              name: 'test-pod',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              status: 'CrashLoopBackOff',
            },
          ],
        },
      ]

      const count = computePodStatuses(related, app2AppsetMap)
      expect(count).toBe(1)
      expect(app2AppsetMap['app-uid-1'].deployed[StatusColumn.counts][ScoreColumn.danger]).toBe(1)
    })

    it('should compute statuses for pods in warning states', () => {
      const app2AppsetMap: Record<string, ApplicationStatuses> = {
        'app-uid-1': {
          health: [[0, 0, 0, 0, 0], []],
          synced: [[0, 0, 0, 0, 0], []],
          deployed: [[0, 0, 0, 0, 0], []],
        },
      }

      const related: SearchResult['related'] = [
        {
          kind: 'Pod',
          items: [
            {
              _uid: 'pod-1',
              _relatedUids: ['app-uid-1'],
              apigroup: '',
              apiversion: 'v1',
              kind: 'Pod',
              name: 'test-pod',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              status: 'Pending',
            },
          ],
        },
      ]

      const count = computePodStatuses(related, app2AppsetMap)
      expect(count).toBe(1)
      expect(app2AppsetMap['app-uid-1'].deployed[StatusColumn.counts][ScoreColumn.warning]).toBe(1)
    })

    it('should compute statuses for healthy pods', () => {
      const app2AppsetMap: Record<string, ApplicationStatuses> = {
        'app-uid-1': {
          health: [[0, 0, 0, 0, 0], []],
          synced: [[0, 0, 0, 0, 0], []],
          deployed: [[0, 0, 0, 0, 0], []],
        },
      }

      const related: SearchResult['related'] = [
        {
          kind: 'Pod',
          items: [
            {
              _uid: 'pod-1',
              _relatedUids: ['app-uid-1'],
              apigroup: '',
              apiversion: 'v1',
              kind: 'Pod',
              name: 'test-pod',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              status: 'Running',
            },
          ],
        },
      ]

      const count = computePodStatuses(related, app2AppsetMap)
      expect(count).toBe(1)
      expect(app2AppsetMap['app-uid-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    })

    it('should ignore terminating pods', () => {
      const app2AppsetMap: Record<string, ApplicationStatuses> = {
        'app-uid-1': {
          health: [[0, 0, 0, 0, 0], []],
          synced: [[0, 0, 0, 0, 0], []],
          deployed: [[0, 0, 0, 0, 0], []],
        },
      }

      const related: SearchResult['related'] = [
        {
          kind: 'Pod',
          items: [
            {
              _uid: 'pod-1',
              _relatedUids: ['app-uid-1'],
              apigroup: '',
              apiversion: 'v1',
              kind: 'Pod',
              name: 'test-pod',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              status: 'Terminating',
            },
          ],
        },
      ]

      computePodStatuses(related, app2AppsetMap)
      expect(app2AppsetMap['app-uid-1'].deployed[StatusColumn.counts]).toEqual([0, 0, 0, 0, 0])
    })

    it('should return 0 when no pod map exists', () => {
      const app2AppsetMap: Record<string, ApplicationStatuses> = {}
      const related: SearchResult['related'] = []
      const count = computePodStatuses(related, app2AppsetMap)
      expect(count).toBe(0)
    })
  })

  describe('computeDeployedPodStatuses', () => {
    it('should compute deployed pod statuses with deployments and replica sets', () => {
      const app2AppsetMap: Record<string, ApplicationStatuses> = {
        'app-uid-1': {
          health: [[1, 0, 0, 0, 0], []],
          synced: [[1, 0, 0, 0, 0], []],
          deployed: [[0, 0, 0, 0, 0], []],
        },
      }

      const related: SearchResult['related'] = [
        {
          kind: 'Pod',
          items: [
            {
              _uid: 'pod-1',
              _relatedUids: ['app-uid-1'],
              apigroup: '',
              apiversion: 'v1',
              kind: 'Pod',
              name: 'test-pod',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              status: 'Running',
            },
          ],
        },
        {
          kind: 'Deployment',
          items: [
            {
              _uid: 'deploy-1',
              _relatedUids: ['app-uid-1'],
              apigroup: 'apps',
              apiversion: 'v1',
              kind: 'Deployment',
              name: 'test-deployment',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              desired: '2',
              current: '1',
              available: '1',
            },
          ],
        },
        {
          kind: 'ReplicaSet',
          items: [
            {
              _uid: 'rs-1',
              _relatedUids: ['app-uid-1'],
              apigroup: 'apps',
              apiversion: 'v1',
              kind: 'ReplicaSet',
              name: 'test-rs',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              desired: '1',
              current: '1',
              available: '1',
            },
          ],
        },
      ]

      computeDeployedPodStatuses(related, app2AppsetMap)
      expect(app2AppsetMap['app-uid-1'].deployed[StatusColumn.counts][ScoreColumn.healthy]).toBe(1)
    })

    it('should handle missing pods', () => {
      const app2AppsetMap: Record<string, ApplicationStatuses> = {
        'app-uid-1': {
          health: [[1, 0, 0, 0, 0], []],
          synced: [[1, 0, 0, 0, 0], []],
          deployed: [[0, 0, 0, 0, 0], []],
        },
      }

      const related: SearchResult['related'] = [
        {
          kind: 'Pod',
          items: [],
        },
        {
          kind: 'Deployment',
          items: [
            {
              _uid: 'deploy-1',
              _relatedUids: ['app-uid-1'],
              apigroup: 'apps',
              apiversion: 'v1',
              kind: 'Deployment',
              name: 'test-deployment',
              namespace: 'default',
              cluster: 'local-cluster',
              created: '2024-01-01',
              desired: '2',
              current: '0',
              available: '0',
            },
          ],
        },
      ]

      computeDeployedPodStatuses(related, app2AppsetMap)
      // Should detect missing pods
      expect(app2AppsetMap['app-uid-1'].deployed[StatusColumn.counts][ScoreColumn.progress]).toBeGreaterThan(0)
    })
  })

  describe('isSystemApp', () => {
    beforeEach(() => {
      systemAppNamespacePrefixes.push('openshift')
      systemAppNamespacePrefixes.push('hive')
      systemAppNamespacePrefixes.push('open-cluster-management')
    })

    it('should return true for openshift namespace', () => {
      expect(isSystemApp('openshift-console')).toBe(true)
    })

    it('should return true for hive namespace', () => {
      expect(isSystemApp('hive-system')).toBe(true)
    })

    it('should return true for open-cluster-management namespace', () => {
      expect(isSystemApp('open-cluster-management')).toBe(true)
    })

    it('should return false for user namespaces', () => {
      expect(isSystemApp('default')).toBe(false)
      expect(isSystemApp('my-app-namespace')).toBe(false)
    })

    it('should return false for undefined namespace', () => {
      expect(isSystemApp(undefined)).toBeFalsy()
    })
  })

  describe('discoverSystemAppNamespacePrefixes', () => {
    it('should discover system app namespace prefixes with MCH', async () => {
      nock(process.env.CLUSTER_API_URL)
        .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
        .reply(200, {
          items: [
            {
              metadata: {
                namespace: 'custom-mch-ns',
              },
            },
          ],
        })

      nock(process.env.CLUSTER_API_URL)
        .get('/apis/multicluster.openshift.io/v1/multiclusterengines')
        .reply(200, {
          items: [
            {
              spec: {
                targetNamespace: 'custom-mce-ns',
              },
            },
          ],
        })

      const prefixes = await discoverSystemAppNamespacePrefixes()
      expect(prefixes).toContain('openshift')
      expect(prefixes).toContain('hive')
      expect(prefixes).toContain('open-cluster-management')
      expect(prefixes).toContain('custom-mch-ns')
      expect(prefixes).toContain('custom-mce-ns')
    })

    it('should handle missing MCH', async () => {
      nock(process.env.CLUSTER_API_URL)
        .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
        .reply(200, {
          items: [],
        })

      nock(process.env.CLUSTER_API_URL).get('/apis/multicluster.openshift.io/v1/multiclusterengines').reply(200, {
        items: [],
      })

      const prefixes = await discoverSystemAppNamespacePrefixes()
      expect(prefixes).toContain('openshift')
      expect(prefixes).toContain('hive')
      expect(prefixes).toContain('open-cluster-management')
    })
  })

  describe('getArgoDestinationCluster', () => {
    const clusters: Cluster[] = [
      {
        name: 'cluster-1',
        kubeApiServer: 'https://api.cluster1.com:6443',
        consoleUrl: 'https://console.cluster1.com',
      },
      {
        name: 'cluster-2',
        kubeApiServer: 'https://api.cluster2.com:6443',
        consoleUrl: 'https://console.cluster2.com',
      },
    ]

    it('should return hubClusterName for kubernetes.default.svc', () => {
      const destination = {
        namespace: 'default',
        server: 'https://kubernetes.default.svc',
      }
      const result = getArgoDestinationCluster(destination, clusters, undefined, 'local-cluster')
      expect(result).toBe('local-cluster')
    })

    it('should return cluster name from cluster parameter for kubernetes.default.svc', () => {
      const destination = {
        namespace: 'default',
        server: 'https://kubernetes.default.svc',
      }
      const result = getArgoDestinationCluster(destination, clusters, 'remote-cluster', 'local-cluster')
      expect(result).toBe('remote-cluster')
    })

    it('should find cluster by server API', () => {
      const destination = {
        namespace: 'default',
        server: 'https://api.cluster1.com:6443',
      }
      const result = getArgoDestinationCluster(destination, clusters)
      expect(result).toBe('cluster-1')
    })

    it('should return unknown for unmatched server API', () => {
      const destination = {
        namespace: 'default',
        server: 'https://api.unknown.com:6443',
      }
      const result = getArgoDestinationCluster(destination, clusters)
      expect(result).toBe('unknown')
    })

    it('should use name when server is not provided', () => {
      const destination = {
        name: 'cluster-1',
        namespace: 'default',
      }
      const result = getArgoDestinationCluster(destination, clusters)
      expect(result).toBe('cluster-1')
    })

    it('should handle in-cluster destination with cluster parameter', () => {
      const destination = {
        name: 'in-cluster',
        namespace: 'default',
      }
      const result = getArgoDestinationCluster(destination, clusters, 'remote-cluster', 'local-cluster')
      expect(result).toBe('remote-cluster')
    })

    it('should convert in-cluster to hubClusterName', () => {
      const destination = {
        name: 'in-cluster',
        namespace: 'default',
      }
      const result = getArgoDestinationCluster(destination, clusters, undefined, 'local-cluster')
      expect(result).toBe('local-cluster')
    })
  })

  describe('getArgoPushModelClusterList', () => {
    const localCluster: Cluster = {
      name: 'local-cluster',
      kubeApiServer: 'https://api.local.com:6443',
      consoleUrl: 'https://console.local.com',
    }

    const managedClusters: Cluster[] = [
      {
        name: 'managed-1',
        kubeApiServer: 'https://api.managed1.com:6443',
        consoleUrl: 'https://console.managed1.com',
      },
    ]

    it('should include local cluster for in-cluster destination', () => {
      const resources: IArgoApplication[] = [
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: { name: 'app1', namespace: 'default' },
          spec: {
            destination: {
              name: 'in-cluster',
              namespace: 'default',
            },
          },
        },
      ]

      const result = getArgoPushModelClusterList(resources, localCluster, managedClusters)
      expect(result).toContain('local-cluster')
    })

    it('should include local cluster for kubernetes.default.svc server', () => {
      const resources: IArgoApplication[] = [
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: { name: 'app1', namespace: 'default' },
          spec: {
            destination: {
              namespace: 'default',
              server: 'https://kubernetes.default.svc',
            },
          },
        },
      ]

      const result = getArgoPushModelClusterList(resources, localCluster, managedClusters)
      expect(result).toContain('local-cluster')
    })

    it('should handle remote argo apps', () => {
      const resources: IArgoApplication[] = [
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: { name: 'app1', namespace: 'default' },
          spec: {
            destination: {
              namespace: 'default',
              server: 'https://api.managed1.com:6443',
            },
          },
          status: {
            cluster: 'managed-1',
          },
        },
      ]

      const result = getArgoPushModelClusterList(resources, localCluster, managedClusters)
      expect(result).toContain('managed-1')
    })

    it('should deduplicate cluster names', () => {
      const resources: IArgoApplication[] = [
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: { name: 'app1', namespace: 'default' },
          spec: {
            destination: {
              name: 'in-cluster',
              namespace: 'default',
            },
          },
        },
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'Application',
          metadata: { name: 'app2', namespace: 'default' },
          spec: {
            destination: {
              name: 'in-cluster',
              namespace: 'default',
            },
          },
        },
      ]

      const result = getArgoPushModelClusterList(resources, localCluster, managedClusters)
      expect(result.length).toBe(1)
      expect(result).toContain('local-cluster')
    })
  })

  describe('getClusters', () => {
    it('should return list of clusters from managed clusters and deployments', () => {
      const managedCluster: ManagedCluster = {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: { name: 'test-cluster' },
        status: { clusterClaims: [] },
      }

      const clusterInfo: ManagedClusterInfo = {
        apiVersion: 'internal.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterInfo',
        metadata: { name: 'test-cluster' },
        spec: { masterEndpoint: 'https://api.test.com:6443' },
        status: { consoleURL: 'https://console.test.com' },
      }

      cacheResource(managedCluster)
      cacheResource(clusterInfo)

      const clusters = getClusters()
      expect(clusters.length).toBeGreaterThan(0)
      const testCluster = clusters.find((c) => c.name === 'test-cluster')
      expect(testCluster).toBeDefined()
    })
  })

  describe('getConsoleUrl', () => {
    it('should return console URL from managed cluster claim', () => {
      const managedCluster: ManagedCluster = {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: { name: 'test-cluster' },
        status: {
          clusterClaims: [
            {
              name: 'consoleurl.cluster.open-cluster-management.io',
              value: 'https://console.from-claim.com',
            },
          ],
        },
      }

      const url = getConsoleUrl(undefined, undefined, managedCluster, undefined)
      expect(url).toBe('https://console.from-claim.com')
    })

    it('should return console URL from cluster deployment', () => {
      const clusterDeployment: ClusterDeployment = {
        apiVersion: 'hive.openshift.io/v1',
        kind: 'ClusterDeployment',
        metadata: { name: 'test-cluster' },
        status: {
          webConsoleURL: 'https://console.from-deployment.com',
        },
      }

      const url = getConsoleUrl(clusterDeployment, undefined, undefined, undefined)
      expect(url).toBe('https://console.from-deployment.com')
    })

    it('should return console URL from managed cluster info', () => {
      const managedClusterInfo: ManagedClusterInfo = {
        apiVersion: 'internal.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterInfo',
        metadata: { name: 'test-cluster' },
        status: {
          consoleURL: 'https://console.from-info.com',
        },
      }

      const url = getConsoleUrl(undefined, managedClusterInfo, undefined, undefined)
      expect(url).toBe('https://console.from-info.com')
    })

    it('should generate console URL from hosted cluster', () => {
      const hostedCluster: HostedClusterK8sResource = {
        apiVersion: 'hypershift.openshift.io/v1beta1',
        kind: 'HostedCluster',
        metadata: { name: 'test-hosted' },
        spec: {
          masterEndpoint: 'https://api.test.com:6443',
          dns: {
            baseDomain: 'example.com',
          },
        },
      }

      const url = getConsoleUrl(undefined, undefined, undefined, hostedCluster)
      expect(url).toBe('https://console-openshift-console.apps.test-hosted.example.com')
    })
  })

  describe('sizeOf', () => {
    it('should calculate size of simple objects', () => {
      const obj = { name: 'test', value: 123 }
      const size = sizeOf(obj)
      expect(size).toBeGreaterThan(0)
    })

    it('should calculate size of arrays', () => {
      const arr = [1, 2, 3, 4, 5]
      const size = sizeOf(arr)
      expect(size).toBeGreaterThan(0)
    })

    it('should calculate size of nested objects', () => {
      const obj = {
        level1: {
          level2: {
            data: [1, 2, 3],
          },
        },
      }
      const size = sizeOf(obj)
      expect(size).toBeGreaterThan(0)
    })
  })

  describe('keyBy', () => {
    it('should create a keyed object using string selector', () => {
      const items: IResource[] = [
        {
          apiVersion: 'v1',
          kind: 'Test',
          metadata: { name: 'item1', namespace: 'ns1' },
        },
        {
          apiVersion: 'v1',
          kind: 'Test',
          metadata: { name: 'item2', namespace: 'ns2' },
        },
      ]

      const result = keyBy(items, 'metadata.name')
      expect(result['item1']).toBeDefined()
      expect(result['item2']).toBeDefined()
      expect(result['item1'].metadata?.namespace).toBe('ns1')
    })

    it('should create a keyed object using function selector', () => {
      const items: IResource[] = [
        {
          apiVersion: 'v1',
          kind: 'Test',
          metadata: { name: 'item1', namespace: 'ns1' },
        },
        {
          apiVersion: 'v1',
          kind: 'Test',
          metadata: { name: 'item2', namespace: 'ns2' },
        },
      ]

      const result = keyBy(items, (item) => item.metadata?.namespace || '')
      expect(result['ns1']).toBeDefined()
      expect(result['ns2']).toBeDefined()
      expect(result['ns1'].metadata?.name).toBe('item1')
    })
  })
})
