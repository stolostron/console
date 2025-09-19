// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import {
  getClusterName,
  nodeMustHavePods,
  isDeployableResource,
  getRouteNameWithoutIngressHash,
  getActiveFilterCodes,
  filterSubscriptionObject,
  getClusterHost,
  fixMissingStateOptions,
  namespaceMatchTargetServer,
  updateAppClustersMatchingSearch,
  getTargetNsForNode,
  getResourcesClustersForApp,
  allClustersAreOnline,
  mustRefreshTopologyMap,
  getNameWithoutVolumePostfix,
  getNameWithoutVMTypeHash,
  getVMNameWithoutPodHash,
} from './diagram-helpers-utils'

import { getOnlineClusters, getPulseStatusForSubscription } from '../../statuses/computeStatuses'
import { syncControllerRevisionPodStatusMap } from '../topologyDetails'
import type {
  Topology,
  TopologyNode,
  ClusterInfo,
  ResourceItem,
  StatusType,
  SubscriptionItem,
  ResourceMap,
  TestTopologyNode,
  TestClusterNode,
  TestNamespaceNode,
  TestPolicyNode,
  TestSubscriptionNode,
  TestResourceItem,
  TestSearchClusters,
  TestPlacementNode,
} from '../../types'

/**
 * Test suite for mustRefreshTopologyMap function
 * This function determines whether the topology map needs to be refreshed
 * based on the last updated timestamp of application nodes
 */
describe('mustRefreshTopologyMap', () => {
  const updatedTime: number = 1621025105756

  // Topology with application node but no _lastUpdated timestamp
  const topo: Topology = {
    nodes: [
      {
        type: 'application',
        name: 'test-app',
        namespace: 'default',
        id: 'app-1',
        uid: 'app-uid-1',
        specs: {},
      } as TopologyNode,
    ],
    links: [],
  }

  // Topology with application node having an older _lastUpdated timestamp
  const topo1: Topology = {
    nodes: [
      {
        type: 'application',
        name: 'test-app',
        namespace: 'default',
        id: 'app-1',
        uid: 'app-uid-1',
        specs: {},
        _lastUpdated: 11111,
      } as TopologyNode,
    ],
    links: [],
  }

  // Topology with application node having the same _lastUpdated timestamp
  const topo2: Topology = {
    nodes: [
      {
        type: 'application',
        name: 'test-app',
        namespace: 'default',
        id: 'app-1',
        uid: 'app-uid-1',
        specs: {},
        _lastUpdated: updatedTime,
      } as TopologyNode,
    ],
    links: [],
  }

  it('must call update, updated time is not set on the app node', () => {
    // When no _lastUpdated timestamp exists, refresh should be required
    expect(mustRefreshTopologyMap(topo, updatedTime)).toEqual(true)
  })

  it('must call update, updated time is set on the app node but not the same with the latest refresh', () => {
    // When _lastUpdated is older than the current update time, refresh should be required
    expect(mustRefreshTopologyMap(topo1, updatedTime)).toEqual(true)
  })

  it('must NOT call update, updated time is set on the app node AND IS the same with the latest refresh', () => {
    // When _lastUpdated matches the current update time, no refresh is needed
    expect(mustRefreshTopologyMap(topo2, updatedTime)).toEqual(false)
  })

  it('must call update, updated time not defined', () => {
    // When no update time is provided, refresh should be required
    expect(mustRefreshTopologyMap(topo2)).toEqual(true)
  })
})

/**
 * Test suite for allClustersAreOnline function
 * This function checks if all specified clusters are in the online clusters list
 */
describe('allClustersAreOnline', () => {
  const onlineClusters: string[] = ['cls1', 'cls2']

  it('returns true when all clusters are online', () => {
    // All clusters in the list are present in online clusters
    expect(allClustersAreOnline(['cls1', 'cls2'], onlineClusters)).toEqual(true)
  })

  it('returns false when some clusters are offline', () => {
    // cls3 is not in the online clusters list
    expect(allClustersAreOnline(['cls1', 'cls2', 'cls3'], onlineClusters)).toEqual(false)
  })

  it('returns false when online clusters list is undefined', () => {
    // When online clusters list is not provided, should return false
    expect(allClustersAreOnline(['cls1', 'cls2', 'cls3'], undefined)).toEqual(false)
  })
})

/**
 * Test suite for getResourcesClustersForApp function
 * This function filters search clusters based on application placement decisions
 * and determines which clusters should be included for the application
 */
describe('getResourcesClustersForApp', () => {
  // Mock search clusters data representing available clusters
  const searchClusters: TestSearchClusters = {
    items: [
      {
        name: 'local-cluster',
        consoleURL: 'https://console-openshift-console.apps.app-abcd.com',
      },
      {
        name: 'ui-managed',
        consoleURL: 'https://console-openshift-console.apps.app-abcd.managed.com',
      },
      {
        HubAcceptedManagedCluster: 'True',
        ManagedClusterConditionAvailable: 'True',
        kind: 'cluster',
        label: 'cloud=Amazon; environment=Dev; name=fxiang-eks; vendor=EKS',
        name: 'fxiang-eks',
      },
    ],
  }
  // Nodes representing an application with placement rule that includes local-cluster
  const nodesWithPlacementOnLocal: TestTopologyNode[] = [
    {
      name: 'rootApp',
      type: 'application',
      id: 'application',
    },
    {
      name: 'placementrule',
      type: 'placements',
      id: 'member--rule--placement',
      specs: {
        raw: {
          status: {
            decisions: [
              {
                clusterName: 'local-cluster',
                clusterNamespace: 'local-cluster',
              },
              {
                clusterName: 'ui-hub',
                clusterNamespace: 'ui-hub',
              },
            ],
          },
        },
      },
    },
  ]
  // Nodes representing an application with placement rule that excludes local-cluster
  const nodesWithoutPlacementOnLocal: TestTopologyNode[] = [
    {
      name: 'rootApp',
      type: 'application',
      id: 'application',
    },
    {
      name: 'placementrule',
      type: 'placements',
      id: 'member--rule--placement',
      specs: {
        raw: {
          status: {
            decisions: [
              {
                clusterName: 'ui-hub',
                clusterNamespace: 'ui-hub',
              },
            ],
          },
        },
      },
    },
  ]

  // Nodes with placement rule as deployable (different ID pattern)
  const nodesWithoutPlacementOnLocalAsDeployable: TestTopologyNode[] = [
    {
      name: 'rootApp',
      type: 'application',
      id: 'application',
    },
    {
      name: 'placementrule',
      type: 'placements',
      id: 'member--deployable--placement',
      specs: {
        raw: {
          status: {
            decisions: [
              {
                clusterName: 'ui-hub',
                clusterNamespace: 'ui-hub',
              },
            ],
          },
        },
      },
    },
  ]

  // Nodes representing an application without any placement rules (e.g., Argo apps)
  const nodesWithNoPlacement: TestTopologyNode[] = [
    {
      name: 'rootApp',
      type: 'application',
      id: 'application',
    },
  ]
  // Expected result when local cluster should be excluded
  const resultWithoutLocalCluster: TestResourceItem[] = [
    {
      name: 'ui-managed',
      consoleURL: 'https://console-openshift-console.apps.app-abcd.managed.com',
    },
    {
      HubAcceptedManagedCluster: 'True',
      ManagedClusterConditionAvailable: 'True',
      kind: 'cluster',
      label: 'cloud=Amazon; environment=Dev; name=fxiang-eks; vendor=EKS',
      name: 'fxiang-eks',
    },
  ]

  it('returns search nodes WITHOUT local host, the placement rule is not deploying on local', () => {
    // When placement decisions don't include local-cluster, it should be excluded from results
    expect(getResourcesClustersForApp(searchClusters, nodesWithoutPlacementOnLocal, 'local-cluster')).toEqual(
      resultWithoutLocalCluster
    )
  })

  it('returns search nodes WITH local host, the placement rule IS deploying on local', () => {
    // When placement decisions include local-cluster, all clusters should be returned
    expect(getResourcesClustersForApp(searchClusters, nodesWithPlacementOnLocal, 'local-cluster')).toEqual(
      searchClusters.items
    )
  })

  it('returns search nodes WITH local host, the placement rule not found - ie argo', () => {
    // When no placement rules exist (Argo apps), all clusters should be returned
    expect(getResourcesClustersForApp(searchClusters, nodesWithNoPlacement, 'local-cluster')).toEqual(
      searchClusters.items
    )
  })

  it('returns search nodes WITH local host, the placement rule found but is a deployable', () => {
    // When placement rule is a deployable (different ID pattern), all clusters should be returned
    expect(
      getResourcesClustersForApp(searchClusters, nodesWithoutPlacementOnLocalAsDeployable, 'local-cluster')
    ).toEqual(searchClusters.items)
  })
})

/**
 * Test suite for getTargetNsForNode function
 * This function extracts target namespaces for a node based on its type and cluster configuration
 */
describe('getTargetNsForNode', () => {
  // Mock namespace resources for testing
  const v1: ResourceItem = {
    cluster: 'local-cluster',
    kind: 'namespace',
    name: 'helloworld-123',
  }
  const v2: ResourceItem = {
    cluster: 'local-cluster',
    kind: 'namespace',
    name: 'helloworld-456',
  }
  // Test namespace node with target namespaces configuration
  const inputNodeNS: TestNamespaceNode = {
    id: 'member--member--deployable--member--clusters--local-cluster--vb-crash-ns--vb-app-crash-subscription-1-seeds-managed-acm-hello-world-helloworld-namespace--namespace--helloworld',
    name: 'helloworld',
    clusters: {
      specs: {
        targetNamespaces: {
          'local-cluster': ['helloworld', 'helloworld1'],
        },
      },
    },
    cluster: null,
    clusterName: null,
    type: 'namespace',
    specs: {
      raw: {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
          name: 'helloworld',
        },
      },
      deployStatuses: [],
      isDesign: false,
      parent: {
        parentId: 'member--clusters--local-cluster',
        parentName: 'local-cluster',
        parentType: 'cluster',
      },
      clustersNames: ['local-cluster'],
      searchClusters: [
        {
          _clusterNamespace: 'local-cluster',
          name: 'local-cluster',
          kind: 'cluster',
          HubAcceptedManagedCluster: 'True',
          ManagedClusterConditionAvailable: 'True',
          status: 'OK',
        } as ClusterInfo,
      ],
      namespaceModel: {
        'helloworld-123-local-cluster': [v1],
        'helloworld-45-local-cluster': [v2],
      },
      pulse: 'green',
      shapeType: 'namespace',
    },
  }

  it('return local-cluster namespace for namespace node type', () => {
    // Should return both target namespaces and namespaces from the namespace model
    expect(getTargetNsForNode(inputNodeNS, [v1, v2], 'local-cluster', '*')).toEqual([
      'helloworld',
      'helloworld1',
      'helloworld-123',
      'helloworld-456',
    ])
  })

  // Mock cluster role resource for testing
  const clusterRole: ResourceItem = {
    cluster: 'local-cluster',
    kind: 'clusterrole',
    name: 'clusterrole-helloworld-456',
  }
  // Test cluster role node with target namespaces configuration
  const inputNodeClusterRole: TestTopologyNode = {
    id: 'member--member--deployable--member--clusters--local-cluster--vb-crash-ns--vb-app-crash-subscription-1-seeds-managed-acm-hello-world-helloworld-namespace--clusterrole--helloworld',
    name: 'helloworld',
    clusters: {
      specs: {
        targetNamespaces: {
          'local-cluster': ['helloworld', 'helloworld1'],
        },
      },
    },
    cluster: null,
    clusterName: null,
    type: 'clusterrole',
    specs: {
      raw: {
        apiVersion: 'v1',
        kind: 'ClusterRole',
        metadata: {
          name: 'helloworld',
        },
      },
      deployStatuses: [],
      isDesign: false,
      parent: {
        parentId: 'member--clusters--local-cluster',
        parentName: 'local-cluster',
        parentType: 'cluster',
      },
      clustersNames: ['local-cluster'],
      searchClusters: [
        {
          _clusterNamespace: 'local-cluster',
          name: 'local-cluster',
          kind: 'cluster',
          HubAcceptedManagedCluster: 'True',
          ManagedClusterConditionAvailable: 'True',
          status: 'OK',
        } as ClusterInfo,
      ],
      clusterroleModel: {
        'helloworld-123-local-cluster': [clusterRole],
      },
      pulse: 'green',
      shapeType: 'clusterrole',
    },
  }

  it('return local-cluster namespace for clusterrole node type', () => {
    // Should return target namespaces and cluster role name for cluster role nodes
    expect(getTargetNsForNode(inputNodeClusterRole, [clusterRole], 'local-cluster', '*')).toEqual([
      'helloworld',
      'helloworld1',
      'clusterrole-helloworld-456',
    ])
  })

  // Mock policy model for testing policy node namespace extraction
  const polModel: Record<string, ResourceItem[]> = {
    'openshift-gitops-installed-local-cluster': [
      {
        name: 'openshift-gitops-installed',
        cluster: 'local-cluster',
        kind: 'policy',
        namespace: 'vb-crash-ns',
      },
    ],
  }

  // Test policy node with policy model configuration
  const inputNodePolicy: TestPolicyNode = {
    id: 'member--member--deployable--member--clusters--local-cluster--vb-crash-ns--vb-app-crash-subscription-1-seeds-managed-configuration-openshift-gitops-installed-policy--policy--openshift-gitops-installed',
    uid: 'member--member--deployable--member--clusters--local-cluster--vb-crash-ns--vb-app-crash-subscription-1-seeds-managed-configuration-openshift-gitops-installed-policy--policy--openshift-gitops-installed',
    name: 'openshift-gitops-installed',
    cluster: null,
    clusterName: null,
    type: 'policy',
    specs: {
      raw: {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {
          name: 'openshift-gitops-installed',
          namespace: 'policy',
        },
      },
      deployStatuses: [],
      isDesign: false,
      parent: {
        parentId: 'member--clusters--local-cluster',
        parentName: 'local-cluster',
        parentType: 'cluster',
      },
      clustersNames: ['local-cluster'],
      searchClusters: [
        {
          name: 'local-cluster',
          kind: 'cluster',
          ManagedClusterConditionAvailable: 'True',
          status: 'OK',
        } as ClusterInfo,
      ],
      policyModel: polModel,
      pulse: 'green',
      shapeType: 'policy',
    },
    namespace: 'vb-crash-ns',
  }

  it('return local-cluster namespace for policy node type', () => {
    // Should return the namespace from the policy resource for policy nodes
    expect(
      getTargetNsForNode(
        inputNodePolicy,
        Object.values(polModel)[0],
        'local-cluster',
        'openshift-gitops-installed',
        '*'
      )
    ).toEqual(['vb-crash-ns'])
  })
})

/**
 * Test suite for updateAppClustersMatchingSearch function
 * This function updates cluster nodes with search cluster information
 */
describe('updateAppClustersMatchingSearch', () => {
  // Mock search clusters data for testing cluster updates
  const searchClusters: ClusterInfo[] = [
    {
      name: 'local-cluster',
      consoleURL: 'https://console-openshift-console.apps.app-abcd.com',
    },
    {
      name: 'ui-managed',
      consoleURL: 'https://console-openshift-console.apps.app-abcd.managed.com',
    },
    {
      HubAcceptedManagedCluster: 'True',
      ManagedClusterConditionAvailable: 'True',
      kind: 'cluster',
      label: 'cloud=Amazon; environment=Dev; name=fxiang-eks; vendor=EKS',
      name: 'fxiang-eks',
    },
  ]
  // Test cluster node with app clusters and target namespaces
  const clsNode1: TestClusterNode = {
    id: 'member--clusters--feng',
    specs: {
      appClusters: ['local-cluster', 'ui-managed'],
      targetNamespaces: {
        'ui-managed': ['namespace1', 'namespace3'],
        'local-cluster': ['namespace4'],
      },
    },
  }

  // Expected result after updating with search clusters
  const resultNode1: TestClusterNode = {
    id: 'member--clusters--feng',
    specs: {
      appClusters: ['local-cluster', 'ui-managed'],
      targetNamespaces: {
        'ui-managed': ['namespace1', 'namespace3'],
        'local-cluster': ['namespace4'],
      },
      clusters: searchClusters,
    },
  }

  it('acm clusters should return as is', () => {
    // Should add search clusters to the node specs while preserving existing data
    expect(updateAppClustersMatchingSearch(clsNode1, searchClusters)).toEqual(resultNode1)
  })
})

/**
 * Test suite for getOnlineClusters function
 * This function determines which clusters are online based on their status
 */
describe('getOnlineClusters', () => {
  const inputNodeOffLineRemote = {
    id: 'member--clusters--',
    specs: {
      searchClusters: [
        {
          name: 'local-cluster',
          status: 'OK',
        },
        {
          name: 'ui-managed',
          ManagedClusterConditionAvailable: 'Unknown',
        },
      ],
      clustersNames: ['local-cluster', 'ui-managed'],
    },
  }
  const inputNodeAllAvailable = {
    id: 'member--clusters--',
    specs: {
      searchClusters: [
        {
          name: 'local-cluster',
          status: 'OK',
        },
        {
          name: 'ui-managed',
          ManagedClusterConditionAvailable: 'True',
        },
      ],
      clustersNames: ['local-cluster', 'ui-managed'],
    },
  }
  const inputNodeLocalNotSet = {
    id: 'member--clusters--',
    specs: {
      searchClusters: [
        {
          name: 'ui-managed',
          ManagedClusterConditionAvailable: 'True',
        },
      ],
      clustersNames: ['local-cluster', 'ui-managed'],
    },
  }
  it('returns only local cluster', () => {
    // When remote cluster is offline, should only return local cluster
    expect(getOnlineClusters(inputNodeOffLineRemote)).toEqual(['local-cluster'])
  })
  it('returns all clusters', () => {
    // When all clusters are available, should return all clusters
    expect(getOnlineClusters(inputNodeAllAvailable)).toEqual(['local-cluster', 'ui-managed'])
  })
  it('returns all clusters, local not set', () => {
    // When local cluster is not in search results but provided as parameter, should include it
    expect(getOnlineClusters(inputNodeLocalNotSet, 'local-cluster')).toEqual(['local-cluster', 'ui-managed'])
  })
})

/**
 * Test suite for getClusterName function - clustersNames scenario
 * This function extracts cluster names from various node properties
 */
describe('getClusterName node returns clustersNames', () => {
  it('should return cluster names from clustersNames property', () => {
    const clsNode1 = {
      id: 'member--clusters--feng,feng2--',
      specs: {
        clustersNames: ['local-cluster', 'ui-managed'],
      },
    }
    // Should return comma-separated cluster names from clustersNames
    expect(getClusterName(clsNode1.id, clsNode1, undefined, 'local-cluster')).toEqual('local-cluster,ui-managed')
  })
})

/**
 * Test suite for getClusterName function - union scenario
 * Tests combining clustersNames and appClusters properties
 */
describe('getClusterName node returns union of clustersNames and appClusters', () => {
  it('should return union of clustersNames and appClusters', () => {
    const clsNode1 = {
      id: 'member--clusters--feng,feng2--',
      clusters: {
        specs: {
          appClusters: ['appCls1', 'appCls2'],
        },
      },
      specs: {
        clustersNames: ['local-cluster', 'ui-managed'],
      },
    }
    // Should return combined cluster names from both clustersNames and appClusters
    expect(getClusterName(undefined, clsNode1, true)).toEqual('local-cluster,ui-managed,appCls1,appCls2')
  })
})

/**
 * Test suite for getClusterName function - nodeId parsing scenario
 * Tests extracting cluster names directly from node ID
 */
describe('getClusterName node clusters from nodeId', () => {
  it('should return cluster names parsed from node ID', () => {
    const clsNode1 = {
      id: 'member--clusters--feng,feng2--',
      clusters: {
        specs: {
          appClusters: ['appCls1', 'appCls2'],
        },
      },
      specs: {
        clustersNames: ['local-cluster', 'ui-managed'],
      },
    }
    expect(getClusterName(clsNode1.id)).toEqual('feng,feng2')
  })
})

describe('getClusterName node clusters from nodeId, local cluster', () => {
  it('should return empty string', () => {
    const clsNode1 = {
      id: 'member--',
      clusters: {
        specs: {
          appClusters: ['appCls1', 'appCls2'],
        },
      },
      specs: {
        clustersNames: ['local-cluster', 'ui-managed'],
      },
    }
    // Should return local-cluster when node ID doesn't contain cluster names
    expect(getClusterName(clsNode1.id, undefined, undefined, 'local-cluster')).toEqual('local-cluster')
  })
})

/**
 * Test suite for nodeMustHavePods function - undefined data scenario
 * This function determines if a node should have associated pods
 */
describe('nodeMustHavePods undefined data', () => {
  it('nodeMustHavePods should return false for undefined node', () => {
    // Undefined nodes should not be expected to have pods
    expect(nodeMustHavePods(undefined)).toEqual(false)
  })
})

/**
 * Test suite for nodeMustHavePods function - no pods data scenario
 */
describe('nodeMustHavePods node with no pods data', () => {
  const node = {
    type: 'daemonset1',
    specs: {
      raw: {
        spec: {},
      },
    },
  }
  it('nodeMustHavePods should return false when no pod-related spec exists', () => {
    // Nodes without replicas, desired, or container specs should not require pods
    expect(nodeMustHavePods(node)).toEqual(false)
  })
})

/**
 * Test suite for nodeMustHavePods function - replicas scenario
 */
describe('nodeMustHavePods node with replicas', () => {
  const node = {
    type: 'daemonset3',
    specs: {
      raw: {
        spec: {
          replicas: 3,
        },
      },
    },
  }
  it('nodeMustHavePods with replicas', () => {
    // Nodes with replicas > 0 should be expected to have pods
    expect(nodeMustHavePods(node)).toEqual(true)
  })
})

/**
 * Test suite for nodeMustHavePods function - desired scenario
 */
describe('nodeMustHavePods node has desired', () => {
  const node = {
    type: 'daemonset',
    specs: {
      raw: {
        spec: {
          desired: 3,
        },
      },
    },
  }
  it('nodeMustHavePods has desired', () => {
    // Nodes with desired count should be expected to have pods
    expect(nodeMustHavePods(node)).toEqual(true)
  })
})

/**
 * Test suite for nodeMustHavePods function - containers scenario
 */
describe('nodeMustHavePods node with pods data', () => {
  const node = {
    type: 'deployment',
    specs: {
      raw: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'c1',
                },
              ],
            },
          },
        },
      },
    },
  }
  it('nodeMustHavePods', () => {
    // Nodes with container specs should be expected to have pods
    expect(nodeMustHavePods(node)).toEqual(true)
  })
})

/**
 * Test suite for nodeMustHavePods function - pod type scenario
 */
describe('nodeMustHavePods node with pods POD object', () => {
  const node = {
    type: 'pod',
  }
  it('nodeMustHavePods POD object', () => {
    // Pod type nodes should always be expected to have pods (themselves)
    expect(nodeMustHavePods(node)).toEqual(true)
  })
})

/**
 * Test suite for nodeMustHavePods function - controller revision with VM parent scenario
 */
describe('nodeMustHavePods controllerrevision node with VM parent type', () => {
  const node = {
    specs: {
      parent: {
        parentType: 'virtualmachine',
      },
    },
    type: 'controllerrevision',
  }
  it('nodeMustHavePods controllerrevision object with VM parent type', () => {
    // Controller revisions with virtual machine parents should not require pods
    expect(nodeMustHavePods(node)).toEqual(false)
  })
})

/**
 * Test suite for isDeployableResource function - regular subscription scenario
 * This function determines if a resource is a deployable resource
 */
describe('isDeployableResource for regular subscription', () => {
  const node = {
    id: 'member--subscription--default--mortgagedc-subscription',
    name: 'mortgagedcNOStatus',
    specs: {
      raw: { spec: {} },
      subscriptionModel: {
        'mortgagedc-subscription-braveman': {},
        'mortgagedc-subscription-braveman2': {},
      },
    },
    type: 'subscription',
  }

  it('returns false for regular subscription', () => {
    // Regular subscriptions (not deployable) should return false
    expect(isDeployableResource(node)).toEqual(false)
  })
})

/**
 * Test suite for isDeployableResource function - deployable subscription scenario
 */
describe('isDeployableResource for deployable subscription', () => {
  const node = {
    id: 'member--member--deployable--member--clusters--birsan2-remote--default--val-op-subscription-1-tmp-val-op-subscription-1-main-operators-config-cert-manager-operator-rhmp-test-subscription--subscription--cert-manager-operator-rhmp-test',
    name: 'cert-manager-operator-rhmp-test',
    namespace: 'default',
    specs: {
      raw: {
        spec: {
          apiVersion: 'operators.coreos.com/v1alpha1',
          kind: 'Subscription',
        },
      },
    },
    type: 'subscription',
  }

  it('returns true for deployable subscription', () => {
    // Deployable subscriptions (with deployable in ID) should return true
    expect(isDeployableResource(node)).toEqual(true)
  })
})

/**
 * Test suite for getRouteNameWithoutIngressHash function - non-route scenario
 * This function removes ingress hash from route names when applicable
 */
describe('getRouteNameWithoutIngressHash', () => {
  const node = {
    apigroup: 'apps.open-cluster-management.io',
    apiversion: 'v1',
    channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
    cluster: 'local-cluster',
    kind: 'subscription',
    label:
      'app=ingress-nginx; hosting-deployable-name=ingress-nginx-subscription-1-deployable; subscription-pause=false',
    localPlacement: 'true',
    name: 'ingress-nginx-subscription-1-local',
    namespace: 'default',
    selfLink:
      '/apis/apps.open-cluster-management.io/v1/namespaces/default/subscriptions/ingress-nginx-subscription-1-local',
    status: 'Subscribed',
    timeWindow: 'none',
    _gitbranch: 'main',
    _gitpath: 'nginx',
    _hostingDeployable: 'local-cluster/ingress-nginx-subscription-1-deployable-66dlk',
    _hostingSubscription: 'default/ingress-nginx-subscription-1',
    _hubClusterResource: 'true',
    _rbac: 'default_apps.open-cluster-management.io_subscriptions',
    _uid: 'local-cluster/748df82d-cf54-4044-96b6-eb10d8705952',
  }

  it('returns same name since this is not Route object', () => {
    // Non-route objects should return the original name unchanged
    expect(getRouteNameWithoutIngressHash(node, node.name)).toEqual(node.name)
  })
})

/**
 * Test suite for getRouteNameWithoutIngressHash function - route with ingress hash scenario
 */
describe('getRouteNameWithoutIngressHash', () => {
  const node = {
    apigroup: 'route.openshift.io',
    apiversion: 'v1',
    cluster: 'local-cluster',
    kind: 'route',
    name: 'nginx-virtual-host-ingress-placement-t28kg',
    namespace: 'default',
    selfLink: '/apis/route.openshift.io/v1/namespaces/default/routes/nginx-virtual-host-ingress-placement-t28kg',
    _hostingDeployable:
      'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples-Ingress-nginx-virtual-host-ingress-placement',
    _hostingSubscription: 'default/ingress-nginx-subscription-1-local',
    _hubClusterResource: 'true',
    _rbac: 'default_route.openshift.io_routes',
    _uid: 'local-cluster/317a533e-95f5-4a7e-b450-9437ea4dc7ee',
  }

  it('returns name without hash since this is a Route object generated from Ingress', () => {
    // Route objects generated from Ingress should have hash removed from name
    expect(getRouteNameWithoutIngressHash(node, node.name)).toEqual('nginx-virtual-host-ingress-placement')
  })
})

/**
 * Test suite for getRouteNameWithoutIngressHash function - regular route scenario
 */
describe('getRouteNameWithoutIngressHash', () => {
  const node = {
    apigroup: 'route.openshift.io',
    apiversion: 'v1',
    cluster: 'local-cluster',
    kind: 'route',
    name: 'nginx',
    namespace: 'default',
    selfLink: '/apis/route.openshift.io/v1/namespaces/default/routes/nginx',
    _hostingDeployable:
      'ggithubcom-open-cluster-management-demo-subscription-gitops-ns/ggithubcom-open-cluster-management-demo-subscription-gitops-Route-nginx',
    _hostingSubscription: 'default/route-ingress-subscription-1-local',
    _hubClusterResource: 'true',
    _rbac: 'default_route.openshift.io_routes',
    _uid: 'local-cluster/a5790b59-7555-4805-8596-4b901bb824d0',
  }

  it('returns same name since this is a Route object but not generated by Ingress', () => {
    // Regular route objects (not from Ingress) should return original name
    expect(getRouteNameWithoutIngressHash(node, node.name)).toEqual('nginx')
  })
})

/**
 * Test suite for getOnlineClusters function - cluster status scenarios
 */
describe('getOnlineCluster ok and pending', () => {
  //const clusterNamesA = ["cluster1", "cluster2", "cluster3"];
  const clusterObjs = [
    {
      metadata: {
        name: 'cluster1',
      },
      status: 'ok',
    },
    {
      metadata: {
        name: 'cluster2',
      },
      status: 'pendingimport',
    },
    {
      metadata: {
        name: 'cluster3',
      },
      status: 'offline',
    },
  ]
  const node = {
    specs: {
      clustersNames: ['cluster1', 'cluster2', 'cluster3'],
      searchClusters: clusterObjs,
    },
  }
  it('should process cluster node status', () => {
    // Should include clusters with 'ok' and 'pendingimport' status, plus local cluster
    expect(getOnlineClusters(node, 'local-cluster')).toEqual(['cluster1', 'cluster2', 'local-cluster'])
  })
})

/**
 * Test suite for getActiveFilterCodes function
 * This function converts status types to filter codes
 */
describe('getActiveFilterCodes all statuses filtered', () => {
  const resourceStatuses = new Set(['green', 'yellow', 'orange', 'red'])

  it('should get filter codes', () => {
    // Should convert status strings to numeric codes (green=3, yellow=2, orange=1, red=0)
    expect(getActiveFilterCodes(resourceStatuses)).toEqual(new Set([3, 2, 1, 0]))
  })
})

/**
 * Test suite for filterSubscriptionObject function
 * This function filters subscription objects based on active filter codes
 */
describe('filterSubscriptionObject simple subscription object', () => {
  const subs = {
    sub1: [
      {
        status: 'Subscribed',
      },
    ],
    sub2: [
      {
        status: 'Propagated',
      },
    ],
    sub3: [
      {
        status: 'Fail',
      },
    ],
  }
  const resultSubs = {
    sub1: { status: 'Subscribed' },
    sub2: { status: 'Propagated' },
    sub3: { status: 'Fail' },
  }

  it('should filter object', () => {
    // Should filter and flatten subscription objects based on status codes
    expect(filterSubscriptionObject(subs, new Set([3, 2, 0]))).toEqual(resultSubs)
  })
})

/**
 * Test suite for getClusterHost function
 * This function extracts hostname from cluster console URLs
 */
describe('getClusterHost', () => {
  it('should host from cluster URL', () => {
    // Should extract hostname from console URL
    expect(getClusterHost('https://console-openshift-console.somehost')).toEqual('somehost')
  })
})

/**
 * Test suite for getPulseStatusForSubscription function - no status scenario
 * This function determines the pulse status for subscription nodes
 */
describe('getPulseStatusForSubscription no subscriptionItem.status', () => {
  const node = {
    id: 'member--subscription--default--mortgagedc-subscription',
    name: 'mortgagedcNOStatus',
    specs: {
      raw: { spec: {} },
      subscriptionModel: {
        'mortgagedc-subscription-braveman': [],
        'mortgagedc-subscription-braveman2': [],
      },
      row: 12,
    },
    type: 'subscription',
  }

  it('getPulseStatusForSubscription no subscriptionItem.status', () => {
    // Subscriptions without status should return yellow pulse
    expect(getPulseStatusForSubscription(node)).toEqual('yellow')
  })
})

/**
 * Test suite for getPulseStatusForSubscription function - green pulse scenario
 */
describe('getPulseStatusForSubscription returns green pulse', () => {
  const node = {
    id: 'member--subscription--sahar-multins--sahar-multi-sample-subscription-1',
    name: 'mortgagedcNOStatus',
    specs: {
      clustersNames: ['local-cluster', 'braveman', 'braveman2'],
      searchClusters: [
        { name: 'local-cluster', status: 'OK' },
        { name: 'braveman', status: 'OK' },
        { name: 'braveman2', status: 'OK' },
      ],
      raw: { spec: { clustersNames: ['local-cluster'] } },
      subscriptionModel: {
        'mortgagedc-subscription-braveman': [{ status: 'Subscribed', cluster: 'braveman' }],
        'mortgagedc-subscription-braveman2': [{ status: 'Subscribed', cluster: 'braveman2' }],
      },
      row: 12,
    },
    type: 'subscription',
  }

  it('getPulseStatusForSubscription returns green pulse', () => {
    // Subscriptions with all successful statuses should return green pulse
    expect(getPulseStatusForSubscription(node)).toEqual('green')
  })
})

/**
 * Test suite for getPulseStatusForSubscription function - failed package scenario
 */
describe('getPulseStatusForSubscription package with Failed phase in statuses', () => {
  const node = {
    id: 'member--subscription--sahar-multins--sahar-multi-sample-subscription-1',
    name: 'mortgagedcNOStatus',
    specs: {
      searchClusters: [{ name: 'local-cluster', status: 'OK' }],
      raw: {
        spec: { clustersNames: ['local-cluster'] },
        status: {
          statuses: {
            'local-cluster': {
              packages: { 'ggithubcom-testrepo-ConfigMap': { phase: 'Failed' } },
            },
          },
        },
      },
      subscriptionModel: {
        'mortgagedc-subscription-braveman': [{ status: 'Subscribed' }],
        'mortgagedc-subscription-braveman2': [{ status: 'Subscribed' }],
      },
      row: 12,
    },
    type: 'subscription',
  }

  it('getPulseStatusForSubscription return yellow status', () => {
    // Subscriptions with failed packages should return yellow pulse
    expect(getPulseStatusForSubscription(node)).toEqual('yellow')
  })
})

/**
 * Test suite for syncControllerRevisionPodStatusMap function
 * This function synchronizes controller revision pod status information
 */
describe('syncControllerRevisionPodStatusMap', () => {
  const resourceMap = {
    'daemonset-mortgageds-deploy-fxiang-eks': {
      specs: {
        daemonsetModel: {
          'mortgageds-deploy-fxiang-eks': {
            apigroup: 'apps',
            apiversion: 'v1',
            available: 6,
            cluster: 'fxiang-eks',
            created: '2021-01-25T21:53:12Z',
            current: 6,
            desired: 6,
            kind: 'daemonset',
            label: 'app=mortgageds-mortgage',
            name: 'mortgageds-deploy',
            namespace: 'feng',
            ready: 6,
            selfLink: '/apis/apps/v1/namespaces/feng/daemonsets/mortgageds-deploy',
            updated: 6,
            _clusterNamespace: 'fxiang-eks',
            _hostingDeployable: 'mortgageds-ch/mortgageds-channel-DaemonSet-mortgageds-deploy',
            _hostingSubscription: 'feng/mortgageds-subscription',
            _rbac: 'fxiang-eks_apps_daemonsets',
            _uid: 'fxiang-eks/ff6fb8f2-d3ec-433a-93d4-3d4389a8c4b4',
          },
        },
      },
    },
    'controllerrevision-mortgageds-deploy-fxiang-eks': {
      specs: {
        parent: {
          parentId:
            'member--member--deployable--member--clusters--fxiang-eks--feng--mortgageds-subscription-mortgageds-mortgageds-deploy-daemonset--daemonset--mortgageds-deploy',
          parentName: 'mortgageds-deploy',
          parentType: 'daemonset',
        },
      },
    },
  }

  const resourceMap2 = {
    'daemonset-mortgageds-deploy-': {
      specs: {
        daemonsetModel: {
          'mortgageds-deploy-fxiang-eks': {
            apigroup: 'apps',
            apiversion: 'v1',
            available: 6,
            cluster: 'fxiang-eks',
            created: '2021-01-25T21:53:12Z',
            current: 6,
            desired: 6,
            kind: 'daemonset',
            label: 'app=mortgageds-mortgage',
            name: 'mortgageds-deploy',
            namespace: 'feng',
            ready: 6,
            selfLink: '/apis/apps/v1/namespaces/feng/daemonsets/mortgageds-deploy',
            updated: 6,
            _clusterNamespace: 'fxiang-eks',
            _hostingDeployable: 'mortgageds-ch/mortgageds-channel-DaemonSet-mortgageds-deploy',
            _hostingSubscription: 'feng/mortgageds-subscription',
            _rbac: 'fxiang-eks_apps_daemonsets',
            _uid: 'fxiang-eks/ff6fb8f2-d3ec-433a-93d4-3d4389a8c4b4',
          },
        },
      },
    },
    'controllerrevision-mortgageds-deploy-fxiang-eks': {
      specs: {
        parent: {
          parentId:
            'member--member--deployable--member--clusters--fxiang-eks--feng--mortgageds-subscription-mortgageds-mortgageds-deploy-daemonset--daemonset--mortgageds-deploy',
          parentName: 'mortgageds-deploy',
          parentType: 'daemonset',
        },
      },
    },
  }

  const resourceMapNoParentPodModel = {
    'daemonset-mortgageds-deploy-fxiang-eks': {
      specs: {
        daemonsetModel: {
          'mortgageds-deploy-fxiang-eks': {
            apigroup: 'apps',
            apiversion: 'v1',
            available: 6,
            cluster: 'fxiang-eks',
            created: '2021-01-25T21:53:12Z',
            current: 6,
            desired: 6,
            kind: 'daemonset',
            label: 'app=mortgageds-mortgage',
            name: 'mortgageds-deploy',
            namespace: 'feng',
            ready: 6,
            selfLink: '/apis/apps/v1/namespaces/feng/daemonsets/mortgageds-deploy',
            updated: 6,
            _clusterNamespace: 'fxiang-eks',
            _hostingDeployable: 'mortgageds-ch/mortgageds-channel-DaemonSet-mortgageds-deploy',
            _hostingSubscription: 'feng/mortgageds-subscription',
            _rbac: 'fxiang-eks_apps_daemonsets',
            _uid: 'fxiang-eks/ff6fb8f2-d3ec-433a-93d4-3d4389a8c4b4',
          },
        },
      },
    },
    'controllerrevision-mortgageds-deploy-fxiang-eks': {
      specs: {
        parent: {
          parentId:
            'member--member--deployable--member--clusters--fxiang-eks--feng--mortgageds-subscription-mortgageds-mortgageds-deploy-daemonset--daemonset--mortgageds-deploy',
          parentName: 'mortgageds-deploy',
          parentType: 'daemonset',
        },
      },
    },
  }

  it('should sync controllerRevision resource', () => {
    // Should successfully sync controller revision with parent daemonset
    expect(syncControllerRevisionPodStatusMap(resourceMap)).toEqual(undefined)
  })

  it('should sync controllerRevision resource, no cluster on map key', () => {
    // Should handle cases where cluster is not in the map key
    expect(syncControllerRevisionPodStatusMap(resourceMap2)).toEqual(undefined)
  })

  it('should not sync controllerRevision resource', () => {
    // Should handle cases where parent pod model is missing
    expect(syncControllerRevisionPodStatusMap(resourceMapNoParentPodModel)).toEqual(undefined)
  })
})

/**
 * Test suite for fixMissingStateOptions function
 * This function fixes missing available/ready state options in resource items
 */
describe('fixMissingStateOptions', () => {
  const itemNoAvailableReady = [
    {
      _uid: 'fxiang-eks/7c30f5d2-a522-40be-a8a6-5e833012b17b',
      apiversion: 'v1',
      created: '2021-01-28T19:24:10Z',
      current: 1,
      apigroup: 'apps',
      kind: 'statefulset',
      name: 'mariadb',
      namespace: 'val-mariadb-helm',
      selfLink: '/apis/apps/v1/namespaces/val-mariadb-helm/statefulsets/mariadb',
      cluster: 'fxiang-eks',
      desired: 1,
      label:
        'app.kubernetes.io/component=primary; app.kubernetes.io/instance=mariadb; app.kubernetes.io/managed-by=Helm; app.kubernetes.io/name=mariadb; helm.sh/chart=mariadb-9.3.0',
      _clusterNamespace: 'fxiang-eks',
      _rbac: 'fxiang-eks_apps_statefulsets',
    },
  ]

  const itemNoAvailable = [
    {
      _uid: 'fxiang-eks/7c30f5d2-a522-40be-a8a6-5e833012b17b',
      apiversion: 'v1',
      created: '2021-01-28T19:24:10Z',
      current: 1,
      apigroup: 'apps',
      kind: 'statefulset',
      name: 'mariadb',
      namespace: 'val-mariadb-helm',
      selfLink: '/apis/apps/v1/namespaces/val-mariadb-helm/statefulsets/mariadb',
      cluster: 'fxiang-eks',
      desired: 1,
      ready: 1,
      label:
        'app.kubernetes.io/component=primary; app.kubernetes.io/instance=mariadb; app.kubernetes.io/managed-by=Helm; app.kubernetes.io/name=mariadb; helm.sh/chart=mariadb-9.3.0',
      _clusterNamespace: 'fxiang-eks',
      _rbac: 'fxiang-eks_apps_statefulsets',
    },
  ]

  const itemComplete = [
    {
      _uid: 'fxiang-eks/7c30f5d2-a522-40be-a8a6-5e833012b17b',
      apiversion: 'v1',
      created: '2021-01-28T19:24:10Z',
      current: 1,
      apigroup: 'apps',
      kind: 'statefulset',
      name: 'mariadb',
      namespace: 'val-mariadb-helm',
      selfLink: '/apis/apps/v1/namespaces/val-mariadb-helm/statefulsets/mariadb',
      cluster: 'fxiang-eks',
      desired: 1,
      ready: 1,
      label:
        'app.kubernetes.io/component=primary; app.kubernetes.io/instance=mariadb; app.kubernetes.io/managed-by=Helm; app.kubernetes.io/name=mariadb; helm.sh/chart=mariadb-9.3.0',
      _clusterNamespace: 'fxiang-eks',
      _rbac: 'fxiang-eks_apps_statefulsets',
      available: 1,
    },
  ]

  it('should get complete item when no available and ready set', () => {
    // Should set available to current when both available and ready are missing
    expect(fixMissingStateOptions(itemNoAvailableReady)).toEqual(itemComplete)
  })

  it('should get complete item when no available', () => {
    // Should set available to ready when available is missing but ready exists
    expect(fixMissingStateOptions(itemNoAvailable)).toEqual(itemComplete)
  })

  it('should get complete item when full data set', () => {
    // Should return unchanged when all fields are present
    expect(fixMissingStateOptions(itemComplete)).toEqual(itemComplete)
  })
})

/**
 * Test suite for namespaceMatchTargetServer function
 * This function checks if a namespace matches the target server configuration
 */
describe('namespaceMatchTargetServer', () => {
  const relatedKind = {
    apigroup: 'route.openshift.io',
    apiversion: 'v1',
    cluster: 'ui-dev-remote',
    created: '2021-02-10T02:32:02Z',
    kind: 'route',
    label: 'app.kubernetes.io/instance=helloworld-remote; app=helloworld-app',
    name: 'helloworld-app-route',
    namespace: 'argo-helloworld',
    selfLink: '/apis/route.openshift.io/v1/namespaces/argo-helloworld/routes/helloworld-app-route',
    _clusterNamespace: 'ui-dev-remote',
    _rbac: 'ui-dev-remote_route.openshift.io_routes',
    _uid: 'ui-dev-remote/ee84f8f5-bb3e-4c67-a918-2804e74f3f67',
  }

  const resourceMapForObject = {
    clusters: {
      specs: {
        clusters: [
          {
            destination: {
              namespace: 'argo-helloworld',
              server: 'https://kubernetes.default.svc',
            },
            metadata: {
              name: 'local-cluster',
              namespace: 'local-cluster',
            },
            status: 'ok',
          },
          {
            destination: {
              namespace: 'argo-helloworld',
              server: 'https://api.app-aws-4615-zhl45.dev06.red-chesterfield.com:6443',
            },
            metadata: {
              name: 'app-aws-4615-zhl45',
              namespace: 'app-aws-4615-zhl45',
            },
            status: 'ok',
          },
          {
            destination: {
              name: 'ui-dev-remote',
              namespace: 'argo-helloworld2',
            },
            metadata: {
              name: 'ui-dev-remote',
              namespace: 'ui-dev-remote',
            },
            status: 'ok',
          },
        ],
      },
    },
  }

  it('should match the target server', () => {
    // Should return true when namespace matches target server configuration
    expect(namespaceMatchTargetServer(relatedKind, resourceMapForObject)).toEqual(true)
  })
})

/**
 * Test suite for getNameWithoutVolumePostfix function
 * This function removes volume postfix from VM names
 */
describe('getNameWithoutVolumePostfix', () => {
  it('getNameWithoutVolumePostfix VM name', () => {
    // Should remove '-volume' postfix from VM names
    expect(getNameWithoutVolumePostfix('fedora-plum-walrus-98-volume')).toEqual('fedora-plum-walrus-98')
  })
})

/**
 * Test suite for getNameWithoutVMTypeHash function
 * This function removes VM type hash from resource names
 */
describe('getNameWithoutVMTypeHash', () => {
  const resource = {
    name: 'fedora-plum-walrus-98-u1.nano-8c88fd46-b8eb-44cd-b27f-62b78bb46494-1',
    label:
      'instancetype.kubevirt.io/object-generation=1; instancetype.kubevirt.io/object-kind=VirtualMachineClusterInstancetype; instancetype.kubevirt.io/object-name=u1.nano; instancetype.kubevirt.io/object-uid=8c88fd46-b8eb-44cd-b27f-62b78bb46494; instancetype.kubevirt.io/object-version=v1beta1',
  }
  it('getNameWithoutVMTypeHash controllerrevision name', () => {
    // Should extract VM name from controller revision name using instance type labels
    expect(getNameWithoutVMTypeHash(resource)).toEqual('fedora-plum-walrus-98')
  })
})

/**
 * Test suite for getNameWithoutVMTypeHash function - no label scenario
 */
describe('getNameWithoutVMTypeHash no label', () => {
  const resource = {
    name: 'fedora-plum-walrus-98-u1.nano-8c88fd46-b8eb-44cd-b27f-62b78bb46494-1',
  }
  it('getNameWithoutVMTypeHash controllerrevision no label', () => {
    // Should return original name when no instance type labels are present
    expect(getNameWithoutVMTypeHash(resource)).toEqual(resource.name)
  })
})

/**
 * Test suite for getVMNameWithoutPodHash function
 * This function extracts VM name from virt-launcher pod names
 */
describe('getVMNameWithoutPodHash', () => {
  const resource = {
    name: 'virt-launcher-fedora-plum-walrus-98-xn828',
    label:
      'kubevirt.io=virt-launcher; kubevirt.io/created-by=f70fabbc-1d94-4a8e-ab8b-164cb66dce9c; kubevirt.io/nodeName=fog28.acm.lab.eng.rdu2.redhat.com; vm.kubevirt.io/name=fedora-plum-walrus-98',
  }
  it('getVMNameWithoutPodHash pod name', () => {
    // Should extract VM name from virt-launcher pod using vm.kubevirt.io/name label
    expect(getVMNameWithoutPodHash(resource)).toEqual('fedora-plum-walrus-98')
  })
})

/**
 * Test suite for getVMNameWithoutPodHash function - no label scenario
 */
describe('getVMNameWithoutPodHash', () => {
  const resource = {
    name: 'virt-launcher-fedora-plum-walrus-98-xn828',
  }
  it('getVMNameWithoutPodHash pod name', () => {
    // Should return original name when no VM labels are present
    expect(getVMNameWithoutPodHash(resource)).toEqual(resource.name)
  })
})
