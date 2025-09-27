/* Copyright Contributors to the Open Cluster Management project */
/* eslint no-param-reassign: "error" */

import { nodeMustHavePods } from './helpers/diagram-helpers-utils'
import type { ApplicationData, ManagedCluster, Topology, TopologyLink, TopologyNode } from '../types'
import { deepClone } from '../utils'

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
  const parentType = (parentObject.type ?? '') as string
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
        parentSpecs: (specs as any)?.parent?.parentSpecs,
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
  const sortedClusterNames = [...clusterNames].sort()
  let clusterId = 'member--clusters'
  // do not use this for the id for argo app, we only know about one app here
  if (subscription) {
    const cns = sortedClusterNames.join('--')
    const sub = (subscription as any)?.metadata?.name as string | undefined
    clusterId = `member--clusters--${cns}--${sub}`
  } else {
    clusterId = 'member--clusters--'
  }
  const topoClusterNode = topology ? topology.nodes.find((node) => node.id === 'member--clusters') : undefined
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
      clusters: deepClone(managedClusters),
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
    isArgoApp = (appNode.specs?.raw as any)?.apiVersion?.indexOf('argo') !== -1 || false
    result.isArgoApp = isArgoApp
    // get argo app destination namespaces 'show_search'
    if (isArgoApp) {
      const applicationSetRef = ((appNode.specs?.raw as any)?.metadata?.ownerReferences ?? []).find(
        (owner: Record<string, string>) =>
          owner.apiVersion.startsWith('argoproj.io/') && owner.kind === 'ApplicationSet'
      )
      if (applicationSetRef) {
        result.applicationSet = applicationSetRef.name
      }
      let cluster = hubClusterName
      const clusterNames = (appNode.specs?.clusterNames ?? []) as string[]
      if (clusterNames.length > 0) {
        cluster = clusterNames[0]
      }
      result.cluster = cluster
      result.source = ((appNode.specs?.raw as any)?.spec?.source ?? {}) as Record<string, unknown>
    }
  }
  nodes?.forEach((node) => {
    const type = (node.type ?? '') as string
    const nodeType = type === 'project' ? 'namespace' : type
    if (!(isArgoApp && ['cluster'].includes(nodeType))) {
      nodeTypes.push(nodeType) // ask for this related object type
    }
    if (nodeMustHavePods(node as unknown as Record<string, unknown>)) {
      // request pods when asking for related resources, this resource can have pods
      resourceMustHavePods = true
    }
    if (nodeType === 'subscription') {
      subscriptionName = (node.name ?? '') as string
      nbOfSubscriptions = nbOfSubscriptions + 1
    }
  })

  if (resourceMustHavePods) {
    nodeTypes.push('pod')
  }

  // if only one subscription, ask for resources only related to that subscription
  result.subscription = nbOfSubscriptions === 1 ? subscriptionName : null
  // ask only for these type of resources since only those are displayed
  result.relatedKinds = [...new Set(nodeTypes)]

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
    const groupByKind: Record<string, Array<Record<string, unknown>>> = {}
    resources.forEach((resource) => {
      const kind = resource.kind as string
      if (!groupByKind[kind]) {
        groupByKind[kind] = []
      }
      groupByKind[kind].push(resource)
    })
    return Object.entries(groupByKind).map(([kind, resourcesGroup]) => {
      const typedResourcesGroup = resourcesGroup as Array<Record<string, unknown>>
      if (typedResourcesGroup.length === 1) {
        return typedResourcesGroup[0]
      } else {
        return {
          kind,
          name: '',
          namespace: '',
          resources: typedResourcesGroup,
          resourceCount:
            numOfDeployedClusters > 0 ? typedResourcesGroup.length * numOfDeployedClusters : typedResourcesGroup.length,
        }
      }
    })
  }
  return resources
}
