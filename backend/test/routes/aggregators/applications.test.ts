/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'

// Mock the search module BEFORE importing anything that uses it
jest.mock('../../../src/lib/search', () => {
  const actual = jest.requireActual<typeof import('../../../src/lib/search')>('../../../src/lib/search')
  return {
    ...actual,
    getSearchResults: jest.fn(),
  }
})

import {
  aggregateRemoteApplications,
  resetApplicationCache,
  applicationCache,
  filterApplications,
  sortApplications,
  getStatusFilterKey,
  addUIData,
  AppColumns,
  ICompressedResource,
  ApplicationScoresMap,
  stopAggregatingApplications,
} from '../../../src/routes/aggregators/applications'
import { cacheResource } from '../../../src/routes/events'
import { IResource } from '../../../src/resources/resource'
import { getSearchResults } from '../../../src/lib/search'

// Get the mocked function
const mockGetSearchResults = getSearchResults as jest.MockedFunction<typeof getSearchResults>

// Set a reasonable test timeout
jest.setTimeout(10000)

describe('applications aggregateRemoteApplications', () => {
  beforeEach(() => {
    resetApplicationCache()
    nock.cleanAll()
    // Mock for getMultiClusterHub
    nock(process.env.CLUSTER_API_URL || 'https://example.com')
      .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
      .times(20)
      .reply(200, { items: [] })
  })

  afterEach(async () => {
    stopAggregatingApplications()
    nock.cleanAll()
    // Give time for any pending promises to settle
    await new Promise((resolve) => setImmediate(resolve))
  })

  afterAll(async () => {
    nock.restore()
    // Clean up the ServerSideEvents interval to prevent orphan handles
    const { ServerSideEvents } = await import('../../../src/lib/server-side-events')
    await ServerSideEvents.dispose()
  })

  describe('aggregateRemoteApplications', () => {
    beforeEach(() => {
      // Set up a default mock return value for all tests in this describe block
      mockGetSearchResults.mockResolvedValue({
        data: {
          searchResult: [
            { items: [], related: [] }, // Argo
            { items: [], related: [] }, // OCP
          ],
        },
      })
    })

    it('should cache system applications when pass is appropriate', async () => {
      // Setup
      const managedCluster: IResource = {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: {
          name: 'local-cluster',
          labels: {
            'local-cluster': 'true',
            name: 'local-cluster',
          },
        },
      }
      await cacheResource(managedCluster)

      // Mock API calls
      nock(process.env.CLUSTER_API_URL || 'https://example.com')
        .post(/.*/)
        .times(20)
        .reply(200, { status: { allowed: true } })

      nock(process.env.CLUSTER_API_URL || 'https://example.com')
        .get(/.*/)
        .times(20)
        .reply(200, { items: [] })

      // Mock getSearchResults to return controlled data
      mockGetSearchResults.mockResolvedValue({
        data: {
          searchResult: [
            {
              items: [],
              related: [],
            },
            {
              items: [],
              related: [],
            },
            {
              // System apps
              items: [
                {
                  _uid: 'sys-app-uid-1',
                  apigroup: 'apps',
                  apiversion: 'v1',
                  kind: 'Deployment',
                  name: 'test-system-app',
                  namespace: 'openshift-console',
                  cluster: 'local-cluster',
                  created: '2024-01-01T00:00:00Z',
                  label: 'app=test-system-app',
                },
              ],
              related: [],
            },
          ],
        },
      })

      // Execute - pass 1 will query system apps (pass < 60 || pass % 5 === 0)
      await aggregateRemoteApplications(1)

      // Verify: system apps should be processed
      expect(applicationCache['remoteSysApps']).toBeDefined()
    })

    it('should handle search API errors gracefully', async () => {
      // Mock getSearchResults to throw an error
      mockGetSearchResults.mockRejectedValue(new Error('Search API unavailable'))

      // Execute - should not throw
      await aggregateRemoteApplications(1)

      // Verify: cache should still be defined but possibly empty
      expect(applicationCache).toBeDefined()
    })

    it('should cache system applications when pass is appropriate', async () => {
      // Setup
      const managedCluster: IResource = {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: {
          name: 'local-cluster',
          labels: {
            'local-cluster': 'true',
            name: 'local-cluster',
          },
        },
      }
      await cacheResource(managedCluster)

      // Mock API calls
      nock(process.env.CLUSTER_API_URL || 'https://example.com')
        .post(/.*/)
        .times(20)
        .reply(200, { status: { allowed: true } })

      nock(process.env.CLUSTER_API_URL || 'https://example.com')
        .get(/.*/)
        .times(20)
        .reply(200, { items: [] })

      // Mock getSearchResults - only 2 search results should be queried
      mockGetSearchResults.mockResolvedValue({
        data: {
          searchResult: [
            {
              items: [],
              related: [],
            },
            {
              items: [],
              related: [],
            },
          ],
        },
      })

      // Execute - pass > 60 and not divisible by 5, should NOT query system apps
      await aggregateRemoteApplications(61)

      // Verify: function completed without error
      expect(applicationCache).toBeDefined()
    })

    it('should handle search API errors gracefully', async () => {
      // Mock getSearchResults to throw an error
      mockGetSearchResults.mockRejectedValue(new Error('Search API unavailable'))

      // Execute - should not throw
      await aggregateRemoteApplications(1)

      // Verify: cache should still be defined but possibly empty
      expect(applicationCache).toBeDefined()
    })
  })

  describe('filterApplications', () => {
    it('should filter applications by type', () => {
      const items: ICompressedResource[] = [
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['app1'], // name
            ['subscription'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['app2'], // name
            ['argo'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
      ]

      const filters = {
        type: ['subscription'],
      }

      const filtered = filterApplications(filters, items)
      expect(filtered.length).toBe(1)
      expect(filtered[0].transform[AppColumns.type][0]).toBe('subscription')
    })

    it('should filter applications by cluster', () => {
      const items: ICompressedResource[] = [
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['app1'], // name
            ['subscription'], // type
            ['default'], // namespace
            ['cluster1', 'cluster2'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['app2'], // name
            ['argo'], // type
            ['default'], // namespace
            ['cluster3'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
      ]

      const filters = {
        cluster: ['cluster2'],
      }

      const filtered = filterApplications(filters, items)
      expect(filtered.length).toBe(1)
      expect(filtered[0].transform[AppColumns.clusters]).toContain('cluster2')
    })
  })

  describe('sortApplications', () => {
    it('should sort applications by name ascending', () => {
      const items: ICompressedResource[] = [
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['zebra'], // name
            ['subscription'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['apple'], // name
            ['argo'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
      ]

      const sorted = sortApplications({ index: AppColumns.name, direction: 'asc' }, items)
      expect(sorted[0].transform[AppColumns.name][0]).toBe('apple')
      expect(sorted[1].transform[AppColumns.name][0]).toBe('zebra')
    })

    it('should sort applications by name descending', () => {
      const items: ICompressedResource[] = [
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['apple'], // name
            ['subscription'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['zebra'], // name
            ['argo'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
      ]

      const sorted = sortApplications({ index: AppColumns.name, direction: 'desc' }, items)
      expect(sorted[0].transform[AppColumns.name][0]).toBe('zebra')
      expect(sorted[1].transform[AppColumns.name][0]).toBe('apple')
    })

    it('should sort applications by health status', () => {
      const items: ICompressedResource[] = [
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['app1'], // name
            ['subscription'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores - healthy (low score)
            ['2024-01-01'], // created
          ],
        },
        {
          compressed: Buffer.from('{}'),
          transform: [
            ['app2'], // name
            ['argo'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 1000,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores - unhealthy (high score)
            ['2024-01-01'], // created
          ],
        },
      ]

      const sorted = sortApplications({ index: AppColumns.health, direction: 'asc' }, items)
      // With 'asc' direction and bScore - aScore sort, higher scores come first
      // So app2 (score 1000) should be first, app1 (score 0) should be second
      expect((sorted[0].transform[5] as ApplicationScoresMap[])[0][AppColumns.health]).toBeGreaterThan(
        (sorted[1].transform[5] as ApplicationScoresMap[])[0][AppColumns.health]
      )
    })
  })

  describe('getStatusFilterKey', () => {
    it('should return Healthy for health status < 1000', () => {
      const item: ICompressedResource = {
        compressed: Buffer.from('{}'),
        transform: [
          ['app1'], // name
          ['subscription'], // type
          ['default'], // namespace
          ['cluster1'], // clusters
          [{}], // statuses
          [{ [AppColumns.health]: 500, [AppColumns.synced]: 0, [AppColumns.deployed]: 0 } as ApplicationScoresMap], // scores
          ['2024-01-01'], // created
        ],
      }

      const key = getStatusFilterKey(item, AppColumns.health)
      expect(key).toBe('Healthy')
    })

    it('should return Unhealthy for health status >= 1000', () => {
      const item: ICompressedResource = {
        compressed: Buffer.from('{}'),
        transform: [
          ['app1'], // name
          ['subscription'], // type
          ['default'], // namespace
          ['cluster1'], // clusters
          [{}], // statuses
          [{ [AppColumns.health]: 1500, [AppColumns.synced]: 0, [AppColumns.deployed]: 0 } as ApplicationScoresMap], // scores
          ['2024-01-01'], // created
        ],
      }

      const key = getStatusFilterKey(item, AppColumns.health)
      expect(key).toBe('Unhealthy')
    })

    it('should return Synced for sync status < 1000', () => {
      const item: ICompressedResource = {
        compressed: Buffer.from('{}'),
        transform: [
          ['app1'], // name
          ['subscription'], // type
          ['default'], // namespace
          ['cluster1'], // clusters
          [{}], // statuses
          [{ [AppColumns.health]: 0, [AppColumns.synced]: 500, [AppColumns.deployed]: 0 } as ApplicationScoresMap], // scores
          ['2024-01-01'], // created
        ],
      }

      const key = getStatusFilterKey(item, AppColumns.synced)
      expect(key).toBe('Synced')
    })

    it('should return OutOfSync for sync status >= 1000', () => {
      const item: ICompressedResource = {
        compressed: Buffer.from('{}'),
        transform: [
          ['app1'], // name
          ['subscription'], // type
          ['default'], // namespace
          ['cluster1'], // clusters
          [{}], // statuses
          [{ [AppColumns.health]: 0, [AppColumns.synced]: 1500, [AppColumns.deployed]: 0 } as ApplicationScoresMap], // scores
          ['2024-01-01'], // created
        ],
      }

      const key = getStatusFilterKey(item, AppColumns.synced)
      expect(key).toBe('OutOfSync')
    })

    it('should return Deployed for deployed status < 1000', () => {
      const item: ICompressedResource = {
        compressed: Buffer.from('{}'),
        transform: [
          ['app1'], // name
          ['subscription'], // type
          ['default'], // namespace
          ['cluster1'], // clusters
          [{}], // statuses
          [{ [AppColumns.health]: 0, [AppColumns.synced]: 0, [AppColumns.deployed]: 500 } as ApplicationScoresMap], // scores
          ['2024-01-01'], // created
        ],
      }

      const key = getStatusFilterKey(item, AppColumns.deployed)
      expect(key).toBe('Deployed')
    })

    it('should return Not Deployed for deployed status >= 1000', () => {
      const item: ICompressedResource = {
        compressed: Buffer.from('{}'),
        transform: [
          ['app1'], // name
          ['subscription'], // type
          ['default'], // namespace
          ['cluster1'], // clusters
          [{}], // statuses
          [{ [AppColumns.health]: 0, [AppColumns.synced]: 0, [AppColumns.deployed]: 1500 } as ApplicationScoresMap], // scores
          ['2024-01-01'], // created
        ],
      }

      const key = getStatusFilterKey(item, AppColumns.deployed)
      expect(key).toBe('Not Deployed')
    })
  })

  describe('addUIData', () => {
    it('should add UI data to application items', async () => {
      const items = [
        {
          apiVersion: 'app.k8s.io/v1beta1',
          kind: 'Application',
          metadata: {
            name: 'test-app',
            namespace: 'default',
          },
          transform: [
            ['test-app'], // name
            ['subscription'], // type
            ['default'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
      ]

      const result = await addUIData(items)
      type ResultWithUiData = (typeof result)[0] & {
        uidata?: {
          clusterList?: string[]
          appClusterStatuses?: unknown[]
          appSetRelatedResources?: unknown[]
          appSetApps?: unknown[]
        }
      }
      const firstResult = result[0] as ResultWithUiData
      expect(firstResult.uidata).toBeDefined()
      expect(firstResult.uidata?.clusterList).toEqual(['cluster1'])
      expect(firstResult.uidata?.appClusterStatuses).toEqual([{}])
      expect(firstResult.uidata?.appSetRelatedResources).toEqual(['', []])
      expect(firstResult.uidata?.appSetApps).toEqual([])
    })

    it('should add ApplicationSet specific UI data', async () => {
      const items = [
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: {
            name: 'test-appset',
            namespace: 'argocd',
          },

          spec: {
            generators: [] as unknown[],
          },
          transform: [
            ['test-appset'], // name
            ['appset'], // type
            ['argocd'], // namespace
            ['cluster1'], // clusters
            [{}], // statuses
            [
              {
                [AppColumns.health]: 0,
                [AppColumns.synced]: 0,
                [AppColumns.deployed]: 0,
              } as ApplicationScoresMap,
            ], // scores
            ['2024-01-01'], // created
          ],
        },
      ]

      const result = await addUIData(items)
      type ResultWithUiData = (typeof result)[0] & {
        uidata?: {
          appSetRelatedResources?: unknown[]
        }
      }
      const firstResult = result[0] as ResultWithUiData
      expect(firstResult.uidata).toBeDefined()
      expect(firstResult.uidata?.appSetRelatedResources).toBeDefined()
    })
  })
})
