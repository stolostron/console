/* Copyright Contributors to the Open Cluster Management project */

import { getTopology, getDiagramElements, processNodeData, evaluateSingleAnd, getTopologyElements } from './topology'
import type {
  Topology,
  TopologyNode,
  TopologyResourceMap,
  ClusterGroupingState,
  HelmReleasesState,
  ResourceStatuses,
  ManagedCluster,
  ArgoData,
  ApplicationModel,
} from '../types'
import type { ToolbarControl } from '../topology/components/TopologyToolbar'

// Mock the topology generator functions
jest.mock('./topologyArgo', () => ({
  getArgoTopology: jest.fn(),
}))

jest.mock('./topologyAppSet', () => ({
  getAppSetTopology: jest.fn(),
}))

jest.mock('./topologyOCPFluxApp', () => ({
  getOCPFluxAppTopology: jest.fn(),
}))

jest.mock('./topologySubscription', () => ({
  getSubscriptionTopology: jest.fn(),
}))

jest.mock('./topologyDetails', () => ({
  addDiagramDetails: jest.fn(),
}))

jest.mock('./computeStatuses', () => ({
  computeNodeStatus: jest.fn(),
}))

jest.mock('../helpers/diagram-helpers-utils', () => ({
  getClusterName: jest.fn().mockReturnValue('cluster1'),
  isDeployableResource: jest.fn().mockReturnValue(false),
}))

import { getArgoTopology } from './topologyArgo'
import { getAppSetTopology } from './topologyAppSet'
import { getOCPFluxAppTopology } from './topologyOCPFluxApp'
import { getSubscriptionTopology } from './topologySubscription'
import { addDiagramDetails } from './topologyDetails'
import { computeNodeStatus } from './computeStatuses'
import { getClusterName, isDeployableResource } from '../helpers/diagram-helpers-utils'

// Test fixtures
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

const mockManagedClusters: ManagedCluster[] = [
  { name: 'local-cluster', status: 'ready' },
  { name: 'cluster1', status: 'ready' },
]

const mockArgoData: ArgoData = {
  topology: undefined,
  cluster: 'local-cluster',
}

const mockTopology: Topology = {
  nodes: [
    {
      name: 'test-app',
      namespace: 'default',
      type: 'application',
      id: 'application--test-app',
      uid: 'test-uid',
      specs: {
        channels: ['channel1', 'channel2'],
        activeChannel: 'channel1',
      },
    },
    {
      name: 'test-deployment',
      namespace: 'default',
      type: 'deployment',
      id: 'member--deployable--deployment--test-deployment',
      uid: 'deployment-uid',
      specs: {},
    },
  ],
  links: [
    {
      from: { uid: 'test-uid' },
      to: { uid: 'deployment-uid' },
      type: 'deploys',
    },
  ],
  hubClusterName: 'local-cluster',
}

const mockResourceStatuses: ResourceStatuses = {
  data: {
    searchResult: [
      {
        name: 'test-app',
        namespace: 'default',
        cluster: 'cluster1',
        kind: 'Application',
        related: [],
      },
    ],
  },
}

const mockTranslator = (key: string) => key

describe('topology', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getTopology', () => {
    it('should return undefined when application is null', async () => {
      const result = await getTopology(
        mockToolbarControl,
        null,
        mockManagedClusters,
        'local-cluster',
        {},
        mockArgoData,
        []
      )

      expect(result).toBeUndefined()
    })

    it('should call getArgoTopology for Argo applications', async () => {
      const argoApp: ApplicationModel = {
        name: 'argo-app',
        namespace: 'default',
        app: {},
        isArgoApp: true,
        isAppSet: false,
        isOCPApp: false,
        isFluxApp: false,
        isAppSetPullModel: false,
      }

      const expectedTopology: Topology = {
        nodes: [],
        links: [],
      }
      ;(getArgoTopology as jest.Mock).mockReturnValue(expectedTopology)

      const result = await getTopology(
        mockToolbarControl,
        argoApp,
        mockManagedClusters,
        'local-cluster',
        {},
        mockArgoData,
        []
      )

      expect(getArgoTopology).toHaveBeenCalledWith(
        mockToolbarControl,
        argoApp,
        mockArgoData,
        mockManagedClusters,
        'local-cluster',
        []
      )
      expect(result).toBeDefined()
      expect(result?.hubClusterName).toBe('local-cluster')
    })

    it('should call getAppSetTopology for ApplicationSet applications', async () => {
      const appSetApp: ApplicationModel = {
        name: 'appset-app',
        namespace: 'default',
        app: {},
        isArgoApp: false,
        isAppSet: true,
        isOCPApp: false,
        isFluxApp: false,
        isAppSetPullModel: false,
      }

      const expectedTopology: Topology = {
        nodes: [],
        links: [],
      }
      ;(getAppSetTopology as jest.Mock).mockResolvedValue(expectedTopology)

      const result = await getTopology(
        mockToolbarControl,
        appSetApp,
        mockManagedClusters,
        'local-cluster',
        {},
        mockArgoData,
        []
      )

      expect(getAppSetTopology).toHaveBeenCalledWith(mockToolbarControl, appSetApp, 'local-cluster')
      expect(result).toBeDefined()
      expect(result?.hubClusterName).toBe('local-cluster')
    })

    it('should call getOCPFluxAppTopology for OCP applications', async () => {
      const ocpApp: ApplicationModel = {
        name: 'ocp-app',
        namespace: 'default',
        app: {},
        isArgoApp: false,
        isAppSet: false,
        isOCPApp: true,
        isFluxApp: false,
        isAppSetPullModel: false,
      }

      const expectedTopology: Topology = {
        nodes: [],
        links: [],
      }
      ;(getOCPFluxAppTopology as jest.Mock).mockResolvedValue(expectedTopology)

      const result = await getTopology(
        mockToolbarControl,
        ocpApp,
        mockManagedClusters,
        'local-cluster',
        {},
        mockArgoData,
        []
      )

      expect(getOCPFluxAppTopology).toHaveBeenCalledWith(mockToolbarControl, ocpApp, 'local-cluster')
      expect(result).toBeDefined()
      expect(result?.hubClusterName).toBe('local-cluster')
    })

    it('should call getOCPFluxAppTopology for Flux applications', async () => {
      const fluxApp: ApplicationModel = {
        name: 'flux-app',
        namespace: 'default',
        app: {},
        isArgoApp: false,
        isAppSet: false,
        isOCPApp: false,
        isFluxApp: true,
        isAppSetPullModel: false,
      }

      const expectedTopology: Topology = {
        nodes: [],
        links: [],
      }
      ;(getOCPFluxAppTopology as jest.Mock).mockResolvedValue(expectedTopology)

      const result = await getTopology(
        mockToolbarControl,
        fluxApp,
        mockManagedClusters,
        'local-cluster',
        {},
        mockArgoData,
        []
      )

      expect(getOCPFluxAppTopology).toHaveBeenCalledWith(mockToolbarControl, fluxApp, 'local-cluster')
      expect(result).toBeDefined()
      expect(result?.hubClusterName).toBe('local-cluster')
    })

    it('should call getSubscriptionTopology for subscription-based applications', async () => {
      const subApp: ApplicationModel = {
        name: 'sub-app',
        namespace: 'default',
        app: {},
        isArgoApp: false,
        isAppSet: false,
        isOCPApp: false,
        isFluxApp: false,
        isAppSetPullModel: false,
      }

      const relatedResources = { key: 'value' }
      const expectedTopology: Topology = {
        nodes: [],
        links: [],
      }
      ;(getSubscriptionTopology as jest.Mock).mockReturnValue(expectedTopology)

      const result = await getTopology(
        mockToolbarControl,
        subApp,
        mockManagedClusters,
        'local-cluster',
        relatedResources,
        mockArgoData,
        []
      )

      expect(getSubscriptionTopology).toHaveBeenCalledWith(
        subApp,
        mockManagedClusters,
        relatedResources,
        'local-cluster'
      )
      expect(result).toBeDefined()
      expect(result?.hubClusterName).toBe('local-cluster')
    })
  })

  describe('getDiagramElements', () => {
    it('should return diagram elements with nodes and links', () => {
      const result = getDiagramElements(mockTopology, null, false, mockTranslator)

      expect(result).toBeDefined()
      expect(result.nodes).toBeDefined()
      expect(result.links).toBeDefined()
    })

    it('should extract channel information from application nodes', () => {
      const topologyWithChannels: Topology = {
        nodes: [
          {
            name: 'test-app',
            namespace: 'default',
            type: 'application',
            id: 'application--test-app',
            uid: 'test-uid',
            specs: {
              channels: ['ns1/channel1//path1', 'ns2/channel2//path2'],
              activeChannel: 'ns1/channel1//path1',
            },
          },
        ],
        links: [],
        hubClusterName: 'local-cluster',
      }

      const result = getDiagramElements(topologyWithChannels, null, false, mockTranslator)

      expect(result.channels).toEqual(['ns1/channel1//path1', 'ns2/channel2//path2'])
      expect(result.activeChannel).toBe('ns1/channel1//path1')
    })

    it('should set default active channel when not specified', () => {
      const topologyWithoutActiveChannel: Topology = {
        nodes: [
          {
            name: 'test-app',
            namespace: 'default',
            type: 'application',
            id: 'application--test-app',
            uid: 'test-uid',
            specs: {
              channels: ['channel1', 'channel2'],
            },
          },
        ],
        links: [],
        hubClusterName: 'local-cluster',
      }

      const result = getDiagramElements(topologyWithoutActiveChannel, null, false, mockTranslator)

      expect(result.activeChannel).toBe('channel1')
    })

    it('should filter out __ALL__/__ALL__ channel entry', () => {
      const topologyWithAllChannel: Topology = {
        nodes: [
          {
            name: 'test-app',
            namespace: 'default',
            type: 'application',
            id: 'application--test-app',
            uid: 'test-uid',
            specs: {
              channels: ['__ALL__/__ALL__//__ALL__/__ALL__', 'channel1'],
            },
          },
        ],
        links: [],
        hubClusterName: 'local-cluster',
      }

      const result = getDiagramElements(topologyWithAllChannel, null, false, mockTranslator)

      expect(result.activeChannel).toBe('channel1')
    })

    it('should call addDiagramDetails and computeNodeStatus when resourceStatuses provided', () => {
      const result = getDiagramElements(mockTopology, mockResourceStatuses, true, mockTranslator)

      expect(addDiagramDetails).toHaveBeenCalled()
      expect(computeNodeStatus).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should not call status functions when resourceStatuses is null', () => {
      const result = getDiagramElements(mockTopology, null, false, mockTranslator)

      expect(addDiagramDetails).not.toHaveBeenCalled()
      expect(computeNodeStatus).not.toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('processNodeData', () => {
    it('should add subscription nodes to resource map by name', () => {
      const subscriptionNode: TopologyNode = {
        name: 'test-subscription',
        namespace: 'default',
        type: 'subscription',
        id: 'subscription--test-subscription',
        uid: 'sub-uid',
        specs: {},
      }

      const resourceMap: TopologyResourceMap = {}
      const isClusterGrouped: ClusterGroupingState = { value: false }
      const hasHelmReleases: HelmReleasesState = { value: false }

      processNodeData(subscriptionNode, resourceMap, isClusterGrouped, hasHelmReleases, mockTopology)

      expect(resourceMap['test-subscription']).toBe(subscriptionNode)
    })

    it('should detect Helm releases from subscription annotations', () => {
      const helmSubscriptionNode: TopologyNode = {
        name: 'helm-subscription',
        namespace: 'default',
        type: 'subscription',
        id: 'subscription--helm-subscription',
        uid: 'helm-sub-uid',
        specs: {
          raw: {
            metadata: {
              annotations: {
                'apps.open-cluster-management.io/topo': 'helmchart/chart-name',
              },
            },
          },
        },
      }

      const resourceMap: TopologyResourceMap = {}
      const isClusterGrouped: ClusterGroupingState = { value: false }
      const hasHelmReleases: HelmReleasesState = { value: false }

      processNodeData(helmSubscriptionNode, resourceMap, isClusterGrouped, hasHelmReleases, mockTopology)

      expect(hasHelmReleases.value).toBe(true)
    })

    it('should add non-subscription nodes with cluster-specific keys', () => {
      const deploymentNode: TopologyNode = {
        name: 'test-deployment',
        namespace: 'default',
        type: 'deployment',
        id: 'deployment--test-deployment',
        uid: 'deploy-uid',
        specs: {},
      }

      const resourceMap: TopologyResourceMap = {}
      const isClusterGrouped: ClusterGroupingState = { value: false }
      const hasHelmReleases: HelmReleasesState = { value: false }

      processNodeData(deploymentNode, resourceMap, isClusterGrouped, hasHelmReleases, mockTopology)

      expect(resourceMap['deployment-default-test-deployment-cluster1']).toBe(deploymentNode)
    })

    it('should add nodes with resources using type-cluster key', () => {
      const nodeWithResources: TopologyNode = {
        name: 'grouped-pods',
        namespace: 'default',
        type: 'pod',
        id: 'pod--grouped-pods',
        uid: 'grouped-uid',
        specs: {
          resources: [{ name: 'pod1' }, { name: 'pod2' }],
        },
      }

      const resourceMap: TopologyResourceMap = {}
      const isClusterGrouped: ClusterGroupingState = { value: false }
      const hasHelmReleases: HelmReleasesState = { value: false }

      processNodeData(nodeWithResources, resourceMap, isClusterGrouped, hasHelmReleases, mockTopology)

      expect(resourceMap['pod-cluster1']).toBe(nodeWithResources)
    })

    it('should detect cluster grouping from comma-separated cluster names', () => {
      ;(getClusterName as jest.Mock).mockReturnValue('cluster1, cluster2')

      const multiClusterNode: TopologyNode = {
        name: 'multi-cluster-deployment',
        namespace: 'default',
        type: 'deployment',
        id: 'deployment--multi-cluster',
        uid: 'multi-uid',
        specs: {},
      }

      const resourceMap: TopologyResourceMap = {}
      const isClusterGrouped: ClusterGroupingState = { value: false }
      const hasHelmReleases: HelmReleasesState = { value: false }

      processNodeData(multiClusterNode, resourceMap, isClusterGrouped, hasHelmReleases, mockTopology)

      expect(isClusterGrouped.value).toBe(true)

      // Reset mock
      ;(getClusterName as jest.Mock).mockReturnValue('cluster1')
    })

    it('should skip cluster, application, and placements types in design mode', () => {
      ;(isDeployableResource as jest.Mock).mockReturnValue(false)

      const clusterNode: TopologyNode = {
        name: 'cluster1',
        namespace: 'default',
        type: 'cluster',
        id: 'cluster--cluster1',
        uid: 'cluster-uid',
        specs: {
          isDesign: true,
        },
      }

      const resourceMap: TopologyResourceMap = {}
      const isClusterGrouped: ClusterGroupingState = { value: false }
      const hasHelmReleases: HelmReleasesState = { value: false }

      processNodeData(clusterNode, resourceMap, isClusterGrouped, hasHelmReleases, mockTopology)

      expect(Object.keys(resourceMap).length).toBe(0)
    })

    it('should include channel in key name when present', () => {
      ;(isDeployableResource as jest.Mock).mockReturnValue(false)

      const nodeWithChannel: TopologyNode = {
        name: 'test-resource',
        namespace: 'default',
        type: 'deployment',
        id: 'deployment--test-resource',
        uid: 'resource-uid',
        specs: {
          raw: {
            spec: {
              channel: 'ns/channel-name',
            },
          },
        },
      }

      const resourceMap: TopologyResourceMap = {}
      const isClusterGrouped: ClusterGroupingState = { value: false }
      const hasHelmReleases: HelmReleasesState = { value: false }

      processNodeData(nodeWithChannel, resourceMap, isClusterGrouped, hasHelmReleases, mockTopology)

      expect(resourceMap['deployment-default-ns/channel-name-test-resource-cluster1']).toBe(nodeWithChannel)
    })
  })

  describe('evaluateSingleAnd', () => {
    it('should return truthy value when both operands are truthy', () => {
      expect(evaluateSingleAnd(true, true)).toBe(true)
      expect(evaluateSingleAnd(1, 'string')).toBeTruthy()
      expect(evaluateSingleAnd({}, [])).toBeTruthy()
    })

    it('should return falsy value when first operand is falsy', () => {
      expect(evaluateSingleAnd(false, true)).toBeFalsy()
      expect(evaluateSingleAnd(null, true)).toBeFalsy()
      expect(evaluateSingleAnd(undefined, true)).toBeFalsy()
      expect(evaluateSingleAnd(0, true)).toBeFalsy()
      expect(evaluateSingleAnd('', true)).toBeFalsy()
    })

    it('should return falsy value when second operand is falsy', () => {
      expect(evaluateSingleAnd(true, false)).toBeFalsy()
      expect(evaluateSingleAnd(true, null)).toBeFalsy()
      expect(evaluateSingleAnd(true, undefined)).toBeFalsy()
      expect(evaluateSingleAnd(true, 0)).toBeFalsy()
      expect(evaluateSingleAnd(true, '')).toBeFalsy()
    })

    it('should return falsy value when both operands are falsy', () => {
      expect(evaluateSingleAnd(false, false)).toBeFalsy()
      expect(evaluateSingleAnd(null, undefined)).toBeFalsy()
      expect(evaluateSingleAnd(0, '')).toBeFalsy()
    })
  })

  describe('getTopologyElements', () => {
    it('should transform links from API format to D3 format', () => {
      const topology: Topology = {
        nodes: [
          { name: 'node1', namespace: 'ns', type: 'app', uid: 'uid1', specs: {} },
          { name: 'node2', namespace: 'ns', type: 'deploy', uid: 'uid2', specs: {} },
        ],
        links: [
          {
            from: { uid: 'uid1' },
            to: { uid: 'uid2' },
            type: 'deploys',
          },
        ],
      }

      const result = getTopologyElements(topology)

      expect(result.links).toHaveLength(1)
      expect(result.links[0]).toEqual({
        source: 'uid1',
        target: 'uid2',
        label: 'deploys',
        type: 'deploys',
        uid: 'uid1uid2',
      })
    })

    it('should handle missing from/to uids in links', () => {
      const topology: Topology = {
        nodes: [],
        links: [
          {
            from: undefined,
            to: { uid: 'uid2' },
            type: 'link1',
          },
          {
            from: { uid: 'uid1' },
            to: undefined,
            type: 'link2',
          },
        ],
      }

      const result = getTopologyElements(topology)

      expect(result.links).toHaveLength(2)
      expect(result.links[0].source).toBe('')
      expect(result.links[0].target).toBe('uid2')
      expect(result.links[1].source).toBe('uid1')
      expect(result.links[1].target).toBe('')
    })

    it('should filter out self-referencing links and store them as node properties', () => {
      const topology: Topology = {
        nodes: [{ name: 'node1', namespace: 'ns', type: 'app', uid: 'uid1', specs: {} }],
        links: [
          {
            from: { uid: 'uid1' },
            to: { uid: 'uid1' },
            type: 'self-link',
          },
        ],
      }

      const result = getTopologyElements(topology)

      expect(result.links).toHaveLength(0)
      expect(result.nodes[0].selfLink).toEqual({
        source: 'uid1',
        target: 'uid1',
        label: 'self-link',
        type: 'self-link',
        uid: 'uid1uid1',
      })
    })

    it('should handle empty topology', () => {
      const topology: Topology = {
        nodes: [],
        links: [],
      }

      const result = getTopologyElements(topology)

      expect(result.nodes).toEqual([])
      expect(result.links).toEqual([])
    })

    it('should handle topology with undefined nodes and links', () => {
      const topology = {} as Topology

      const result = getTopologyElements(topology)

      expect(result.nodes).toEqual([])
      expect(result.links).toEqual([])
    })

    it('should preserve all nodes from input topology', () => {
      const topology: Topology = {
        nodes: [
          { name: 'node1', namespace: 'ns1', type: 'app', uid: 'uid1', specs: { key: 'value1' } },
          { name: 'node2', namespace: 'ns2', type: 'deploy', uid: 'uid2', specs: { key: 'value2' } },
          { name: 'node3', namespace: 'ns3', type: 'service', uid: 'uid3', specs: { key: 'value3' } },
        ],
        links: [],
      }

      const result = getTopologyElements(topology)

      expect(result.nodes).toHaveLength(3)
      expect(result.nodes).toEqual(topology.nodes)
    })

    it('should handle multiple links correctly', () => {
      const topology: Topology = {
        nodes: [
          { name: 'node1', namespace: 'ns', type: 'app', uid: 'uid1', specs: {} },
          { name: 'node2', namespace: 'ns', type: 'deploy', uid: 'uid2', specs: {} },
          { name: 'node3', namespace: 'ns', type: 'pod', uid: 'uid3', specs: {} },
        ],
        links: [
          { from: { uid: 'uid1' }, to: { uid: 'uid2' }, type: 'link1' },
          { from: { uid: 'uid2' }, to: { uid: 'uid3' }, type: 'link2' },
          { from: { uid: 'uid1' }, to: { uid: 'uid3' }, type: 'link3' },
        ],
      }

      const result = getTopologyElements(topology)

      expect(result.links).toHaveLength(3)
      expect(result.links[0].uid).toBe('uid1uid2')
      expect(result.links[1].uid).toBe('uid2uid3')
      expect(result.links[2].uid).toBe('uid1uid3')
    })
  })
})
