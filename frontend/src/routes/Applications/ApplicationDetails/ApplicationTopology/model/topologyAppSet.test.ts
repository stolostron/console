/* Copyright Contributors to the Open Cluster Management project */

import { nockSearch } from '../../../../../lib/nock-util'
import { getAppSetTopology, openArgoCDURL, openRouteURL } from './topologyAppSet'
import i18next, { TFunction } from 'i18next'
import type { ApplicationModel, ExtendedTopology } from '../types'
import type { ToolbarControl } from '../topology/components/TopologyToolbar'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'

const t: TFunction = i18next.t.bind(i18next)

// Mock the search client
jest.mock('../../../../Search/search-sdk/search-client', () => ({
  searchClient: {
    query: jest.fn(),
  },
}))

// Mock resources/utils
jest.mock('../../../../../resources/utils', () => ({
  getResource: jest.fn(() => ({
    promise: Promise.resolve({
      spec: {
        host: 'argocd.example.com',
        tls: { termination: 'edge' },
      },
    }),
  })),
  listNamespacedResources: jest.fn(() => ({
    promise: Promise.resolve([
      {
        metadata: {
          name: 'argocd-server',
          namespace: 'openshift-gitops',
          labels: {
            'app.kubernetes.io/part-of': 'argocd',
            'app.kubernetes.io/name': 'argocd-server',
          },
        },
        spec: {
          host: 'argocd.example.com',
          tls: { termination: 'edge' },
        },
      },
    ]),
  })),
}))

// Mock fleet-resource-request
jest.mock('../../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(() => Promise.resolve({ errorMessage: 'not available' })),
}))

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true })

const mockToolbarControl: ToolbarControl = {
  allClusters: undefined,
  activeClusters: undefined,
  setActiveClusters: jest.fn(),
  setAllClusters: jest.fn(),
  allApplications: undefined,
  activeApplications: undefined,
  setAllApplications: jest.fn(),
  setActiveApplications: jest.fn(),
  allTypes: undefined,
  activeTypes: undefined,
  setAllTypes: jest.fn(),
  setActiveTypes: jest.fn(),
}

const mockSearchClient = searchClient as jest.Mocked<typeof searchClient>

describe('openArgoCDEditor remote cluster', () => {
  const mockSearchQuery = {
    operationName: 'searchResultItemsAndRelatedItems',
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['route'] },
            { property: 'namespace', values: ['app1-ns'] },
            { property: 'cluster', values: ['cluster1'] },
            { property: 'label', values: ['app.kubernetes.io/part-of=argocd'] },
          ],
          relatedKinds: [],
        },
      ],
    },
    query:
      'query searchResultItemsAndRelatedItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    related {\n      kind\n      items\n      __typename\n    }\n    __typename\n  }\n}',
  }
  beforeEach(async () => {
    nockSearch(mockSearchQuery, { data: {} })
    mockWindowOpen.mockClear()
  })
  it('can open link on remote cluster', () => {
    expect(openArgoCDURL('cluster1', 'app1-ns', 'app1', () => {}, t, 'local-cluster')).toEqual(undefined)
  })
})

describe('openArgoCDEditor local cluster', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear()
  })

  it('can open link on local hub cluster', () => {
    const toggleLoading = jest.fn()
    expect(openArgoCDURL('local-cluster', 'openshift-gitops', 'test-app', toggleLoading, t, 'local-cluster')).toEqual(
      undefined
    )
    expect(toggleLoading).toHaveBeenCalledTimes(2)
  })
})

describe('openRouteURL', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear()
  })

  it('can open route URL on local hub cluster', () => {
    const toggleLoading = jest.fn()
    const routeObject = {
      name: 'my-route',
      namespace: 'my-namespace',
      cluster: 'local-cluster',
      kind: 'Route',
      apigroup: 'route.openshift.io',
      apiversion: 'v1',
    }
    openRouteURL(routeObject, toggleLoading, 'local-cluster')
    expect(toggleLoading).toHaveBeenCalledTimes(1)
  })

  it('handles route with missing properties', () => {
    const toggleLoading = jest.fn()
    const routeObject = {}
    openRouteURL(routeObject, toggleLoading, 'local-cluster')
    expect(toggleLoading).toHaveBeenCalledTimes(1)
  })
})

describe('getAppSetTopology', () => {
  const mockFleetResourceRequest = fleetResourceRequest as jest.MockedFunction<typeof fleetResourceRequest>

  beforeEach(() => {
    mockFleetResourceRequest.mockReset()
    mockSearchClient.query.mockReset()
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not available' } as any)
    mockSearchClient.query.mockResolvedValue({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'local-cluster/app-uid-1',
                name: 'test-appset-local-cluster',
                namespace: 'openshift-gitops',
                cluster: 'local-cluster',
                kind: 'Application',
              },
            ],
            related: [
              {
                kind: 'Deployment',
                items: [
                  {
                    _uid: 'local-cluster/deployment-uid-1',
                    _relatedUids: ['local-cluster/app-uid-1'],
                    name: 'nginx-deployment',
                    namespace: 'openshift-gitops',
                    cluster: 'local-cluster',
                    kind: 'Deployment',
                    apiversion: 'v1',
                    apigroup: 'apps',
                  },
                ],
              },
              {
                kind: 'Service',
                items: [
                  {
                    _uid: 'local-cluster/service-uid-1',
                    _relatedUids: ['local-cluster/app-uid-1'],
                    name: 'nginx-service',
                    namespace: 'openshift-gitops',
                    cluster: 'local-cluster',
                    kind: 'Service',
                    apiversion: 'v1',
                  },
                ],
              },
            ],
          },
        ],
      },
    })
  })

  it('should generate topology for ApplicationSet with placement', async () => {
    const application: ApplicationModel = {
      name: 'test-appset',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset',
          namespace: 'openshift-gitops',
        },
        spec: {
          generators: [
            {
              clusterDecisionResource: {
                labelSelector: {
                  matchLabels: {
                    'cluster.open-cluster-management.io/placement': 'test-placement',
                  },
                },
              },
            },
          ],
          template: {
            spec: {
              source: {
                path: 'apps/nginx',
              },
            },
          },
        },
      },
      placementDecision: {
        metadata: {
          name: 'test-placement',
          namespace: 'openshift-gitops',
        },
        status: {
          decisions: [{ clusterName: 'local-cluster' }],
        },
      } as any,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [{ metadata: { name: 'test-appset-local-cluster' }, spec: {} }] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()
    expect(result.nodes.length).toBeGreaterThan(0)

    // Verify ApplicationSet node exists
    const appSetNode = result.nodes.find((n) => n.type === 'applicationset')
    expect(appSetNode).toBeDefined()
    expect(appSetNode?.name).toBe('test-appset')

    // Verify Placement node exists
    const placementNode = result.nodes.find((n) => n.type === 'placementDecision')
    expect(placementNode).toBeDefined()

    // Verify cluster node exists
    const clusterNode = result.nodes.find((n) => n.type === 'cluster')
    expect(clusterNode).toBeDefined()

    // Verify toolbar callbacks were called
    expect(mockToolbarControl.setAllClusters).toHaveBeenCalledWith(['local-cluster'])
    expect(mockToolbarControl.setAllApplications).toHaveBeenCalled()
  })

  it('should generate topology for ApplicationSet without placement', async () => {
    const application: ApplicationModel = {
      name: 'test-appset-no-placement',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-no-placement',
          namespace: 'openshift-gitops',
        },
        spec: {
          generators: [
            {
              list: {
                elements: [{ cluster: 'local-cluster' }],
              },
            },
          ],
          template: {
            spec: {
              source: {
                path: 'apps/nginx',
              },
            },
          },
        },
      },
      placementDecision: undefined,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [{ metadata: { name: 'test-appset-no-placement-local-cluster' }, spec: {} }] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()

    // Verify ApplicationSet node exists
    const appSetNode = result.nodes.find((n) => n.type === 'applicationset')
    expect(appSetNode).toBeDefined()

    // Verify no Placement node when placement is undefined
    const placementNode = result.nodes.find((n) => n.type === 'placementDecision')
    expect(placementNode).toBeUndefined()
  })

  it('should set repo node type to chart when any source has chart, else git', async () => {
    const baseApp = (sources: unknown[]): ApplicationModel => ({
      name: 'test-appset-repo-type',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'test-appset-repo-type', namespace: 'openshift-gitops' },
        spec: {
          generators: [{ list: { elements: [{ cluster: 'local-cluster' }] } }],
          template: { spec: { sources } as any },
        },
      },
      placementDecision: undefined,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [{ metadata: { name: 'test-appset-repo-type-local-cluster' }, spec: {} }] as any,
    })

    const gitOnly = await getAppSetTopology(mockToolbarControl, baseApp([{ path: 'apps/nginx' }]), 'local-cluster')
    expect(gitOnly.nodes.find((n) => n.id?.startsWith('member--repo--'))?.type).toBe('git')

    const withHelm = await getAppSetTopology(
      mockToolbarControl,
      baseApp([{ path: 'apps/nginx' }, { chart: 'redis', repoURL: 'https://charts.example.com' }]),
      'local-cluster'
    )
    expect(withHelm.nodes.find((n) => n.id?.startsWith('member--repo--'))?.type).toBe('chart')
  })

  it('should handle ApplicationSet with multiple clusters', async () => {
    mockSearchClient.query.mockResolvedValue({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'local-cluster/app-uid-1',
                name: 'test-appset-local-cluster',
                namespace: 'openshift-gitops',
                cluster: 'local-cluster',
                kind: 'Application',
              },
              {
                _uid: 'managed-cluster-1/app-uid-2',
                name: 'test-appset-managed-cluster-1',
                namespace: 'openshift-gitops',
                cluster: 'managed-cluster-1',
                kind: 'Application',
              },
            ],
            related: [],
          },
        ],
      },
    })

    const application: ApplicationModel = {
      name: 'test-appset-multi',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-multi',
          namespace: 'openshift-gitops',
        },
        spec: {
          generators: [
            {
              clusterDecisionResource: {
                labelSelector: {
                  matchLabels: {
                    'cluster.open-cluster-management.io/placement': 'multi-placement',
                  },
                },
              },
            },
          ],
          template: {
            spec: {
              source: {
                path: 'apps/nginx',
              },
            },
          },
        },
      },
      placementDecision: {
        metadata: {
          name: 'multi-placement',
          namespace: 'openshift-gitops',
        },
        status: {
          decisions: [{ clusterName: 'local-cluster' }, { clusterName: 'managed-cluster-1' }],
        },
      } as any,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }, { name: 'managed-cluster-1' }],
      appSetApps: [
        { metadata: { name: 'test-appset-multi-local-cluster' }, spec: {} },
        { metadata: { name: 'test-appset-multi-managed-cluster-1' }, spec: {} },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()

    // Verify ApplicationSet node has correct cluster info
    const appSetNode = result.nodes.find((n) => n.type === 'applicationset')
    expect(appSetNode).toBeDefined()
    expect(appSetNode?.specs?.clusterNames).toContain('local-cluster')
    expect(appSetNode?.specs?.clusterNames).toContain('managed-cluster-1')
    expect((appSetNode?.specs?.allClusters as any)?.remoteCount).toBe(1)
    expect((appSetNode?.specs?.allClusters as any)?.isLocal).toBe(true)

    // Verify setAllClusters was called with both clusters
    expect(mockToolbarControl.setAllClusters).toHaveBeenCalledWith(['local-cluster', 'managed-cluster-1'])
  })

  it('should not duplicate cluster-scoped resources when deployed to multiple clusters', async () => {
    // Push model with cluster-scoped resources (CRDs) deployed to two clusters
    mockSearchClient.query.mockResolvedValue({
      loading: false,
      networkStatus: 7,
      data: { searchResult: [] },
    })

    const application: ApplicationModel = {
      name: 'test-appset-crd-dedup',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'test-appset-crd-dedup', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }, { name: 'managed-cluster-1' }],
      appSetApps: [
        {
          metadata: { name: 'test-appset-crd-dedup-local-cluster' },
          spec: {},
          status: {
            resources: [
              {
                kind: 'CustomResourceDefinition',
                name: 'widgets.example.com',
                version: 'v1',
                group: 'apiextensions.k8s.io',
              },
              { kind: 'Deployment', name: 'my-app', namespace: 'default', version: 'v1', group: 'apps' },
            ],
          },
        },
        {
          metadata: { name: 'test-appset-crd-dedup-managed-cluster-1' },
          spec: {},
          status: {
            resources: [
              {
                kind: 'CustomResourceDefinition',
                name: 'widgets.example.com',
                version: 'v1',
                group: 'apiextensions.k8s.io',
              },
              { kind: 'Deployment', name: 'my-app', namespace: 'default', version: 'v1', group: 'apps' },
            ],
          },
        },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // CRD should appear exactly once (deduplicated across clusters)
    const crdNodes = result.nodes.filter(
      (n) => n.type === 'customresourcedefinition' && n.name === 'widgets.example.com'
    )
    expect(crdNodes).toHaveLength(1)

    // The single CRD node should have both clusters in clustersNames
    const crdNode = crdNodes[0]
    expect((crdNode as any).specs.clustersNames).toContain('local-cluster')
    expect((crdNode as any).specs.clustersNames).toContain('managed-cluster-1')

    // Namespaced Deployment should still have separate entries per cluster
    const deployNodes = result.nodes.filter((n) => n.type === 'deployment' && n.name === 'my-app')
    expect(deployNodes).toHaveLength(2)
    const deployIds = deployNodes.map((n) => n.id)
    expect(deployIds[0]).not.toEqual(deployIds[1])
  })

  it('should handle ApplicationSet with app status information', async () => {
    const application: ApplicationModel = {
      name: 'test-appset-status',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-status',
          namespace: 'openshift-gitops',
        },
        spec: {
          generators: [
            {
              clusterDecisionResource: {
                labelSelector: {
                  matchLabels: {
                    'cluster.open-cluster-management.io/placement': 'status-placement',
                  },
                },
              },
            },
          ],
        },
      },
      placementDecision: {
        metadata: {
          name: 'status-placement',
          namespace: 'openshift-gitops',
        },
        status: {
          decisions: [{ clusterName: 'local-cluster' }],
        },
      } as any,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [{ metadata: { name: 'test-appset-status-local-cluster' }, spec: {} }] as any,
      appStatusByNameMap: {
        'test-appset-status-local-cluster': {
          health: { status: 'Degraded' },
          sync: { status: 'OutOfSync' },
        },
      },
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // Verify ApplicationSet node contains status info
    const appSetNode = result.nodes.find((n) => n.type === 'applicationset')
    expect(appSetNode?.specs?.appStatusByNameMap).toBeDefined()
  })

  it('should handle empty search results gracefully', async () => {
    mockSearchClient.query.mockResolvedValue({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [],
      },
    })

    const application: ApplicationModel = {
      name: 'test-appset-empty',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-empty',
          namespace: 'openshift-gitops',
        },
        spec: {},
      },
      placementDecision: undefined,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [],
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()

    // Should still have ApplicationSet and cluster nodes
    const appSetNode = result.nodes.find((n) => n.type === 'applicationset')
    expect(appSetNode).toBeDefined()
  })

  it('should fall back to app resources when search has no results', async () => {
    mockSearchClient.query.mockResolvedValue({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [],
      },
    })

    const application: ApplicationModel = {
      name: 'test-appset-fallback',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-fallback',
          namespace: 'openshift-gitops',
        },
        spec: {},
      },
      placementDecision: undefined,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'managed-cluster-1', url: 'https://api.managed.example.com' }],
      appSetApps: [
        {
          metadata: { name: 'test-appset-fallback-managed-cluster-1' },
          spec: { destination: { server: 'https://api.managed.example.com' } },
          status: {
            resources: [{ kind: 'Deployment', name: 'nginx-deployment', namespace: 'openshift-gitops' }],
          },
        },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    const deployNode = result.nodes.find((n) => n.type === 'deployment' && n.name === 'nginx-deployment')
    expect(deployNode).toBeDefined()
  })

  it('should handle ArgoCD pull model targeting local cluster', async () => {
    const application: ApplicationModel = {
      name: 'test-appset-pullmodel',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-pullmodel',
          namespace: 'openshift-gitops',
        },
        spec: {
          generators: [
            {
              clusterDecisionResource: {
                labelSelector: {
                  matchLabels: {
                    'cluster.open-cluster-management.io/placement': 'pullmodel-placement',
                  },
                },
              },
            },
          ],
        },
      },
      placementDecision: {
        metadata: {
          name: 'pullmodel-placement',
          namespace: 'openshift-gitops',
        },
        status: {
          decisions: [{ clusterName: 'local-cluster' }],
        },
      } as any,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [{ metadata: { name: 'test-appset-pullmodel-local-cluster' }, spec: {} }] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // Verify the pull model flag is set on the ApplicationSet node
    const appSetNode = result.nodes.find((n) => n.type === 'applicationset') as any
    expect(appSetNode).toBeDefined()
    expect(appSetNode.isArgoCDPullModelTargetLocalCluster).toBe(true)
  })

  it('should include cluster-scoped resources from remote Application status.resources for pull model', async () => {
    mockFleetResourceRequest.mockResolvedValueOnce({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: { name: 'test-pullmodel-crd-managed-cluster-1', namespace: 'openshift-gitops' },
      status: {
        resources: [
          {
            kind: 'Deployment',
            name: 'my-app',
            namespace: 'default',
            version: 'v1',
            group: 'apps',
            health: { status: 'Healthy' },
          },
          {
            kind: 'CustomResourceDefinition',
            name: 'widgets.example.com',
            version: 'v1',
            group: 'apiextensions.k8s.io',
            health: { status: 'Healthy' },
          },
          {
            kind: 'StorageClass',
            name: 'fast-storage',
            version: 'v1',
            group: 'storage.k8s.io',
            health: { status: 'Healthy' },
          },
        ],
      },
    } as any)

    // Search returns only the Deployment as a related resource (CRD and StorageClass don't exist yet)
    mockSearchClient.query.mockResolvedValueOnce({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'app-uid-1',
                name: 'test-pullmodel-crd-managed-cluster-1',
                namespace: 'openshift-gitops',
                cluster: 'managed-cluster-1',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
            ],
            related: [
              {
                kind: 'Deployment',
                items: [
                  {
                    _uid: 'deploy-uid-1',
                    _relatedUids: ['app-uid-1'],
                    name: 'my-app',
                    namespace: 'default',
                    kind: 'Deployment',
                    cluster: 'managed-cluster-1',
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    const application: ApplicationModel = {
      name: 'test-pullmodel-crd',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'test-pullmodel-crd', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'managed-cluster-1' }],
      appSetApps: [{ metadata: { name: 'test-pullmodel-crd-managed-cluster-1' }, spec: {} }] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // The Deployment found via search should be in topology
    const deployNode = result.nodes.find((n) => n.type === 'deployment' && n.name === 'my-app')
    expect(deployNode).toBeDefined()

    // The CRD from status.resources should also be in topology even though not found in search
    const crdNode = result.nodes.find((n) => n.type === 'customresourcedefinition' && n.name === 'widgets.example.com')
    expect(crdNode).toBeDefined()

    // The StorageClass from status.resources should also be in topology
    const scNode = result.nodes.find((n) => n.type === 'storageclass' && n.name === 'fast-storage')
    expect(scNode).toBeDefined()
  })

  it('should show resources with healthy status as running for pull model', async () => {
    mockFleetResourceRequest.mockResolvedValueOnce({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: { name: 'test-pullmodel-status-managed-cluster-1', namespace: 'openshift-gitops' },
      status: {
        resources: [
          {
            kind: 'StorageClass',
            name: 'fast-storage',
            version: 'v1',
            group: 'storage.k8s.io',
            health: { status: 'Healthy' },
          },
          {
            kind: 'CustomResourceDefinition',
            name: 'missing.example.com',
            version: 'v1',
            group: 'apiextensions.k8s.io',
            health: { status: 'Missing' },
          },
        ],
      },
    } as any)

    // Search returns no related resources (nothing exists yet)
    mockSearchClient.query.mockResolvedValueOnce({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'app-uid-2',
                name: 'test-pullmodel-status-managed-cluster-1',
                namespace: 'openshift-gitops',
                cluster: 'managed-cluster-1',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
            ],
            related: [],
          },
        ],
      },
    })

    const application: ApplicationModel = {
      name: 'test-pullmodel-status',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'test-pullmodel-status', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'managed-cluster-1' }],
      appSetApps: [{ metadata: { name: 'test-pullmodel-status-managed-cluster-1' }, spec: {} }] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // Healthy StorageClass should appear with 'running' status mapped from health.status
    const scNode = result.nodes.find((n) => n.type === 'storageclass' && n.name === 'fast-storage')
    expect(scNode).toBeDefined()
    expect((scNode as any)?.specs?.raw?.status).toBe('running')

    // Missing CRD should appear in topology with pending status
    const crdNode = result.nodes.find((n) => n.type === 'customresourcedefinition' && n.name === 'missing.example.com')
    expect(crdNode).toBeDefined()
    expect((crdNode as any)?.specs?.raw?.status).toBe('pending')
  })

  it('should filter by active clusters when provided', async () => {
    const toolbarWithActiveClusters: ToolbarControl = {
      ...mockToolbarControl,
      activeClusters: ['local-cluster'],
      setActiveClusters: jest.fn(),
      setAllClusters: jest.fn(),
      setAllApplications: jest.fn(),
      setActiveApplications: jest.fn(),
      setAllTypes: jest.fn(),
      setActiveTypes: jest.fn(),
    }

    const application: ApplicationModel = {
      name: 'test-appset-filtered',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-filtered',
          namespace: 'openshift-gitops',
        },
        spec: {},
      },
      placementDecision: undefined,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }, { name: 'managed-cluster-1' }],
      appSetApps: [{ metadata: { name: 'test-appset-filtered-local-cluster' }, spec: {} }] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(toolbarWithActiveClusters, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()
  })

  it('should filter by active resource types when provided', async () => {
    const toolbarWithActiveTypes: ToolbarControl = {
      ...mockToolbarControl,
      activeTypes: ['deployment'],
      setActiveClusters: jest.fn(),
      setAllClusters: jest.fn(),
      setAllApplications: jest.fn(),
      setActiveApplications: jest.fn(),
      setAllTypes: jest.fn(),
      setActiveTypes: jest.fn(),
    }

    const application: ApplicationModel = {
      name: 'test-appset-type-filtered',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-type-filtered',
          namespace: 'openshift-gitops',
        },
        spec: {},
      },
      placementDecision: undefined,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [{ metadata: { name: 'test-appset-type-filtered-local-cluster' }, spec: {} }] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(toolbarWithActiveTypes, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()
    expect(toolbarWithActiveTypes.setAllTypes).toHaveBeenCalled()
  })

  it('should fetch resources individually for pull model with non-uniform sources (matrix generator)', async () => {
    // Two different apps fetched individually due to non-uniform sources
    mockFleetResourceRequest
      .mockResolvedValueOnce({
        status: {
          resources: [
            { kind: 'Deployment', name: 'app-a', namespace: 'default', version: 'v1', group: 'apps' },
            {
              kind: 'CustomResourceDefinition',
              name: 'crds-a.example.com',
              version: 'v1',
              group: 'apiextensions.k8s.io',
              health: { status: 'Healthy' },
            },
          ],
        },
      } as any)
      .mockResolvedValueOnce({
        status: {
          resources: [
            { kind: 'Deployment', name: 'app-b', namespace: 'other', version: 'v1', group: 'apps' },
            {
              kind: 'StorageClass',
              name: 'sc-b',
              version: 'v1',
              group: 'storage.k8s.io',
              health: { status: 'Healthy' },
            },
          ],
        },
      } as any)

    mockSearchClient.query.mockResolvedValueOnce({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'uid-1',
                name: 'matrix-app-cluster-1',
                namespace: 'openshift-gitops',
                cluster: 'cluster-1',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
              {
                _uid: 'uid-2',
                name: 'matrix-app-cluster-2',
                namespace: 'openshift-gitops',
                cluster: 'cluster-2',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
            ],
            related: [],
          },
        ],
      },
    })

    const application: ApplicationModel = {
      name: 'matrix-app',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'matrix-app', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'cluster-1' }, { name: 'cluster-2' }],
      appSetApps: [
        {
          metadata: { name: 'matrix-app-cluster-1' },
          spec: { source: { repoURL: 'https://git.io/repo', path: 'path-a', targetRevision: 'main' } },
        },
        {
          metadata: { name: 'matrix-app-cluster-2' },
          spec: { source: { repoURL: 'https://git.io/repo', path: 'path-b', targetRevision: 'main' } },
        },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // Both apps should have been fetched individually since sources differ
    expect(mockFleetResourceRequest).toHaveBeenCalledTimes(2)
    // Resources from both apps should appear in topology
    const crdNode = result.nodes.find((n) => n.type === 'customresourcedefinition' && n.name === 'crds-a.example.com')
    expect(crdNode).toBeDefined()
    const scNode = result.nodes.find((n) => n.type === 'storageclass' && n.name === 'sc-b')
    expect(scNode).toBeDefined()
  })

  it('should handle pull model when fleet request fails and no local resources available', async () => {
    mockFleetResourceRequest.mockResolvedValueOnce({ errorMessage: 'cluster unavailable' } as any)

    mockSearchClient.query.mockResolvedValueOnce({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'uid-fail',
                name: 'fail-app-cluster-1',
                namespace: 'openshift-gitops',
                cluster: 'cluster-1',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
            ],
            related: [],
          },
        ],
      },
    })

    const application: ApplicationModel = {
      name: 'fail-app',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'fail-app', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'cluster-1' }],
      appSetApps: [
        {
          metadata: { name: 'fail-app-cluster-1' },
          spec: { source: { repoURL: 'https://git.io/r', path: 'p', targetRevision: 'main' } },
        },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // Should still produce a valid topology (just without the expected resources from fleet)
    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()
  })

  it('should handle pull model with no appSetApps gracefully', async () => {
    const application: ApplicationModel = {
      name: 'empty-app',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'empty-app', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'cluster-1' }],
      appSetApps: [] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()
  })

  it('should fetch resources via fleet request for uniform pull-model apps', async () => {
    mockFleetResourceRequest.mockResolvedValueOnce({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: { name: 'hub-app-managed-1', namespace: 'openshift-gitops' },
      status: {
        resources: [
          {
            kind: 'StorageClass',
            name: 'local-sc',
            version: 'v1',
            group: 'storage.k8s.io',
            health: { status: 'Healthy' },
          },
        ],
      },
    } as any)

    mockSearchClient.query.mockResolvedValueOnce({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'uid-hub',
                name: 'hub-app-managed-1',
                namespace: 'openshift-gitops',
                cluster: 'managed-1',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
            ],
            related: [],
          },
        ],
      },
    })

    const application: ApplicationModel = {
      name: 'hub-app',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'hub-app', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'managed-1' }],
      appSetApps: [
        {
          metadata: { name: 'hub-app-managed-1' },
          spec: { source: { repoURL: 'https://git.io/repo', path: 'deploy', targetRevision: 'main' } },
        },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    expect(mockFleetResourceRequest).toHaveBeenCalledTimes(1)
    const scNode = result.nodes.find((n) => n.type === 'storageclass' && n.name === 'local-sc')
    expect(scNode).toBeDefined()
  })

  it('should handle pull model with sources array in spec for uniformity check', async () => {
    mockFleetResourceRequest.mockResolvedValueOnce({
      status: {
        resources: [
          {
            kind: 'Deployment',
            name: 'multi-src-deploy',
            namespace: 'default',
            version: 'v1',
            group: 'apps',
            health: { status: 'Healthy' },
          },
        ],
      },
    } as any)

    mockSearchClient.query.mockResolvedValueOnce({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'uid-ms1',
                name: 'multi-src-cluster-1',
                namespace: 'openshift-gitops',
                cluster: 'cluster-1',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
              {
                _uid: 'uid-ms2',
                name: 'multi-src-cluster-2',
                namespace: 'openshift-gitops',
                cluster: 'cluster-2',
                kind: 'Application',
                apigroup: 'argoproj.io',
              },
            ],
            related: [],
          },
        ],
      },
    })

    const application: ApplicationModel = {
      name: 'multi-src',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: 'multi-src', namespace: 'openshift-gitops' },
        spec: { generators: [{}] },
      },
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: true,
      appSetClusters: [{ name: 'cluster-1' }, { name: 'cluster-2' }],
      appSetApps: [
        {
          metadata: { name: 'multi-src-cluster-1' },
          spec: { sources: [{ repoURL: 'https://git.io/repo', path: 'deploy', targetRevision: 'main' }] },
        },
        {
          metadata: { name: 'multi-src-cluster-2' },
          spec: { sources: [{ repoURL: 'https://git.io/repo', path: 'deploy', targetRevision: 'main' }] },
        },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(mockToolbarControl, application, 'local-cluster')

    // Uniform sources array — only one fleet request needed
    expect(mockFleetResourceRequest).toHaveBeenCalledTimes(1)
    expect(result.nodes.find((n) => n.type === 'deployment' && n.name === 'multi-src-deploy')).toBeDefined()
  })

  it('should filter by active applications when provided', async () => {
    mockSearchClient.query.mockResolvedValue({
      loading: false,
      networkStatus: 7,
      data: {
        searchResult: [
          {
            items: [
              {
                _uid: 'local-cluster/app-uid-1',
                name: 'test-appset-app-filter-local-cluster-app1',
                namespace: 'openshift-gitops',
                cluster: 'local-cluster',
                kind: 'Application',
              },
              {
                _uid: 'local-cluster/app-uid-2',
                name: 'test-appset-app-filter-local-cluster-app2',
                namespace: 'openshift-gitops',
                cluster: 'local-cluster',
                kind: 'Application',
              },
            ],
            related: [],
          },
        ],
      },
    })

    const toolbarWithActiveApps: ToolbarControl = {
      ...mockToolbarControl,
      activeApplications: ['app1'],
      setActiveClusters: jest.fn(),
      setAllClusters: jest.fn(),
      setAllApplications: jest.fn(),
      setActiveApplications: jest.fn(),
      setAllTypes: jest.fn(),
      setActiveTypes: jest.fn(),
    }

    const application: ApplicationModel = {
      name: 'test-appset-app-filter',
      namespace: 'openshift-gitops',
      app: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'test-appset-app-filter',
          namespace: 'openshift-gitops',
        },
        spec: {},
      },
      placementDecision: undefined,
      isArgoApp: false,
      isAppSet: true,
      isOCPApp: false,
      isFluxApp: false,
      isAppSetPullModel: false,
      appSetClusters: [{ name: 'local-cluster' }],
      appSetApps: [
        { metadata: { name: 'test-appset-app-filter-local-cluster-app1' }, spec: {} },
        { metadata: { name: 'test-appset-app-filter-local-cluster-app2' }, spec: {} },
      ] as any,
    }

    const result: ExtendedTopology = await getAppSetTopology(toolbarWithActiveApps, application, 'local-cluster')

    expect(result.nodes).toBeDefined()
    expect(result.links).toBeDefined()
    expect(toolbarWithActiveApps.setAllApplications).toHaveBeenCalled()
  })
})
