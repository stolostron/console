/* Copyright Contributors to the Open Cluster Management project */
/* eslint no-param-reassign: "error" */

import { nodeMustHavePods } from '../helpers/diagram-helpers-utils'
import { convertStringToQuery } from '../helpers/search-helper'
import type { ApplicationData, ManagedCluster, SearchQuery, Topology, TopologyLink, TopologyNode } from '../types'
import { deepClone } from '../utils'

/**
 * Constructs a search query string for finding specific Kubernetes resources.
 * This function builds search queries with appropriate filters for resource kind,
 * name, namespace, and cluster to locate deployed resources.
 *
 * @param resourcename - The Kubernetes resource kind or array of kinds to search for
 * @param name - Optional resource name to filter by
 * @param namespace - Optional namespace to filter by (can be comma-separated list)
 * @param cluster - Optional cluster name to filter by
 * @returns Formatted search query object with appropriate filters
 */
export const getQueryStringForResource = (
  resourcename: string | string[] | null,
  name: string | null,
  namespace: string | null,
  cluster?: string
): SearchQuery => {
  let resource = ''
  const nameForQuery = name ? `name:${name}` : ''
  const namespaceForQuery = namespace ? ` namespace:${namespace}` : ''
  const clusterForQuery = cluster ? ` cluster:${cluster}` : ''

  if (resourcename) {
    switch (resourcename) {
      case 'Subscription':
        resource = 'kind:subscription '
        break
      case 'Application':
        resource = 'kind:application'
        break
      default:
        resource = `kind:${resourcename} `
    }
  }

  return convertStringToQuery(`${resource} ${nameForQuery} ${namespaceForQuery} ${clusterForQuery}`)
}

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
  const sortedClusterNames = [...clusterNames].sort((a, b) => a.localeCompare(b))
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
  // filter clusters to only include those in the clusterNames array provided by toolbar
  const clusters = deepClone(
    managedClusters.filter(
      (cluster) =>
        !clusterNames ||
        clusterNames.length === 0 ||
        clusterNames.includes(cluster?.name ?? (cluster?.metadata as { name?: string })?.name ?? '')
    )
  )
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
      clusters,
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

// Extract unique resource kinds from resources, sorted with Deployment/ReplicaSet/Pod at end
export const getResourceTypes = (resources: Array<Record<string, unknown>>): string[] => {
  const types = Array.from(new Set(resources.map((resource) => resource.kind as string))).sort()
  if (types.includes('Deployment')) {
    const priority = ['Deployment', 'ReplicaSet', 'Pod']
    return [...priority, ...types.filter((t) => !priority.includes(t))]
  }
  return types
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

// Resource types that typically have pods as children
const typesWithPods = ['replicaset', 'replicationcontroller', 'statefulset', 'daemonset']

/**
 * Creates replica child nodes (ReplicaSet/ReplicationController and Pods) for Deployments and DeploymentConfigs
 *
 * @param parentNode - Parent deployment object
 * @param clustersNames - Array of cluster names
 * @param template - Resource template with related resource information
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The created pod node or undefined
 */
export const createReplicaChild = (
  parentNode: TopologyNode,
  clustersNames: string[],
  template: unknown,
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode | undefined => {
  const parentType = parentNode?.type || ''

  if (parentType === 'deploymentconfig' || parentType === 'deployment') {
    const type = parentType === 'deploymentconfig' ? 'replicationcontroller' : 'replicaset'

    if (template && (template as any).related) {
      const relatedMap = Object.fromEntries(((template as any).related || []).map((item: any) => [item.kind, item]))

      // Check for replica resources in related objects
      if (
        relatedMap['replicaset'] ||
        relatedMap['ReplicaSet'] ||
        relatedMap['replicationcontroller'] ||
        relatedMap['ReplicationController']
      ) {
        const pNode = createChildNode(parentNode, clustersNames, type, activeTypes, links, nodes)
        const replicaCount =
          (
            relatedMap['replicaset'] ||
            relatedMap['ReplicaSet'] ||
            relatedMap['replicationcontroller'] ||
            relatedMap['ReplicationController']
          )?.items?.[0]?.desired || 0
        return createChildNode(pNode, clustersNames, 'pod', activeTypes, links, nodes, replicaCount)
      } else if (relatedMap['pod'] || relatedMap['Pod']) {
        // Direct pod relationship without replica controller
        return createChildNode(parentNode, clustersNames, 'pod', activeTypes, links, nodes)
      }
    } else {
      // Create replica child without template information
      const pNode = createChildNode(parentNode, clustersNames, type, activeTypes, links, nodes)
      if (typesWithPods.includes(type)) {
        return createChildNode(pNode, clustersNames, 'pod', activeTypes, links, nodes)
      }
    }
  }
  return undefined
}

// Create a typed child node under a parent topology node and link them
export const createChildNode = (
  parentNode: TopologyNode,
  clustersNames: string[],
  type: string,
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[],
  replicaCount: number = 1
): TopologyNode => {
  const parentType = (parentNode.type ?? '') as string
  const { name, namespace, id, specs = {} } = parentNode
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
  return addTopologyNode(parentNode.id || '', node, activeTypes, links, nodes)
}

/**
 * Creates route child nodes for Ingress resources
 *
 * @param parentNode - Parent ingress object
 * @param clustersNames - Array of cluster names
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The created route node or undefined
 */
export const createIngressRouteChild = (
  parentNode: TopologyNode,
  clustersNames: string[],
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode | undefined => {
  const parentType = parentNode?.type || ''
  if (parentType === 'ingress') {
    const type = 'route'
    return createChildNode(parentNode, clustersNames, type, activeTypes, links, nodes)
  }
  return undefined
}

/**
 * Creates controller revision child nodes for DaemonSet, StatefulSet, and VirtualMachine resources
 *
 * @param parentNode - Parent object
 * @param clustersNames - Array of cluster names
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The created controller revision node or undefined
 */
export const createControllerRevisionChild = (
  parentNode: TopologyNode,
  clustersNames: string[],
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode | undefined => {
  const parentType = parentNode?.type || ''
  if (parentType === 'daemonset' || parentType === 'statefulset' || parentType === 'virtualmachine') {
    const pNode = createChildNode(parentNode, clustersNames, 'controllerrevision', activeTypes, links, nodes)

    // Create pod children for non-virtual machine types
    if (parentType !== 'virtualmachine') {
      return createChildNode(pNode, clustersNames, 'pod', activeTypes, links, nodes)
    }
    return pNode
  }
  return undefined
}

/**
 * Creates data volume child nodes for VirtualMachine resources
 *
 * @param parentNode - Parent virtual machine object
 * @param clustersNames - Array of cluster names
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The created persistent volume claim node or parent object
 */
export const createDataVolumeChild = (
  parentNode: TopologyNode,
  clustersNames: string[],
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode => {
  const parentType = parentNode?.type || ''
  if (parentType === 'virtualmachine') {
    const pNode = createChildNode(parentNode, clustersNames, 'datavolume', activeTypes, links, nodes)
    return createChildNode(pNode, clustersNames, 'persistentvolumeclaim', activeTypes, links, nodes)
  }
  return parentNode
}

/**
 * Creates virtual machine instance child nodes for VirtualMachine resources
 *
 * @param parentNode - Parent virtual machine object
 * @param clustersNames - Array of cluster names
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The created pod node or parent object
 */
export const createVirtualMachineInstance = (
  parentNode: TopologyNode,
  clustersNames: string[],
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode => {
  const parentType = parentNode?.type || ''
  if (parentType === 'virtualmachine') {
    const pNode = createChildNode(parentNode, clustersNames, 'virtualmachineinstance', activeTypes, links, nodes)
    return createChildNode(pNode, clustersNames, 'pod', activeTypes, links, nodes)
  }
  return parentNode
}

/**
 * Creates pod child nodes for ReplicaSet and ReplicationController resources
 *
 * @param parentNode - Parent replica object
 * @param clustersNames - Array of cluster names
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The created pod node or undefined
 */
export const createPodChild = (
  parentNode: TopologyNode,
  clustersNames: string[],
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode | undefined => {
  const parentType = parentNode?.type || ''
  if (parentType === 'replicaset' || parentType === 'replicationcontroller') {
    return createChildNode(parentNode, clustersNames, 'pod', activeTypes, links, nodes)
  }
  return undefined
}

export const addTopologyNode = (
  parentId: string,
  node: TopologyNode,
  activeTypes: string[] | undefined,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode => {
  if (
    !activeTypes ||
    activeTypes.length === 0 ||
    activeTypes.map((t) => t.toLowerCase()).includes(node.type.toLowerCase())
  ) {
    nodes.push(node)
    links.push({
      from: { uid: parentId },
      to: { uid: node.id || '' },
      type: '',
    })
    return node
  }
  return { ...node, id: parentId }
}
