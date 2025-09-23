// Test-specific types for diagram-helpers-utils.test.ts

import { ClusterInfo, ResourceItem, SubscriptionItem } from './types'

// Test topology node with minimal required fields for testing
export interface TestTopologyNode {
  type: string
  _lastUpdated?: number
  id?: string
  name?: string
  cluster?: string | null
  clusterName?: string | null
  clusters?: {
    specs?: {
      targetNamespaces?: Record<string, string[]>
      appClusters?: string[]
    }
  }
  specs?: {
    raw?: {
      apiVersion?: string
      kind?: string
      metadata?: {
        name?: string
        namespace?: string
      }
      spec?: Record<string, unknown>
    }
    deployStatuses?: unknown[]
    isDesign?: boolean
    parent?: {
      parentId: string
      parentName: string
      parentType: string
    }
    clustersNames?: string[]
    searchClusters?: ClusterInfo[]
    namespaceModel?: Record<string, ResourceItem[]>
    clusterroleModel?: Record<string, ResourceItem[]>
    policyModel?: Record<string, ResourceItem[]>
    pulse?: string
    shapeType?: string
    appClusters?: string[]
    targetNamespaces?: Record<string, string[]>
    clusters?: ClusterInfo[]
    subscriptionModel?: Record<string, SubscriptionItem[]>
    daemonsetModel?: Record<string, ResourceItem>
  }
  namespace?: string
}

// Test cluster node structure
export interface TestClusterNode {
  id: string
  clusters?: {
    specs?: {
      appClusters?: string[]
    }
  }
  specs?: {
    clustersNames?: string[]
    appClusters?: string[]
    targetNamespaces?: Record<string, string[]>
    searchClusters?: ClusterInfo[]
    clusters?: ClusterInfo[]
  }
}

// Test namespace node structure
export interface TestNamespaceNode extends TestTopologyNode {
  type: 'namespace'
}

// Test policy node structure
export interface TestPolicyNode extends TestTopologyNode {
  type: 'policy'
}

// Test subscription node structure (basic)
export interface TestSubscriptionNodeBasic extends Omit<TestTopologyNode, 'specs'> {
  type: 'subscription'
  specs?: {
    raw?: {
      apiVersion?: string
      kind?: string
      metadata?: {
        name?: string
        namespace?: string
      }
      spec?: Record<string, unknown>
    }
    deployStatuses?: unknown[]
    isDesign?: boolean
    parent?: {
      parentId: string
      parentName: string
      parentType: string
    }
    clustersNames?: string[]
    searchClusters?: unknown[]
    namespaceModel?: Record<string, ResourceItem[]>
    clusterroleModel?: Record<string, ResourceItem[]>
    policyModel?: Record<string, ResourceItem[]>
    pulse?: string
    shapeType?: string
    appClusters?: string[]
    targetNamespaces?: Record<string, string[]>
    clusters?: unknown[]
    subscriptionModel?: Record<string, SubscriptionItem[]>
    daemonsetModel?: Record<string, ResourceItem>
  }
}

// Test placement node structure
export interface TestPlacementNode extends TestTopologyNode {
  type: 'placements'
}

// Test resource item for search clusters
export interface TestResourceItem extends ResourceItem {
  name: string
  consoleURL?: string
  HubAcceptedManagedCluster?: string
  ManagedClusterConditionAvailable?: string
  kind?: string
  label?: string
  cluster?: string
  namespace?: string
  status?: string
  _clusterNamespace?: string
  _rbac?: string
  _uid?: string
}

// Test search clusters structure
export interface TestSearchClusters {
  items: TestResourceItem[]
}

// Additional test-specific types for diagram-helpers.test.ts

// Basic test node structure used in diagram helper tests
export interface TestNode extends Record<string, unknown> {
  specs: {
    raw: {
      metadata: {
        name: string
        namespace: string
        [key: string]: unknown
      }
      [key: string]: unknown
    }
    [key: string]: unknown
  }
}

// Test property data structure for property list tests
export interface TestPropertyData {
  labelValue: string
  value: string
}

// Test route node structure for route-related tests
export interface TestRouteNode extends Record<string, unknown> {
  type: 'route'
  name: string
  namespace: string
  id: string
  clusters?: {
    specs?: {
      clusters?: Array<{
        metadata: {
          name: string
        }
        clusterip?: string
        consoleURL?: string
      }>
    }
  }
  specs: {
    routeModel?: Record<
      string,
      Array<{
        namespace: string
        cluster: string
        kind?: string
      }>
    >
    searchClusters?: Array<{
      consoleURL: string
      metadata: {
        name: string
      }
    }>
    raw?: {
      kind: string
      metadata?: {
        namespace: string
      }
      spec?: {
        metadata?: {
          namespace: string
        }
        tls?: Record<string, unknown>
        host?: string
        rules?: Array<{
          route?: string
          [key: string]: unknown
        }>
      }
    }
    template?: {
      template: {
        kind: string
        spec: {
          metadata?: {
            namespace: string
          }
          tls?: Record<string, unknown>
          host?: string
        }
      }
    }
  }
}

// Test ingress node structure for ingress-related tests
export interface TestIngressNode {
  type: 'ingress' | string
  name: string
  namespace: string
  id: string
  specs: {
    raw: {
      kind: string
      metadata?: {
        namespace: string
      }
      spec?: {
        metadata?: {
          namespace: string
        }
        rules?: Array<{
          host: string
          http: {
            paths: Array<{
              backend: {
                serviceName: string
                servicePort: string
              }
            }>
          }
        }>
        host?: string
      }
    }
  }
}

// Test service node structure for service-related tests
export interface TestServiceNode {
  type: 'service'
  name: string
  namespace: string
  id: string
  specs: {
    serviceModel?: Record<
      string,
      Array<{
        namespace: string
        clusterIP: string
        port: string
      }>
    >
    raw: {
      metadata: {
        namespace: string
        name: string
      }
      kind: string
      spec: {
        tls?: Record<string, unknown>
        host?: string
      }
    }
  }
}

// Test subscription node structure for subscription-related tests
export interface TestSubscriptionNode extends Record<string, unknown> {
  name: string
  namespace: string
  type: 'subscription'
  id: string
  uid: string
  specs: {
    title: string
    isDesign: boolean
    hasRules: boolean
    isPlaced: boolean
    raw: {
      apiVersion: string
      kind: string
      metadata: {
        annotations?: Record<string, string>
        creationTimestamp: string
        generation: number
        labels?: Record<string, string>
        name: string
        namespace: string
        resourceVersion: string
        uid: string
      }
      spec: {
        channel: string
        name: string
        packageOverrides?: Array<{
          packageAlias: string
          packageName: string
        }>
        placement?: {
          placementRef?: {
            kind: string
            name: string
          }
        }
      }
      status?: {
        lastUpdateTime: string
        message: string
        phase: string
      }
      posthooks?: unknown[]
      prehooks?: unknown[]
      channels?: unknown[]
      decisions?: unknown[]
      placements?: unknown[]
      report?: unknown
    }
    clustersNames: string[]
    searchClusters: unknown[]
    subscriptionModel: Record<string, unknown>
    pulse: string
    shapeType: string
  }
  report?: unknown
}

// Test resource action link structure
export interface TestResourceActionLink {
  action: string
  kind?: string
  name?: string
  namespace?: string
  cluster?: string
  editLink?: string
  targetLink?: string
  routeObject?: {
    id?: string
    cluster?: string
    _uid?: string
  }
}

// Test cluster object structure
export interface TestClusterObject {
  id?: string
  cluster: string
  clusterIP?: string
  created?: string
  kind?: string
  label?: string
  name?: string
  namespace?: string
  port?: string
  selfLink?: string
  type?: string
  _uid?: string
}

// Test route object structure
export interface TestRouteObject {
  id?: string
  cluster: string
  _uid?: string
}

// Test service object structure
export interface TestServiceObject {
  cluster: string
  clusterIP: string
  created: string
  kind: string
  label: string
  name: string
  namespace: string
  port: string
  selfLink: string
  type: string
}

// Test generic link structure
export interface TestGenericLink {
  action: string
  targetLink?: string
  targetLink1?: string
}

// Test Argo link structure
export interface TestArgoLink {
  action: 'open_argo_editor'
  name: string
  namespace: string
  cluster: string
}

// Test route link structure
export interface TestRouteLink {
  action: 'open_route_url'
  name: string
  namespace: string
  cluster: string
}

// Test edit link node structure
export interface TestEditLinkNode extends Record<string, unknown> {
  name?: string
  namespace?: string
  kind?: string
  apigroup?: string
  apiversion?: string
  cluster?: string
}
