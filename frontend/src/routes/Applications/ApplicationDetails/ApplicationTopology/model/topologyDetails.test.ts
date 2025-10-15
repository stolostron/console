/* Copyright Contributors to the Open Cluster Management project */

import {
  addDiagramDetails,
  mapSingleApplication,
  syncControllerRevisionPodStatusMap,
  syncReplicaSetCountToPodNode,
  isVirtualMachineResource,
} from './topologyDetails'
import type {
  ResourceStatuses,
  ResourceMapObject,
  Topology,
  HelmReleaseDetector,
  SearchResultItem,
  RelatedKindGroup,
  RelatedResourceItem,
  ClusterInfo,
} from '../types'

// Mock the helper functions
jest.mock('../helpers/diagram-helpers', () => ({
  addResourceToModel: jest.fn(),
  checkNotOrObjects: jest.fn(),
  getNameWithoutPodHash: jest.fn(),
  getNameWithoutChartRelease: jest.fn(),
  computeResourceName: jest.fn(),
}))

jest.mock('../helpers/diagram-helpers-utils', () => ({
  getClusterName: jest.fn(),
  getRouteNameWithoutIngressHash: jest.fn(),
  updateAppClustersMatchingSearch: jest.fn(),
  getResourcesClustersForApp: jest.fn(),
  getNameWithoutVolumePostfix: jest.fn(),
  getNameWithoutVMTypeHash: jest.fn(),
  getVMNameWithoutPodHash: jest.fn(),
}))

jest.mock('../utils', () => ({
  deepClone: jest.fn((obj) => JSON.parse(JSON.stringify(obj))),
}))

import {
  addResourceToModel,
  checkNotOrObjects,
  getNameWithoutPodHash,
  getNameWithoutChartRelease,
  computeResourceName,
} from '../helpers/diagram-helpers'
import {
  getClusterName,
  getRouteNameWithoutIngressHash,
  updateAppClustersMatchingSearch,
  getResourcesClustersForApp,
  getNameWithoutVolumePostfix,
  getNameWithoutVMTypeHash,
  getVMNameWithoutPodHash,
} from '../helpers/diagram-helpers-utils'
import { deepClone } from '../utils'

// Test data fixtures
const mockClusterInfo: ClusterInfo = {
  name: 'cluster1',
  namespace: 'default',
  status: 'ok',
  metadata: {
    name: 'cluster1',
  },
}

const mockRelatedResourceItem: RelatedResourceItem = {
  kind: 'Deployment',
  cluster: 'cluster1',
  name: 'test-deployment',
  namespace: 'default',
  label: 'app=test',
  desired: '3',
}

const mockRelatedKindGroup: RelatedKindGroup = {
  kind: 'Deployment',
  items: [mockRelatedResourceItem],
}

const mockSearchResultItem: SearchResultItem = {
  name: 'test-app',
  namespace: 'default',
  dashboard: '',
  selfLink: '',
  _uid: 'test-uid',
  created: '2023-01-01T00:00:00Z',
  apigroup: 'apps',
  cluster: 'cluster1',
  kind: 'Application',
  label: 'app=test',
  _hubClusterResource: 'true',
  _rbac: '',
  related: [mockRelatedKindGroup],
}

const mockResourceStatuses: ResourceStatuses = {
  data: {
    searchResult: [mockSearchResultItem],
  },
}

const mockResourceMapObject: ResourceMapObject = {
  name: 'test-deployment',
  namespace: 'default',
  type: 'deployment',
  specs: {
    clustersNames: ['cluster1'],
    searchClusters: [mockClusterInfo],
  },
}

const mockResourceMap: Record<string, ResourceMapObject> = {
  'deployment-test-deployment-cluster1': mockResourceMapObject,
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
        allSubscriptions: [],
        clustersNames: ['cluster1'],
      },
    },
    {
      name: 'cluster1',
      namespace: 'default',
      type: 'cluster',
      id: 'cluster--cluster1',
      uid: 'cluster-uid',
      specs: {},
    },
  ],
  links: [],
  hubClusterName: 'hub-cluster',
}

const mockHelmReleaseDetector: HelmReleaseDetector = {
  value: false,
}

describe('topologyDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock implementations
    ;(checkNotOrObjects as jest.Mock).mockReturnValue(false)
    ;(getNameWithoutPodHash as jest.Mock).mockReturnValue({
      nameNoHash: 'test-deployment',
      deployableName: null,
    })
    ;(getNameWithoutChartRelease as jest.Mock).mockReturnValue('test-deployment')
    ;(computeResourceName as jest.Mock).mockReturnValue('test-deployment')
    ;(getRouteNameWithoutIngressHash as jest.Mock).mockReturnValue('test-deployment')
    ;(getResourcesClustersForApp as jest.Mock).mockReturnValue([mockClusterInfo])
    ;(getClusterName as jest.Mock).mockReturnValue('cluster1')
    ;(getNameWithoutVolumePostfix as jest.Mock).mockReturnValue('test-volume')
    ;(getNameWithoutVMTypeHash as jest.Mock).mockReturnValue('test-vm')
    ;(getVMNameWithoutPodHash as jest.Mock).mockReturnValue('test-vm-pod')
  })

  describe('addDiagramDetails', () => {
    it('should return resourceMap unchanged when checkNotOrObjects returns true', () => {
      ;(checkNotOrObjects as jest.Mock).mockReturnValue(true)

      const result = addDiagramDetails(
        mockResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBe(mockResourceMap)
      expect(checkNotOrObjects).toHaveBeenCalledWith(mockResourceStatuses, mockResourceMap)
    })

    it('should process single search result correctly', () => {
      const result = addDiagramDetails(
        mockResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBeDefined()
      expect(getResourcesClustersForApp).toHaveBeenCalled()
      expect(updateAppClustersMatchingSearch).toHaveBeenCalled()
    })

    it('should process multiple search results correctly', () => {
      const multipleSearchResults: ResourceStatuses = {
        data: {
          searchResult: [mockSearchResultItem, { ...mockSearchResultItem, name: 'test-app-2' }],
        },
      }

      const result = addDiagramDetails(
        multipleSearchResults,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBeDefined()
      expect(deepClone).toHaveBeenCalledTimes(2)
    })

    it('should handle application with multiple subscriptions', () => {
      const topologyWithMultipleSubs: Topology = {
        ...mockTopology,
        nodes: [
          {
            ...mockTopology.nodes[0],
            specs: {
              allSubscriptions: ['sub1', 'sub2'],
              clustersNames: ['cluster1'],
            },
          },
          ...mockTopology.nodes.slice(1),
        ],
      }

      const result = addDiagramDetails(
        mockResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        topologyWithMultipleSubs
      )

      expect(result).toBeDefined()
    })

    it('should set cluster summary on application node', () => {
      const result = addDiagramDetails(
        mockResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBeDefined()
      // Verify that cluster summary is set on the application node
      const appNode = mockTopology.nodes.find((node) => node.type === 'application')
      expect(appNode?.specs?.allClusters).toBeDefined()
    })

    it('should handle virtual machine resources correctly', () => {
      const vmResourceItem: RelatedResourceItem = {
        ...mockRelatedResourceItem,
        kind: 'PersistentVolumeClaim',
        label: 'instancetype.kubevirt.io/vm=test-vm',
      }

      const vmRelatedKindGroup: RelatedKindGroup = {
        kind: 'PersistentVolumeClaim',
        items: [vmResourceItem],
      }

      const vmSearchResult: SearchResultItem = {
        ...mockSearchResultItem,
        related: [vmRelatedKindGroup],
      }

      const vmResourceStatuses: ResourceStatuses = {
        data: {
          searchResult: [vmSearchResult],
        },
      }

      const result = addDiagramDetails(
        vmResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBeDefined()
      expect(getNameWithoutVolumePostfix).toHaveBeenCalled()
    })

    it('should handle local hub subscriptions correctly', () => {
      const localSubscriptionItem: RelatedResourceItem = {
        ...mockRelatedResourceItem,
        kind: 'Subscription',
        cluster: 'hub-cluster',
        localPlacement: 'true',
      }

      const localSubscriptionGroup: RelatedKindGroup = {
        kind: 'Subscription',
        items: [localSubscriptionItem],
      }

      const localSearchResult: SearchResultItem = {
        ...mockSearchResultItem,
        related: [localSubscriptionGroup],
      }

      const localResourceStatuses: ResourceStatuses = {
        data: {
          searchResult: [localSearchResult],
        },
      }

      ;(computeResourceName as jest.Mock).mockReturnValue('test-subscription-local')

      const result = addDiagramDetails(
        localResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBeDefined()
    })

    it('should skip old replica sets with desired count of 0', () => {
      const replicaSetItem: RelatedResourceItem = {
        ...mockRelatedResourceItem,
        kind: 'ReplicaSet',
        desired: '0',
      }

      const replicaSetGroup: RelatedKindGroup = {
        kind: 'ReplicaSet',
        items: [replicaSetItem],
      }

      const replicaSetSearchResult: SearchResultItem = {
        ...mockSearchResultItem,
        related: [replicaSetGroup],
      }

      const replicaSetResourceStatuses: ResourceStatuses = {
        data: {
          searchResult: [replicaSetSearchResult],
        },
      }

      const result = addDiagramDetails(
        replicaSetResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBeDefined()
      expect(addResourceToModel).not.toHaveBeenCalled()
    })

    it('should filter out deployable and cluster kinds', () => {
      const mixedRelatedGroups: RelatedKindGroup[] = [
        mockRelatedKindGroup,
        { kind: 'deployable', items: [] },
        { kind: 'cluster', items: [] },
        { kind: 'Deployable', items: [] },
        { kind: 'Cluster', items: [] },
      ]

      const mixedSearchResult: SearchResultItem = {
        ...mockSearchResultItem,
        related: mixedRelatedGroups,
      }

      const mixedResourceStatuses: ResourceStatuses = {
        data: {
          searchResult: [mixedSearchResult],
        },
      }

      const result = addDiagramDetails(
        mixedResourceStatuses,
        mockResourceMap,
        false,
        mockHelmReleaseDetector,
        mockTopology
      )

      expect(result).toBeDefined()
    })
  })

  describe('mapSingleApplication', () => {
    it('should return default structure when application is null', () => {
      const result = mapSingleApplication(null as any, 'hub-cluster')

      expect(result).toEqual({
        name: '',
        namespace: '',
        dashboard: '',
        selfLink: '',
        _uid: '',
        created: '',
        apigroup: '',
        cluster: '',
        kind: '',
        label: '',
        _hubClusterResource: '',
        _rbac: '',
        related: [],
      })
    })

    it('should process items and organize them under related section', () => {
      const applicationWithItems: SearchResultItem = {
        ...mockSearchResultItem,
        items: [
          {
            kind: 'Deployment',
            cluster: 'cluster1',
            name: 'test-deployment',
            namespace: 'default',
            label: 'app=test',
          },
        ],
        related: [],
      }

      const result = mapSingleApplication(applicationWithItems, 'hub-cluster')

      expect(result.related).toHaveLength(1)
      expect(result.related?.[0].kind).toBe('Deployment')
      expect(result.related?.[0].items).toHaveLength(1)
    })

    it('should preserve legitimate app objects for Argo app of apps pattern', () => {
      const argoAppItem = {
        kind: 'application',
        cluster: 'cluster1',
        name: 'test-app',
        namespace: 'default',
        label: 'app.kubernetes.io/name=test',
      }

      const applicationWithArgoApp: SearchResultItem = {
        ...mockSearchResultItem,
        items: [argoAppItem],
        related: [],
      }

      const result = mapSingleApplication(applicationWithArgoApp, 'hub-cluster')

      // Should not add the legitimate app object to related
      expect(result.related).toHaveLength(0)
    })

    it('should preserve legitimate subscription objects on non-hub clusters', () => {
      const subscriptionItem = {
        kind: 'subscription',
        cluster: 'remote-cluster',
        name: 'test-subscription',
        namespace: 'default',
        label: 'app=test',
      }

      const applicationWithSubscription: SearchResultItem = {
        ...mockSearchResultItem,
        items: [subscriptionItem],
        related: [],
      }

      const result = mapSingleApplication(applicationWithSubscription, 'hub-cluster')

      // Should not add the legitimate subscription object to related
      expect(result.related).toHaveLength(0)
    })

    it('should add items to existing kind section', () => {
      const existingRelatedGroup: RelatedKindGroup = {
        kind: 'Deployment',
        items: [mockRelatedResourceItem],
      }

      const applicationWithExistingRelated: SearchResultItem = {
        ...mockSearchResultItem,
        items: [
          {
            kind: 'Deployment',
            cluster: 'cluster1',
            name: 'test-deployment-2',
            namespace: 'default',
            label: 'app=test',
          },
        ],
        related: [existingRelatedGroup],
      }

      const result = mapSingleApplication(applicationWithExistingRelated, 'hub-cluster')

      expect(result.related).toHaveLength(1)
      expect(result.related?.[0].items).toHaveLength(2)
    })
  })

  describe('syncControllerRevisionPodStatusMap', () => {
    it('should sync pod status map for ControllerRevision resources', () => {
      const controllerRevisionResource: ResourceMapObject = {
        name: 'controllerrevision-test',
        namespace: 'default',
        type: 'controllerrevision',
        specs: {
          parent: {
            parentName: 'test-daemonset',
            parentType: 'daemonset',
            parentId: 'daemonset-test-daemonset-cluster1',
          },
        },
      }

      const parentResource: ResourceMapObject = {
        name: 'test-daemonset',
        namespace: 'default',
        type: 'daemonset',
        specs: {
          daemonsetModel: {
            daemonset: [
              {
                name: 'test-daemonset',
                desired: 3,
                available: 3,
              },
            ],
          },
        },
      }

      const resourceMap: Record<string, ResourceMapObject> = {
        'controllerrevision-controllerrevision-test': controllerRevisionResource,
        'daemonset-test-daemonset-cluster1': parentResource,
      }

      syncControllerRevisionPodStatusMap(resourceMap, 'hub-cluster')

      expect(getClusterName).toHaveBeenCalledWith(
        'daemonset-test-daemonset-cluster1',
        undefined,
        undefined,
        'hub-cluster'
      )
    })

    it('should handle ControllerRevision without parent resource', () => {
      const controllerRevisionResource: ResourceMapObject = {
        name: 'controllerrevision-test',
        namespace: 'default',
        type: 'controllerrevision',
        specs: {
          parent: {
            parentName: 'missing-parent',
            parentType: 'daemonset',
            parentId: 'daemonset-missing-parent-cluster1',
          },
        },
      }

      const resourceMap: Record<string, ResourceMapObject> = {
        'controllerrevision-controllerrevision-test': controllerRevisionResource,
      }

      // Should not throw error
      expect(() => {
        syncControllerRevisionPodStatusMap(resourceMap, 'hub-cluster')
      }).not.toThrow()
    })

    it('should skip non-ControllerRevision resources', () => {
      const deploymentResource: ResourceMapObject = {
        name: 'test-deployment',
        namespace: 'default',
        type: 'deployment',
        specs: {},
      }

      const resourceMap: Record<string, ResourceMapObject> = {
        'deployment-test-deployment': deploymentResource,
      }

      syncControllerRevisionPodStatusMap(resourceMap, 'hub-cluster')

      expect(getClusterName).not.toHaveBeenCalled()
    })
  })

  describe('syncReplicaSetCountToPodNode', () => {
    it('should sync replica set count to pod nodes', () => {
      const podResource: ResourceMapObject = {
        name: 'test-pod',
        namespace: 'default',
        type: 'pod',
        specs: {
          parent: {
            parentName: 'test-replicaset',
            parentType: 'replicaset',
            parentId: 'replicaset-test-replicaset-cluster1',
          },
          clustersNames: ['cluster1'],
        },
      }

      const replicaSetResource: ResourceMapObject = {
        name: 'test-replicaset',
        namespace: 'default',
        type: 'replicaset',
        specs: {
          replicasetModel: {
            replicaset: [
              {
                name: 'test-replicaset',
                desired: 5,
                available: 5,
              },
            ],
          },
        },
      }

      const resourceMap: Record<string, ResourceMapObject> = {
        'pod-test-pod': podResource,
        'replicaset-test-replicaset-cluster1': replicaSetResource,
      }

      syncReplicaSetCountToPodNode(resourceMap)

      expect(podResource.specs?.replicaCount).toBe(5)
      expect(podResource.specs?.resourceCount).toBe(5)
    })

    it('should handle pod without parent resource', () => {
      const podResource: ResourceMapObject = {
        name: 'test-pod',
        namespace: 'default',
        type: 'pod',
        specs: {
          parent: {
            parentName: 'missing-replicaset',
            parentType: 'replicaset',
            parentId: 'replicaset-missing-replicaset-cluster1',
          },
          clustersNames: ['cluster1'],
        },
      }

      const resourceMap: Record<string, ResourceMapObject> = {
        'pod-test-pod': podResource,
      }

      // Should not throw error
      expect(() => {
        syncReplicaSetCountToPodNode(resourceMap)
      }).not.toThrow()
    })

    it('should skip non-pod resources', () => {
      const deploymentResource: ResourceMapObject = {
        name: 'test-deployment',
        namespace: 'default',
        type: 'deployment',
        specs: {},
      }

      const resourceMap: Record<string, ResourceMapObject> = {
        'deployment-test-deployment': deploymentResource,
      }

      syncReplicaSetCountToPodNode(resourceMap)

      expect(deploymentResource.specs?.replicaCount).toBeUndefined()
    })
  })

  describe('isVirtualMachineResource', () => {
    it('should return true for KubeVirt instance type labels', () => {
      const labels = 'instancetype.kubevirt.io/vm=test-vm;app=test'

      const result = isVirtualMachineResource(labels)

      expect(result).toBe(true)
    })

    it('should return true for KubeVirt.io labels', () => {
      const labels = 'kubevirt.io/vm=test-vm;app=test'

      const result = isVirtualMachineResource(labels)

      expect(result).toBe(true)
    })

    it('should return false for non-KubeVirt labels', () => {
      const labels = 'app=test;version=v1'

      const result = isVirtualMachineResource(labels)

      expect(result).toBe(false)
    })

    it('should return false for empty labels', () => {
      const result = isVirtualMachineResource('')

      expect(result).toBe(false)
    })

    it('should return false for undefined labels', () => {
      const result = isVirtualMachineResource(undefined)

      expect(result).toBe(false)
    })

    it('should handle labels with multiple key-value pairs', () => {
      const labels = 'app=test;version=v1;instancetype.kubevirt.io/vm=test-vm;env=prod'

      const result = isVirtualMachineResource(labels)

      expect(result).toBe(true)
    })

    it('should handle labels with spaces around equals sign', () => {
      const labels = 'app = test; instancetype.kubevirt.io/vm = test-vm'

      const result = isVirtualMachineResource(labels)

      expect(result).toBe(true)
    })

    it('should return false for malformed labels', () => {
      const labels = 'app=test;malformed-label;instancetype.kubevirt.io/vm=test-vm'

      const result = isVirtualMachineResource(labels)

      expect(result).toBe(true) // Should still detect the valid KubeVirt label
    })
  })
})
