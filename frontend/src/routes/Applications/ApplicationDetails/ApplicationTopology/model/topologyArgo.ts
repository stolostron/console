/* Copyright Contributors to the Open Cluster Management project */

import { get, uniq, uniqBy } from 'lodash'
import { getClusterName, addClusters, processMultiples } from './utils'
import {
  createReplicaChild,
  createControllerRevisionChild,
  createDataVolumeChild,
  createVirtualMachineInstance,
} from './topologySubscription'
import type {
  ArgoApplicationTopologyData,
  ArgoTopologyData,
  ArgoTopologyResult,
  ArgoClusterInfo,
  ArgoDestination,
  ManagedCluster,
  TopologyNode,
  TopologyLink,
  ArgoApplicationResource,
} from './types'

/**
 * Generates topology data for Argo CD applications
 *
 * This function creates a complete topology graph for Argo CD applications, showing the
 * relationships between the application, target clusters, and deployed resources. It handles
 * both applications defined on the hub cluster and those defined on remote managed clusters.
 *
 * @param application - The Argo application data containing metadata and configuration
 * @param argoData - Argo-specific data including topology and cluster information
 * @param managedClusters - Array of managed clusters available in the system
 * @param hubClusterName - Name of the hub cluster
 * @returns Topology object containing nodes and links for visualization
 */
export function getArgoTopology(
  application: ArgoApplicationTopologyData,
  argoData: ArgoTopologyData,
  managedClusters: ManagedCluster[],
  hubClusterName: string
): ArgoTopologyResult {
  const { topology, cluster } = argoData
  const links: TopologyLink[] = []
  const nodes: TopologyNode[] = []
  let name: string
  let namespace: string

    // Extract application name and namespace
  ;({ name, namespace } = application)

  const clusters: ArgoClusterInfo[] = []
  let clusterNames: string[] = []

  // Get the destination configuration from the Argo application spec
  const destination = get(application, 'app.spec.destination', {}) as ArgoDestination

  if (cluster) {
    // Argo app defined on remote cluster
    // Set to empty string for now, depends on backend to provide argoapi from secrets
    const clusterName = getArgoDestinationCluster(destination, managedClusters, cluster, hubClusterName)
    const remoteClusterDestination = ''
    clusterNames.push(clusterName)
    clusters.push({
      metadata: { name: clusterName, namespace: clusterName },
      name: clusterName,
      remoteClusterDestination,
      status: 'ok',
    })
  } else {
    try {
      // Argo app defined on hub cluster - determine target cluster from destination
      const clusterName = getArgoDestinationCluster(destination, managedClusters, cluster, hubClusterName)
      clusterNames.push(clusterName)
      clusters.push({
        metadata: { name: clusterName, namespace: clusterName },
        name: clusterName,
        destination,
        status: 'ok',
      })
    } catch {
      // Silently handle errors in cluster determination
      // TODO: Consider proper error logging here
    }
  }

  // Remove duplicate cluster names
  clusterNames = uniq(clusterNames)

  // Extract related applications from topology data if available
  const relatedApps = topology ? topology.nodes[0]?.specs?.relatedApps : undefined

  // Create the main application node
  const appId = `application--${name}`
  nodes.push({
    name,
    namespace,
    type: 'application',
    id: appId,
    uid: appId,
    specs: {
      isDesign: true,
      resourceCount: 0,
      raw: application.app,
      activeChannel: application.activeChannel,
      allSubscriptions: [],
      allChannels: [],
      allClusters: {
        isLocal: clusterNames.includes(hubClusterName),
        remoteCount: clusterNames.includes(hubClusterName) ? clusterNames.length - 1 : clusterNames.length,
      },
      clusterNames,
      channels: application.channels,
      relatedApps,
    },
  })

  // Clean up the application spec to avoid circular references
  delete (application.app.spec as Record<string, unknown>)?.apps

  // Create cluster node and get its ID for linking deployed resources
  const source = get(application, 'app.spec.source.path', '') as string
  const clusterId = addClusters(
    appId,
    undefined, // No subscription for Argo apps
    source,
    clusterNames,
    uniqBy(clusters, 'metadata.name'),
    links,
    nodes,
    topology
  )

  // Get deployed resources from the Argo application status
  const resources = get(application, 'app.status.resources', []) as ArgoApplicationResource[]

  // Process and create nodes for each deployed resource
  processMultiples(resources).forEach((deployable) => {
    const {
      name: deployableName,
      namespace: deployableNamespace,
      kind,
      version,
      group,
      resourceCount,
      resources: deployableResources,
    } = deployable as {
      name: string
      namespace: string
      kind: string
      version?: string
      group?: string
      resourceCount?: number
      resources?: ArgoApplicationResource[]
    }

    const type = kind.toLowerCase()

    // Generate unique member ID for this deployed resource
    const memberId = `member--member--deployable--member--clusters--${getClusterName(
      clusterId,
      hubClusterName
    )}--${type}--${deployableNamespace}--${deployableName}`

    // Create raw resource object with proper metadata structure
    const raw: Record<string, unknown> = {
      metadata: {
        name: deployableName,
        namespace: deployableNamespace,
      },
      ...deployable,
    }

    // Construct API version from group and version if available
    let apiVersion: string | null = null
    if (version) {
      apiVersion = group ? `${group}/${version}` : version
    }
    if (apiVersion) {
      raw.apiVersion = apiVersion
    }

    // Create the deployable resource node
    const deployableObj: TopologyNode = {
      name: deployableName,
      namespace: deployableNamespace,
      type,
      id: memberId,
      uid: memberId,
      specs: {
        isDesign: false,
        raw,
        clustersNames: clusterNames,
        parent: {
          clusterId,
        },
        resources: deployableResources,
        resourceCount: (resourceCount || 0) + clusterNames.length,
      },
    }

    // Add the deployable node and link it to the cluster
    nodes.push(deployableObj)
    links.push({
      from: { uid: clusterId },
      to: { uid: memberId },
      type: '',
    })

    // Create child nodes for resources that typically have replicas or sub-resources
    const template = { metadata: {} }

    // Create replica child nodes if this resource defines replicas
    createReplicaChild(deployableObj, clusterNames, template, links, nodes)

    // Create controller revision child nodes for resources like StatefulSets
    createControllerRevisionChild(deployableObj, clusterNames, links, nodes)

    // Create data volume child nodes for virtualization resources
    createDataVolumeChild(deployableObj, clusterNames, links, nodes)

    // Create virtual machine instance child nodes
    createVirtualMachineInstance(deployableObj, clusterNames, links, nodes)
  })

  // Return the complete topology with unique nodes and all links
  return { nodes: uniqBy(nodes, 'uid'), links }
}

/**
 * Determines the target cluster name for an Argo application based on its destination configuration
 *
 * This function resolves the actual cluster name from various destination formats:
 * - Server URL (including the special 'https://kubernetes.default.svc' for in-cluster)
 * - Cluster name reference
 * - Special handling for 'in-cluster' references
 *
 * @param destination - The Argo application destination configuration
 * @param managedClusters - Array of managed clusters to search through
 * @param cluster - The cluster where the Argo application is defined (for remote apps)
 * @param hubClusterName - Name of the hub cluster
 * @returns The resolved cluster name where resources will be deployed
 */
export function getArgoDestinationCluster(
  destination: ArgoDestination,
  managedClusters: ManagedCluster[],
  cluster: string | undefined,
  hubClusterName: string
): string {
  // cluster is the name of the managed cluster where the Argo app is defined
  let clusterName: string
  const serverApi = get(destination, 'server') as string | undefined

  if (serverApi) {
    // Destination specified by server URL
    if (serverApi === 'https://kubernetes.default.svc') {
      // Special case: in-cluster deployment
      clusterName = cluster ? cluster : hubClusterName
    } else {
      // Find managed cluster by matching server URL
      const server = managedClusters.find((cls) => cls.kubeApiServer === serverApi)
      clusterName = server ? server.name : 'unknown'
    }
  } else {
    // Target destination was set using the name property
    clusterName = get(destination, 'name', 'unknown') as string

    // Handle special cases for cluster name resolution
    if (cluster && (clusterName === 'in-cluster' || clusterName === hubClusterName)) {
      clusterName = cluster
    }

    // Convert 'in-cluster' references to hub cluster name
    if (clusterName === 'in-cluster') {
      clusterName = hubClusterName
    }
  }

  return clusterName
}
