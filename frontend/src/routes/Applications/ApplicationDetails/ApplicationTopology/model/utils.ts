/* Copyright Contributors to the Open Cluster Management project */
/* eslint no-param-reassign: "error" */

import _ from 'lodash'
import { nodeMustHavePods } from '../helpers/diagram-helpers-utils'
import type { ApplicationData, ManagedCluster, Topology, TopologyLink, TopologyNode } from './types'

// Extract cluster name encoded in a node id; fall back to hub cluster if not encoded
export const getClusterName = (nodeId: string | undefined, hubClusterName?: string): string => {
  if (nodeId === undefined) {
    return ''
  }
  const clusterIndex = nodeId.indexOf('--clusters--')
  if (clusterIndex !== -1) {
    const startPos = nodeId.indexOf('--clusters--') + 12
    const endPos = nodeId.indexOf('--', startPos)
    return nodeId.slice(startPos, endPos > 0 ? endPos : nodeId.length)
  }
  return hubClusterName ?? ''
}

// Create a typed child node under a parent topology node and link them
export const createChildNode = (
  parentObject: TopologyNode,
  clustersNames: string[],
  type: string,
  links: TopologyLink[],
  nodes: TopologyNode[],
  replicaCount: number = 1
): TopologyNode => {
  const parentType = _.get(parentObject, 'type', '') as string
  const { name, namespace, id, specs = {} } = parentObject
  const parentId = id
  const memberId = `${parentId}--${type}--${name}`
  let resources: unknown
  if ((specs as Record<string, unknown>).resources) {
    resources = (specs as { resources: Array<Record<string, unknown>> }).resources.map((res) => {
      return { ...res, kind: type }
    })
  }
  const parentResourceCount = (specs as Record<string, unknown>).resourceCount as number | undefined
  const resourceCount = parentResourceCount === 0 ? replicaCount : (parentResourceCount ?? 1) * replicaCount
  const node: TopologyNode = {
    name,
    namespace,
    type,
    id: memberId,
    uid: memberId,
    specs: {
      isDesign: false,
      resourceCount,
      resources,
      clustersNames,
      replicaCount,
      parent: {
        parentId,
        parentName: name,
        parentType,
        resources: (specs as Record<string, unknown>).resources,
        parentSpecs: _.get(specs, 'parent.parentSpecs'),
      },
    },
  }
  nodes.push(node)
  links.push({
    from: { uid: parentId },
    to: { uid: memberId },
    type: '',
  })
  return node
}

// Add a synthetic "clusters" node under a parent and link them
export const addClusters = (
  parentId: string,
  subscription: Record<string, unknown> | undefined,
  source: string,
  clusterNames: string[],
  managedClusters: ManagedCluster[],
  links: TopologyLink[],
  nodes: TopologyNode[],
  topology?: Topology
): string => {
  // create element if not already created
  const sortedClusterNames = _.sortBy(clusterNames)
  let clusterId = 'member--clusters'
  // do not use this for the id for argo app, we only know about one app here
  if (subscription) {
    const cns = sortedClusterNames.join('--')
    const sub = _.get(subscription, 'metadata.name') as string | undefined
    clusterId = `member--clusters--${cns}--${sub}`
  } else {
    clusterId = 'member--clusters--'
  }
  const topoClusterNode = topology
    ? _.find(topology.nodes, {
        id: 'member--clusters',
      })
    : undefined
  nodes.push({
    name: clusterNames.length === 1 ? clusterNames[0] : '',
    namespace: '',
    type: 'cluster',
    id: clusterId,
    uid: clusterId,
    specs: {
      title: source,
      subscription,
      resourceCount: clusterNames.length,
      clustersNames: clusterNames,
      clusters: _.cloneDeep(managedClusters),
      sortedClusterNames,
      appClusters: topoClusterNode ? (topoClusterNode as TopologyNode).specs.appClusters : undefined,
      targetNamespaces: topoClusterNode ? (topoClusterNode as TopologyNode).specs.targetNamespaces : undefined,
    },
  })
  links.push({
    from: { uid: parentId },
    to: { uid: clusterId },
    type: '',
    specs: { isDesign: true },
  })
  return clusterId
}

// Collects info needed to query Search for related kinds from the visible nodes
export const getApplicationData = (nodes: TopologyNode[] | undefined, hubClusterName: string): ApplicationData => {
  let subscriptionName = ''
  let nbOfSubscriptions = 0
  let resourceMustHavePods = false
  const nodeTypes: string[] = []
  const result: ApplicationData = {
    subscription: null,
    relatedKinds: [],
  }
  let isArgoApp = false
  const appNode = nodes?.find((r) => r.type === 'application')
  if (appNode) {
    isArgoApp = _.get(appNode, ['specs', 'raw', 'apiVersion'], '').indexOf('argo') !== -1
    result.isArgoApp = isArgoApp
    // get argo app destination namespaces 'show_search'
    if (isArgoApp) {
      const applicationSetRef = _.get(appNode, ['specs', 'raw', 'metadata', 'ownerReferences'], []).find(
        (owner: Record<string, string>) =>
          owner.apiVersion.startsWith('argoproj.io/') && owner.kind === 'ApplicationSet'
      )
      if (applicationSetRef) {
        result.applicationSet = applicationSetRef.name
      }
      let cluster = hubClusterName
      const clusterNames = _.get(appNode, ['specs', 'clusterNames'], []) as string[]
      if (clusterNames.length > 0) {
        cluster = clusterNames[0]
      }
      result.cluster = cluster
      result.source = _.get(appNode, ['specs', 'raw', 'spec', 'source'], {}) as Record<string, unknown>
    }
  }
  nodes?.forEach((node) => {
    const type = _.get(node, 'type', '') as string
    const nodeType = type === 'project' ? 'namespace' : type
    if (!(isArgoApp && _.includes(['cluster'], nodeType))) {
      nodeTypes.push(nodeType) // ask for this related object type
    }
    if (nodeMustHavePods(node as unknown as Record<string, unknown>)) {
      // request pods when asking for related resources, this resource can have pods
      resourceMustHavePods = true
    }
    if (nodeType === 'subscription') {
      subscriptionName = _.get(node, 'name', '') as string
      nbOfSubscriptions = nbOfSubscriptions + 1
    }
  })

  if (resourceMustHavePods) {
    nodeTypes.push('pod')
  }

  // if only one subscription, ask for resources only related to that subscription
  result.subscription = nbOfSubscriptions === 1 ? subscriptionName : null
  // ask only for these type of resources since only those are displayed
  result.relatedKinds = _.uniq(nodeTypes)

  return result
}

// Find an ApplicationSet cluster by name or url
export const getAppSetArgoCluster = (search: string, clusters: ManagedCluster[]): ManagedCluster | undefined => {
  return clusters.find((cluster) => cluster.name === search || (cluster as unknown as { url?: string }).url === search)
}

// Group large lists of resources by kind for presentation; multiply counts by deployed clusters
export const processMultiples = (
  resources: Array<Record<string, unknown>>,
  numOfDeployedClusters: number = 0
): Array<Record<string, unknown>> => {
  // Need to multiply the number of success clusters
  const rCount = numOfDeployedClusters > 0 ? resources.length * numOfDeployedClusters : resources.length
  if (rCount > 5) {
    const groupByKind = _.groupBy(resources, 'kind')
    return Object.entries(groupByKind).map(([kind, _resources]) => {
      if (_resources.length === 1) {
        return _resources[0]
      } else {
        return {
          kind,
          name: '',
          namespace: '',
          resources: _resources,
          resourceCount: numOfDeployedClusters > 0 ? _resources.length * numOfDeployedClusters : _resources.length,
        }
      }
    })
  }
  return resources
}
