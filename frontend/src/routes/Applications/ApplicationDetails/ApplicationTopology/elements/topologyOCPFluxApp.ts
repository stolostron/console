/* Copyright Contributors to the Open Cluster Management project */

import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from './helpers/search-helper'
import { createReplicaChild } from './topologySubscription'
import { addClusters, getClusterName, processMultiples } from './topologyUtils'
import type {
  OCPFluxApplicationModel,
  OCPFluxSearchResult,
  OCPFluxTopologyResult,
  ProcessedOCPFluxResource,
  ResourceItem,
  TopologyNode,
  TopologyLink,
  SearchQuery,
  ClusterInfo,
  OCPFluxClusterSummary,
} from '../types'

/**
 * List of Kubernetes resource kinds that are excluded from topology visualization
 * These are typically low-level or transient resources that don't add value to the application topology view
 */
const excludedKindList: string[] = ['Cluster', 'Pod', 'ReplicaSet', 'ReplicationController']

/**
 * Generates topology data for OCP (OpenShift) and Flux applications
 *
 * This function creates a comprehensive topology view for applications deployed via
 * OpenShift native applications or Flux CD. It fetches resource data from the search API,
 * processes the results, and generates a topology graph showing application structure.
 *
 * @param application - The OCP/Flux application model containing metadata and cluster info
 * @param hubClusterName - Name of the hub cluster for local deployment detection
 * @returns Promise resolving to topology data with nodes, links, and raw search data
 */
export async function getOCPFluxAppTopology(
  application: OCPFluxApplicationModel,
  hubClusterName: string
): Promise<OCPFluxTopologyResult> {
  // Initialize search results container
  let searchResults: OCPFluxSearchResult = {}

  // Fetch resource data from search API based on application labels
  searchResults = await getResourcesWithAppLabel(application)

  // Process and filter the search results to extract relevant resources
  const resources: ResourceItem[] = processSearchResults(searchResults)

  // Generate the topology graph from processed resources
  return generateTopology(application, resources, searchResults, hubClusterName)
}

/**
 * Fetches resources from the search API based on application labels
 *
 * This function constructs appropriate label selectors for OCP and Flux applications
 * and queries the search API to find all related Kubernetes resources.
 *
 * @param application - The application model containing name, namespace, and type info
 * @returns Promise resolving to search results from GraphQL API
 */
async function getResourcesWithAppLabel(application: OCPFluxApplicationModel): Promise<OCPFluxSearchResult> {
  const { name, namespace, app } = application
  const { cluster } = app

  // Construct label selector based on application type
  // OCP apps use standard Kubernetes labels, Flux apps use toolkit-specific labels
  const label: string = application.isOCPApp
    ? `label:app=${name},app.kubernetes.io/part-of=${name}`
    : `label:kustomize.toolkit.fluxcd.io/name=${name},helm.toolkit.fluxcd.io/name=${name}`

  // Build the complete search query with namespace and cluster filters
  const query: SearchQuery = getQueryStringForLabel(label, namespace, cluster?.name || '')

  // Execute GraphQL search query
  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query }],
      limit: 1000, // Set reasonable limit to avoid performance issues
    },
    fetchPolicy: 'network-only', // Always fetch fresh data for topology
  })
}

/**
 * Constructs a search query string for label-based resource filtering
 *
 * This function combines label selectors with namespace and cluster filters
 * to create a comprehensive search query for finding application resources.
 *
 * @param label - Label selector string (e.g., "label:app=myapp")
 * @param namespace - Target namespace for resource filtering
 * @param cluster - Target cluster name for resource filtering
 * @returns Parsed search query object with filters and keywords
 */
export const getQueryStringForLabel = (label: string, namespace: string, cluster: string): SearchQuery => {
  // Construct namespace and cluster filter strings
  const namespaceQuery: string = `namespace:${namespace}`
  const clusterQuery: string = `cluster:${cluster}`

  // Combine all filters and convert to structured query object
  return convertStringToQuery(`${label} ${namespaceQuery} ${clusterQuery}`)
}

/**
 * Generates the complete topology data model from application and resource information
 *
 * This function creates the topology graph by:
 * 1. Creating the root application node
 * 2. Adding cluster nodes for deployment targets
 * 3. Processing and adding resource nodes with proper relationships
 * 4. Filtering out excluded resource types
 *
 * @param application - The application model with metadata
 * @param resources - Array of processed resource items
 * @param searchResults - Raw search results for reference
 * @param hubClusterName - Hub cluster name for local deployment detection
 * @returns Complete topology with nodes, links, and raw data
 */
export function generateTopology(
  application: OCPFluxApplicationModel,
  resources: ResourceItem[],
  searchResults: OCPFluxSearchResult,
  hubClusterName: string
): OCPFluxTopologyResult {
  // Initialize topology containers
  const links: TopologyLink[] = []
  const nodes: TopologyNode[] = []
  const { name, namespace } = application
  const clusters: ClusterInfo[] = []
  const clusterNames: string[] = []

  // Extract cluster information from application configuration
  if (application.app.cluster) {
    clusterNames.push(application.app.cluster.name)
    clusters.push({
      metadata: {
        name: application.app.cluster.name,
        namespace: application.app.cluster.namespace || application.app.cluster.name,
      },
      status: application.app.cluster.status as ClusterInfo['status'],
    })
  }

  // Create the root application node
  const appId: string = `application--${name}`
  const clusterSummary: OCPFluxClusterSummary = {
    isLocal: clusterNames.includes(hubClusterName),
    remoteCount: clusterNames.includes(hubClusterName) ? clusterNames.length - 1 : clusterNames.length,
  }

  nodes.push({
    name,
    namespace,
    type: application.isOCPApp ? 'ocpapplication' : 'fluxapplication',
    id: appId,
    uid: appId,
    specs: {
      isDesign: true, // Indicates this is a design-time node (not a runtime resource)
      resourceCount: 0, // Will be updated as resources are processed
      raw: application.app, // Store raw application data for details view
      allClusters: clusterSummary,
      clusterNames,
      pulse: 'green', // Default to healthy status
    },
  })

  // Add cluster nodes and establish parent-child relationships
  const clusterId: string = addClusters(appId, undefined, '', clusterNames, clusters, links, nodes, undefined)

  // Filter out excluded resource types (Pods, ReplicaSets, etc.)
  const filteredResources: ResourceItem[] = resources.filter((obj: ResourceItem) => {
    const kind: string = (obj.kind ?? '') as string
    return !excludedKindList.includes(kind)
  })

  // Process resources with multiplicity handling and add to topology
  processMultiples(filteredResources).forEach((resource: Record<string, unknown>) => {
    // Cast the processed resource to our expected type with proper type assertion
    const typedResource = resource as unknown as ProcessedOCPFluxResource
    addOCPFluxResource(clusterId, clusterNames, typedResource, links, nodes, hubClusterName)
  })

  // Return complete topology with unique nodes and all links
  return {
    nodes: nodes.filter((node, index, array) => array.findIndex((n) => n.uid === node.uid) === index), // Remove duplicate nodes based on unique ID
    links,
    rawSearchData: searchResults, // Include raw data for debugging/details
  }
}

/**
 * Adds a single OCP/Flux resource node to the topology
 *
 * This function creates topology nodes for individual Kubernetes resources
 * deployed by OCP or Flux applications. It handles API version construction,
 * parent-child relationships, and replica child creation.
 *
 * @param clusterId - Parent cluster node ID
 * @param clusterNames - Array of cluster names where resource is deployed
 * @param resource - The processed resource to add
 * @param links - Array to add new topology links
 * @param nodes - Array to add new topology nodes
 * @param hubClusterName - Hub cluster name for cluster identification
 */
const addOCPFluxResource = (
  clusterId: string,
  clusterNames: string[],
  resource: ProcessedOCPFluxResource,
  links: TopologyLink[],
  nodes: TopologyNode[],
  hubClusterName: string
): void => {
  // Extract resource metadata
  const {
    name: deployableName,
    namespace: deployableNamespace,
    kind,
    apiversion,
    apigroup,
    resources,
    resourceCount,
  } = resource

  // Convert kind to lowercase for consistent node typing
  const type: string = kind.toLowerCase()

  // Generate unique member ID for the resource node
  const memberId: string = `member--member--deployable--member--clusters--${getClusterName(
    clusterId,
    hubClusterName
  )}--${type}--${deployableNamespace}--${deployableName}`

  // Construct basic resource metadata
  const raw: Record<string, unknown> = {
    metadata: {
      name: deployableName,
      namespace: deployableNamespace,
    },
  }

  // Construct full API version if available
  let apiVersion: string | null = null
  if (apiversion) {
    apiVersion = apigroup ? `${apigroup}/${apiversion}` : apiversion
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
      isDesign: false, // This is a runtime resource, not a design element
      raw,
      clustersNames: clusterNames,
      parent: {
        clusterId, // Reference to parent cluster for navigation
      },
      resources, // Individual resource instances
      resourceCount: (resourceCount || 0) + clusterNames.length, // Total count across clusters
    },
  }

  // Add node to topology
  nodes.push(deployableObj)

  // Create link from cluster to resource
  links.push({
    from: { uid: clusterId },
    to: { uid: memberId },
    type: '', // Empty type for standard parent-child relationship
  })

  // Create replica children for deployment-type resources
  // This handles ReplicaSets, ReplicationControllers, and their Pods
  const template: Record<string, unknown> = { metadata: {} }
  createReplicaChild(deployableObj, clusterNames, template, links, nodes)
}

/**
 * Processes raw search results to extract and combine resource items
 *
 * This function takes the GraphQL search response and flattens it into
 * a single array of resource items, combining both direct matches and
 * related resources from the search results.
 *
 * @param searchResults - Raw search results from GraphQL API
 * @returns Flattened array of all resource items
 */
export function processSearchResults(searchResults: OCPFluxSearchResult): ResourceItem[] {
  // Extract direct search result items with null safety
  const items: ResourceItem[] = searchResults?.data?.searchResult?.[0]?.items ?? []

  // Extract related resource items with null safety
  const related: Array<{ items?: ResourceItem[] }> = searchResults?.data?.searchResult?.[0]?.related ?? []

  // Start with direct items
  let allItems: ResourceItem[] = items.slice()

  // Append all related items to the main array
  related.forEach((relatedGroup) => {
    if (relatedGroup.items) {
      allItems = allItems.concat(relatedGroup.items)
    }
  })

  return allItems
}
