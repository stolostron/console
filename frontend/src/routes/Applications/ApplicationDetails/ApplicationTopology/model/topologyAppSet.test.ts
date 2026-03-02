/* Copyright Contributors to the Open Cluster Management project */

import { nockSearch } from '../../../../../lib/nock-util'
import { getAppSetTopology, openArgoCDEditor, openRouteURL } from './topologyAppSet'
import i18next, { TFunction } from 'i18next'
import type { ApplicationModel, ExtendedTopology } from '../types'
import type { ToolbarControl } from '../topology/components/TopologyToolbar'
import { searchClient } from '../../../../Search/search-sdk/search-client'

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
    expect(openArgoCDEditor('cluster1', 'app1-ns', 'app1', () => {}, t, 'local-cluster')).toEqual(undefined)
  })
})

describe('openArgoCDEditor local cluster', () => {
  beforeEach(() => {
    mockWindowOpen.mockClear()
  })

  it('can open link on local hub cluster', () => {
    const toggleLoading = jest.fn()
    expect(
      openArgoCDEditor('local-cluster', 'openshift-gitops', 'test-app', toggleLoading, t, 'local-cluster')
    ).toEqual(undefined)
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
  beforeEach(() => {
    jest.clearAllMocks()
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
      placement: {
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
    const placementNode = result.nodes.find((n) => n.type === 'placement')
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
      placement: undefined,
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
    const placementNode = result.nodes.find((n) => n.type === 'placement')
    expect(placementNode).toBeUndefined()
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
      placement: {
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
      placement: {
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
      placement: undefined,
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
      placement: undefined,
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
      placement: {
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
      placement: undefined,
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
      placement: undefined,
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
      placement: undefined,
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
