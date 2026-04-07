/* Copyright Contributors to the Open Cluster Management project */

jest.mock('../../../src/routes/events', () => ({
  getHubClusterName: jest.fn(() => 'local-cluster'),
  getKubeResources: jest.fn((): unknown[] => []),
}))

jest.mock('../../../src/routes/aggregators/applicationsArgo', () => ({
  getAppSetAppsMap: jest.fn(() => ({})),
}))

jest.mock('../../../src/routes/aggregators/utils', () => ({
  getClusters: jest.fn(() => Promise.resolve([])),
  getArgoDestinationCluster: jest.fn(() => Promise.resolve('unknown')),
}))

import { addPushModelPodQueryInputs } from '../../../src/routes/aggregators/applicationsPushModel'
import { getAppSetAppsMap } from '../../../src/routes/aggregators/applicationsArgo'
import { getHubClusterName } from '../../../src/routes/events'
import { getClusters, getArgoDestinationCluster } from '../../../src/routes/aggregators/utils'
import { type IArgoApplication, type IQuery, SEARCH_QUERY_LIMIT } from '../../../src/routes/aggregators/applications'

const mockGetAppSetAppsMap = getAppSetAppsMap as jest.MockedFunction<typeof getAppSetAppsMap>
const mockGetHubClusterName = getHubClusterName as jest.MockedFunction<typeof getHubClusterName>
const mockGetClusters = getClusters as jest.MockedFunction<typeof getClusters>
const mockGetArgoDestinationCluster = getArgoDestinationCluster as jest.MockedFunction<typeof getArgoDestinationCluster>

function makeQuery(): IQuery {
  return { operationName: 'searchResult', variables: { input: [] }, query: '' }
}

function makeArgoApp(
  name: string,
  namespace: string,
  destination: { name?: string; namespace: string; server?: string },
  resources?: Array<{ kind: string; name: string; namespace: string }>
): IArgoApplication {
  return {
    kind: 'Application',
    apiVersion: 'argoproj.io/v1alpha1',
    metadata: {
      name,
      namespace,
      uid: `${name}-uid`,
      resourceVersion: '1',
      ownerReferences: [{ kind: 'ApplicationSet', name: 'my-appset', apiVersion: 'argoproj.io/v1alpha1' }],
    },
    spec: { destination },
    ...(resources ? { status: { resources } } : {}),
  } as unknown as IArgoApplication
}

describe('applicationsPushModel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetHubClusterName.mockReturnValue('local-cluster')
    mockGetClusters.mockResolvedValue([
      { name: 'local-cluster', kubeApiServer: 'https://api.local:6443' },
      { name: 'remote-1', kubeApiServer: 'https://api.remote-1:6443' },
      { name: 'remote-2', kubeApiServer: 'https://api.remote-2:6443' },
    ])
  })

  describe('addPushModelPodQueryInputs', () => {
    it('should return an empty map when no appsets exist', async () => {
      mockGetAppSetAppsMap.mockReturnValue({})
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(0)
      expect(query.variables.input).toHaveLength(0)
    })

    it('should skip apps targeting the hub cluster', async () => {
      mockGetArgoDestinationCluster.mockResolvedValue('local-cluster')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-local-cluster', 'openshift-gitops', { name: 'in-cluster', namespace: 'default' }, [
            { kind: 'Deployment', name: 'my-deploy', namespace: 'default' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(0)
      expect(query.variables.input).toHaveLength(0)
    })

    it('should skip apps without status.resources', async () => {
      mockGetArgoDestinationCluster.mockResolvedValue('remote-1')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-remote-1', 'openshift-gitops', { name: 'remote-1', namespace: 'default' }),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(0)
      expect(query.variables.input).toHaveLength(0)
    })

    it('should collect Deployment workloads from remote push model apps', async () => {
      mockGetArgoDestinationCluster.mockResolvedValue('remote-1')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-remote-1', 'openshift-gitops', { name: 'remote-1', namespace: 'default' }, [
            { kind: 'Deployment', name: 'web-server', namespace: 'app-ns' },
            { kind: 'Service', name: 'web-svc', namespace: 'app-ns' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(1)
      expect(result.has('remote-1/app-ns/web-server')).toBe(true)
      const entry = result.get('remote-1/app-ns/web-server')
      expect(entry.appSetKey).toBe('appset/openshift-gitops/my-appset')
      expect(entry.targetCluster).toBe('remote-1')

      expect(query.variables.input).toHaveLength(1)
      const input = query.variables.input[0] as {
        filters: Array<{ property: string; values: string[] }>
        relatedKinds: string[]
        limit: number
      }
      expect(input.filters).toEqual([
        { property: 'kind', values: ['Deployment', 'StatefulSet'] },
        { property: 'name', values: ['web-server'] },
        { property: 'cluster', values: ['remote-1'] },
      ])
      expect(input.relatedKinds).toEqual(['pod', 'replicaset'])
      expect(input.limit).toBe(SEARCH_QUERY_LIMIT)
    })

    it('should collect StatefulSet workloads', async () => {
      mockGetArgoDestinationCluster.mockResolvedValue('remote-1')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-remote-1', 'openshift-gitops', { name: 'remote-1', namespace: 'default' }, [
            { kind: 'StatefulSet', name: 'db', namespace: 'data-ns' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(1)
      expect(result.has('remote-1/data-ns/db')).toBe(true)
    })

    it('should ignore non-workload kinds like Service and ConfigMap', async () => {
      mockGetArgoDestinationCluster.mockResolvedValue('remote-1')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-remote-1', 'openshift-gitops', { name: 'remote-1', namespace: 'default' }, [
            { kind: 'Service', name: 'svc', namespace: 'app-ns' },
            { kind: 'ConfigMap', name: 'cfg', namespace: 'app-ns' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(0)
      expect(query.variables.input).toHaveLength(0)
    })

    it('should use destination namespace when resource namespace is empty', async () => {
      mockGetArgoDestinationCluster.mockResolvedValue('remote-1')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-remote-1', 'openshift-gitops', { name: 'remote-1', namespace: 'target-ns' }, [
            { kind: 'Deployment', name: 'web', namespace: '' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(1)
      expect(result.has('remote-1/target-ns/web')).toBe(true)
    })

    it('should handle multiple appsets with apps on different remote clusters', async () => {
      mockGetArgoDestinationCluster.mockResolvedValueOnce('remote-1').mockResolvedValueOnce('remote-2')
      mockGetAppSetAppsMap.mockReturnValue({
        'appset-a': [
          makeArgoApp('appset-a-remote-1', 'ns-a', { name: 'remote-1', namespace: 'default' }, [
            { kind: 'Deployment', name: 'web-a', namespace: 'default' },
          ]),
        ],
        'appset-b': [
          makeArgoApp('appset-b-remote-2', 'ns-b', { name: 'remote-2', namespace: 'default' }, [
            { kind: 'Deployment', name: 'web-b', namespace: 'default' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(2)
      expect(result.get('remote-1/default/web-a')?.appSetKey).toBe('appset/ns-a/appset-a')
      expect(result.get('remote-2/default/web-b')?.appSetKey).toBe('appset/ns-b/appset-b')

      const input = query.variables.input[0] as {
        filters: Array<{ property: string; values: string[] }>
      }
      expect(input.filters[1].values).toEqual(expect.arrayContaining(['web-a', 'web-b']))
      expect(input.filters[2].values).toEqual(expect.arrayContaining(['remote-1', 'remote-2']))
    })

    it('should handle mixed hub and remote apps in a single appset', async () => {
      mockGetArgoDestinationCluster.mockResolvedValueOnce('local-cluster').mockResolvedValueOnce('remote-1')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-local', 'openshift-gitops', { name: 'in-cluster', namespace: 'default' }, [
            { kind: 'Deployment', name: 'web', namespace: 'default' },
          ]),
          makeArgoApp('my-appset-remote', 'openshift-gitops', { name: 'remote-1', namespace: 'default' }, [
            { kind: 'Deployment', name: 'web', namespace: 'default' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      // Only the remote app's Deployment should be collected
      expect(result.size).toBe(1)
      expect(result.has('remote-1/default/web')).toBe(true)
      expect(result.has('local-cluster/default/web')).toBe(false)
    })

    it('should deduplicate deployment names across apps', async () => {
      mockGetArgoDestinationCluster.mockResolvedValueOnce('remote-1').mockResolvedValueOnce('remote-2')
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp('my-appset-remote-1', 'openshift-gitops', { name: 'remote-1', namespace: 'default' }, [
            { kind: 'Deployment', name: 'shared-web', namespace: 'default' },
          ]),
          makeArgoApp('my-appset-remote-2', 'openshift-gitops', { name: 'remote-2', namespace: 'default' }, [
            { kind: 'Deployment', name: 'shared-web', namespace: 'default' },
          ]),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(2)
      const input = query.variables.input[0] as {
        filters: Array<{ property: string; values: string[] }>
      }
      // The deployment name should only appear once in the filter
      expect(input.filters[1].values).toEqual(['shared-web'])
    })

    it('should skip apps whose destination resolves to undefined', async () => {
      mockGetArgoDestinationCluster.mockResolvedValue(undefined as unknown as string)
      mockGetAppSetAppsMap.mockReturnValue({
        'my-appset': [
          makeArgoApp(
            'my-appset-unknown',
            'openshift-gitops',
            { server: 'https://api.unknown:6443', namespace: 'default' },
            [{ kind: 'Deployment', name: 'web', namespace: 'default' }]
          ),
        ],
      })
      const query = makeQuery()

      const result = await addPushModelPodQueryInputs(query)

      expect(result.size).toBe(0)
      expect(query.variables.input).toHaveLength(0)
    })
  })
})
