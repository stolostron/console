/* Copyright Contributors to the Open Cluster Management project */
import { getClusterName, isDeployableResource } from '../helpers/diagram-helpers-utils'
import { addDiagramDetails } from './topologyDetails'
import { computeNodeStatus } from './computeStatuses'
import { getArgoTopology } from './topologyArgo'
import { getSubscriptionTopology } from './topologySubscription'
import { getAppSetTopology } from './topologyAppSet'
import { getOCPFluxAppTopology } from './topologyOCPFluxApp'
import type {
  ApplicationModel,
  ManagedCluster,
  Topology,
  ExtendedTopology,
  ArgoData,
  TopologyNode,
  TopologyLink,
  TopologyResourceMap,
  DiagramElements,
  ClusterGroupingState,
  HelmReleasesState,
  ResourceStatuses,
  Translator,
  ArgoApplicationTopologyData,
  OCPFluxApplicationModel,
} from '../types'
import { ToolbarControl } from '../topology/components/TopologyToolbar'
import { Service } from '../../../../../resources'

/**
 * Main function to get topology data for different application types.
 * Routes to appropriate topology generator based on application type.
 *
 * @param application - The application model containing app details and type flags
 * @param managedClusters - Array of managed clusters available in the system
 * @param localHubName - Name of the local hub cluster
 * @param relatedResources - Related resources for subscription-based apps
 * @param argoData - Argo-specific data including topology and cluster info
 * @returns Promise resolving to topology structure or undefined
 */
export const getTopology = async (
  toolbarControl: ToolbarControl,
  application: ApplicationModel | null,
  managedClusters: ManagedCluster[],
  localHubName: string,
  relatedResources: Record<string, any>,
  argoData: ArgoData,
  services: Service[]
): Promise<Topology | ExtendedTopology | undefined> => {
  let topology: Topology | ExtendedTopology | undefined
  if (application) {
    if (application.isArgoApp) {
      // Generate topology for Argo CD applications
      topology = getArgoTopology(
        toolbarControl,
        application as unknown as ArgoApplicationTopologyData,
        argoData,
        managedClusters,
        localHubName,
        services
      )
    } else if (application.isAppSet) {
      // Generate topology for ApplicationSets
      topology = await getAppSetTopology(toolbarControl, application, localHubName)
    } else if (application.isOCPApp || application.isFluxApp) {
      // Generate topology for OpenShift or Flux applications (async operation)
      topology = await getOCPFluxAppTopology(
        toolbarControl,
        application as unknown as OCPFluxApplicationModel,
        localHubName
      )
    } else {
      // Generate topology for subscription-based applications
      topology = getSubscriptionTopology(
        application as unknown as Parameters<typeof getSubscriptionTopology>[0],
        managedClusters,
        relatedResources,
        localHubName
      )
    }
  }

  // Set the hub cluster name on the topology if it exists
  if (topology) {
    topology.hubClusterName = localHubName
  }
  return topology
}

/**
 * Processes topology data to create diagram elements with status information.
 * Transforms raw topology into renderable diagram elements with computed statuses.
 *
 * @param appData - Application data (currently unused but kept for API compatibility)
 * @param topology - Raw topology data with nodes and links
 * @param resourceStatuses - Status information for resources from search queries
 * @param canUpdateStatuses - Whether status updates are allowed
 * @param t - Translation function for internationalization
 * @returns Diagram elements ready for rendering
 */
export const getDiagramElements = (
  topology: Topology,
  resourceStatuses: ResourceStatuses | null,
  canUpdateStatuses: boolean,
  t: Translator
): DiagramElements => {
  // Extract and transform topology elements from raw API data
  const { links, nodes } = getTopologyElements(topology)

  // Initialize channel information for subscription-based applications
  let activeChannelInfo: string | null = null
  let channelsList: string[] = []

  // Resource map for linking search results to topology nodes
  const allResourcesMap: TopologyResourceMap = {}

  // State trackers for topology processing
  const isClusterGrouped: ClusterGroupingState = {
    value: false,
  }
  const hasHelmReleases: HelmReleasesState = {
    value: false,
  }

  // Process each node to build resource mappings and extract channel information
  nodes.forEach((node) => {
    const { id, type } = node

    // Handle application nodes to extract channel information
    if (evaluateSingleAnd(type === 'application', id?.startsWith('application'))) {
      channelsList = (node.specs?.channels ?? []) as string[]

      // Filter out the special "all channels" entry and set default active channel
      const channelListNoAllChannels = channelsList.filter((chn) => chn !== '__ALL__/__ALL__//__ALL__/__ALL__')
      const defaultActiveChannel = channelListNoAllChannels.length > 0 ? channelListNoAllChannels[0] : null

      activeChannelInfo = (node.specs?.activeChannel ?? null) as string | null
      if (!activeChannelInfo) {
        // Set default active channel if none specified
        activeChannelInfo = defaultActiveChannel
        if (node.specs) {
          node.specs.activeChannel = defaultActiveChannel
        }
      }

      // Validate that active channel exists in the channel list
      if (evaluateSingleAnd(activeChannelInfo, channelsList.indexOf(activeChannelInfo as string) === -1)) {
        if (node.specs) {
          node.specs.activeChannel = defaultActiveChannel
        }
        activeChannelInfo = defaultActiveChannel
      }
    }

    // Build resource map for status processing
    processNodeData(node, allResourcesMap, isClusterGrouped, hasHelmReleases, topology)
  })

  // Apply resource status information if available
  if (resourceStatuses) {
    // Merge search results into topology nodes
    addDiagramDetails(resourceStatuses, allResourcesMap, isClusterGrouped.value, hasHelmReleases, topology)

    // Compute status icons for each node based on resource health
    nodes.forEach((node) => {
      computeNodeStatus(node, canUpdateStatuses, t, topology.hubClusterName as string)
    })
  }

  return {
    activeChannel: activeChannelInfo,
    channels: channelsList,
    links: links,
    nodes: nodes,
  }
}

/**
 * Processes individual topology nodes to build resource mappings.
 * Creates entries in the resource map for linking search results to nodes.
 *
 * @param node - Topology node to process
 * @param topoResourceMap - Resource map to populate with node references
 * @param isClusterGrouped - State tracker for cluster grouping detection
 * @param hasHelmReleases - State tracker for Helm release detection
 * @param topology - Full topology context for cluster name resolution
 */
export const processNodeData = (
  node: TopologyNode,
  topoResourceMap: TopologyResourceMap,
  isClusterGrouped: ClusterGroupingState,
  hasHelmReleases: HelmReleasesState,
  topology: Topology
): void => {
  const { name, namespace, type } = node
  const isDesign = node.specs?.isDesign ?? false

  // Skip certain node types when in design mode
  if (!isDeployableResource(node) && ['cluster', 'application', 'placements'].includes(type) && isDesign) {
    return // ignore these types
  }

  // Extract channel information for key generation, handling missing or malformed raw/spec
  const raw = node.specs?.raw as any
  const channel = raw && raw.spec && typeof raw.spec.channel === 'string' ? raw.spec.channel : ''
  const keyName = !isDeployableResource(node) && channel.length > 0 ? `${channel}-${name}` : name

  // Resolve cluster name for this node
  const clusterName = getClusterName(node.id, node, undefined, topology?.hubClusterName as string)

  if (type === 'subscription') {
    // Subscriptions use name-only keys (no cluster grouping)
    topoResourceMap[name] = node

    // Check for Helm chart annotations to detect Helm releases
    const annotations = node.specs?.raw && (node.specs.raw as any).metadata?.annotations
    const topoAnnotation = annotations?.['apps.open-cluster-management.io/topo']
    if (typeof topoAnnotation === 'string' && topoAnnotation.indexOf('helmchart/') > -1) {
      hasHelmReleases.value = true
    }
  } else {
    // Other resource types use cluster-specific keys
    const resources = node.specs?.resources
    if (resources) {
      // Nodes representing multiple resources use type-cluster key
      topoResourceMap[`${type}-${clusterName}`] = node
    } else {
      // Individual resources use type-name-cluster key
      topoResourceMap[`${type}-${namespace}-${keyName}-${clusterName}`] = node
    }

    // Detect cluster grouping (comma-separated cluster names)
    if (clusterName.indexOf(', ') > -1) {
      isClusterGrouped.value = true
    }
  }

  // Store cluster information for route generation and node matching
  node['clusters'] = topology.nodes.find((n) => n.id === `member--clusters--${clusterName}`)
}

/**
 * Simple logical AND helper function.
 * Evaluates two operands and returns true only if both are truthy.
 *
 * @param operand1 - First operand to evaluate
 * @param operand2 - Second operand to evaluate
 * @returns Boolean result of logical AND operation
 */
export const evaluateSingleAnd = (operand1: any, operand2: any): boolean => {
  return operand1 && operand2
}

/**
 * Transforms topology data structure for D3 visualization.
 * Converts "from/to" link format to "source/target" format required by D3.
 *
 * @param resourceItem - Raw topology data with nodes and links
 * @returns Transformed topology elements ready for D3 rendering
 */
export const getTopologyElements = (resourceItem: Topology): { links: TopologyLink[]; nodes: TopologyNode[] } => {
  const { nodes = [], links = [] } = resourceItem

  // Transform links from API format to D3 format (from/to -> source/target)
  let modifiedLinks = links.map((l) => ({
    source: l.from?.uid || '',
    target: l.to?.uid || '',
    label: l.type,
    type: l.type,
    uid: (l.from?.uid || '') + (l.to?.uid || ''),
  }))

  // Handle self-referencing links by converting them to node properties
  const nodeMap = Object.fromEntries(nodes.map((node) => [node.uid, node]))
  modifiedLinks = modifiedLinks.filter((l) => {
    if (l.source !== l.target) {
      return true
    } else {
      // Store self-links as node properties for circular arrow rendering
      if (nodeMap[l.source]) {
        nodeMap[l.source].selfLink = l
      }
      return false
    }
  })

  return {
    links: modifiedLinks,
    nodes: nodes,
  }
}
