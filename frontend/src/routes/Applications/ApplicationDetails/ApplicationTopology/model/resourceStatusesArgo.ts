/* Copyright Contributors to the Open Cluster Management project */

import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../helpers/search-helper'
import { getQueryStringForResource } from '../model/topologyUtils'
import type {
  ApplicationModel,
  ArgoApplicationData,
  ArgoApplicationItem,
  ArgoResourceStatusResult,
  ArgoSource,
  ResourceItem,
  SearchQuery,
  Topology,
} from '../types'

/**
 * Main function to retrieve Argo application resource statuses and related information.
 * This function orchestrates the process of finding related Argo applications, getting their
 * resource statuses, and retrieving associated secrets for cluster authentication.
 *
 * @param application - The application model containing metadata and configuration
 * @param appData - Application data with source information and deployment details
 * @param topology - Topology structure containing nodes and links for the application
 * @returns Promise resolving to resource statuses data
 */
export async function getArgoResourceStatuses(
  application: ApplicationModel,
  appData: ArgoApplicationData,
  topology: Topology
): Promise<ArgoResourceStatusResult> {
  // Get all Argo applications that share the same source repository or ApplicationSet
  const argoSource = await getArgoSource(application, appData)

  // Retrieve resource statuses for all related applications and their deployed resources
  const resourceStatuses = await getResourceStatuses(
    application.app as unknown as Record<string, unknown>,
    appData,
    topology,
    argoSource
  )

  // Fetch Argo secrets used for cluster authentication and store them in appData
  const secret = await getArgoSecret(appData, resourceStatuses as Record<string, unknown>)
  if (secret && typeof secret === 'object' && 'data' in secret) {
    const secretData = secret as { data?: { searchResult?: Array<{ items?: unknown[] }> } }
    const secretItems = secretData.data?.searchResult?.[0] ?? { items: [] }
    appData.argoSecrets = (secretItems.items ?? []) as ResourceItem[]
  }

  return { resourceStatuses }
}

/**
 * Retrieves all Argo applications that share the same source repository or belong to the same ApplicationSet.
 * For ApplicationSet applications, it searches by ApplicationSet name, cluster, and namespace.
 * For regular Argo applications, it searches by source repository details (repoURL, path, chart, targetRevision).
 *
 * @param application - The application model with namespace and metadata
 * @param appData - Application data containing source configuration and ApplicationSet information
 * @returns Promise resolving to search results containing related Argo applications
 */
async function getArgoSource(application: ApplicationModel, appData: ArgoApplicationData): Promise<ArgoSource> {
  // Get all Argo applications with the same source repo as this one
  const { namespace } = application
  const query = convertStringToQuery('kind:application apigroup:argoproj.io')

  if (appData.applicationSet) {
    // ApplicationSet name is only unique within cluster and namespace
    // Add filters for ApplicationSet, cluster, and namespace to find related apps
    ;['applicationSet', 'cluster'].forEach((property) => {
      const value = appData[property as keyof ArgoApplicationData] as string
      if (value) {
        query.filters.push({ property, values: [value] })
      }
    })
    query.filters.push({ property: 'namespace', values: [namespace] })
  } else {
    // For regular Argo applications, search by source repository configuration
    let targetRevisionFound = false
    const searchProperties = ['repoURL', 'path', 'chart', 'targetRevision'].reduce(
      (acc, key) => {
        if (appData.source?.[key as keyof ArgoApplicationData['source']]) {
          acc[key] = appData.source[key as keyof ArgoApplicationData['source']]
        }
        return acc
      },
      {} as Record<string, string>
    )

    for (const [property, value] of Object.entries(searchProperties)) {
      // Add Argo app source filters based on repository configuration
      let propValue = value as string
      if (property === 'targetRevision') {
        targetRevisionFound = true
        // Default to 'HEAD' if targetRevision is empty
        if (propValue.length === 0) {
          propValue = 'HEAD'
        }
      }

      query.filters.push({ property, values: [propValue] })
    }

    // Ensure targetRevision filter is always present, defaulting to 'HEAD'
    if (!targetRevisionFound) {
      query.filters.push({ property: 'targetRevision', values: ['HEAD'] })
    }
  }

  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query }],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}

/**
 * Retrieves resource statuses for the application and all related resources across target clusters.
 * This function processes Argo applications to determine target clusters and namespaces,
 * then queries for all deployed resources including both namespaced and cluster-scoped resources.
 *
 * @param app - The main application resource object
 * @param appData - Application data to be populated with cluster and namespace information
 * @param topology - Topology structure to be updated with cluster and application information
 * @param argoSource - Search results containing related Argo applications
 * @returns Promise resolving to search results containing resource statuses
 */
async function getResourceStatuses(
  app: Record<string, unknown>,
  appData: ArgoApplicationData,
  topology: Topology,
  argoSource: ArgoSource | null
): Promise<unknown> {
  const name = (app as { metadata?: { name?: string } }).metadata?.name as string
  const namespace = (app as { metadata?: { namespace?: string } }).metadata?.namespace as string
  const kindsNotNamespaceScoped: string[] = []
  const kindsNotNamespaceScopedNames: string[] = []

  if (argoSource) {
    const { searchResult } = argoSource.data
    const searchResultItems = searchResult && searchResult.length && searchResult[0]?.items
    const allApps: ArgoApplicationItem[] = searchResultItems
      ? (searchResultItems.filter(
          (searchApp: ResourceItem) => searchApp.kind === 'Application'
        ) as ArgoApplicationItem[])
      : []

    const targetNS: string[] = []
    const targetClusters: string[] = []
    const targetNSForClusters: Record<string, string[]> = {} // Keep track of what namespaces each cluster must deploy on

    // Process all related Argo applications to extract destination information
    allApps.forEach((argoApp: ArgoApplicationItem) => {
      // Get destination namespace and cluster information
      const argoNS = argoApp.destinationNamespace
      if (argoNS) {
        targetNS.push(argoNS)
      }

      // Resolve cluster name from server URL or destination name
      const argoServerDest = findMatchingCluster(argoApp, appData.argoSecrets)
      const argoServerNameDest = argoServerDest || argoApp.destinationName
      //argoApp.destinationCluster = argoServerNameDest || argoApp.destinationServer

      const targetClusterName = argoServerNameDest ? argoServerNameDest : argoServerDest ? argoServerDest : null
      if (targetClusterName) {
        targetClusters.push(targetClusterName)
        // Add namespace to target list for this cluster
        if (!targetNSForClusters[targetClusterName]) {
          targetNSForClusters[targetClusterName] = []
        }
        if (argoNS && !targetNSForClusters[targetClusterName].includes(argoNS)) {
          targetNSForClusters[targetClusterName].push(argoNS)
        }
      }
    })

    // Process application resources to identify namespaced vs cluster-scoped resources
    const resources = ((app as { status?: { resources?: Record<string, unknown>[] } }).status?.resources ??
      []) as Record<string, unknown>[]
    const resourceNS: string[] = []

    resources.forEach((rsc) => {
      const rscNS = rsc.namespace as string | undefined
      const rscKind = rsc.kind as string
      const rscName = rsc.name as string

      if (rscNS) {
        resourceNS.push(rscNS)
      }

      // Handle cluster-scoped resources
      if (!rscNS) {
        if (rscKind && rscKind.toLowerCase() === 'project') {
          // OpenShift Projects are represented as Namespaces in search
          kindsNotNamespaceScoped.push('namespace')
        } else if (rscKind) {
          kindsNotNamespaceScoped.push(rscKind.toLowerCase())
        }
        if (rscName) {
          kindsNotNamespaceScopedNames.push(rscName)
        }
      }
    })

    // Store computed target information in appData
    appData.targetNamespaces = resourceNS.length > 0 ? [...new Set(resourceNS)] : [...new Set(targetNS)]
    appData.clusterInfo = [...new Set(targetClusters)]

    // Store all Argo apps and destination clusters info on the first topology node
    const topoResources = topology.nodes
    const firstNode = topoResources[0]
    const topoClusterNode = topoResources.find((node) => node.id === 'member--clusters--')

    // Set related applications and desired deployment state
    if (firstNode) {
      if (!firstNode.specs) firstNode.specs = {}
      firstNode.specs.relatedApps = allApps
      firstNode.specs.clusterNames = appData.clusterInfo
    }
    if (topoClusterNode) {
      if (!topoClusterNode.specs) topoClusterNode.specs = {}
      topoClusterNode.specs.appClusters = appData.clusterInfo
    }

    // Ensure clusters array always contains objects with proper structure
    const initialClusterData: Array<{ name: string }> = []
    appData.clusterInfo.forEach((cls) => {
      initialClusterData.push({
        name: cls,
      })
    })
    if (topoClusterNode) {
      if (!topoClusterNode.specs) topoClusterNode.specs = {}
      topoClusterNode.specs.clusters = initialClusterData
      topoClusterNode.specs.targetNamespaces = targetNSForClusters
    }
  }

  // Build search queries for namespaced and cluster-scoped resources
  let query = getQueryStringForResource('Application', name, namespace, appData.cluster)
  const queryNotNamespaceScoped: SearchQuery[] = []

  if (appData && appData.targetNamespaces) {
    // Filter out cluster-scoped kinds from the main namespaced search
    const argoKinds = appData.relatedKinds
      ? appData.relatedKinds.filter(function (el) {
          return !kindsNotNamespaceScoped.includes(el)
        })
      : null

    // Get all resources from the target namespaces since they are not linked to the Argo application
    query = getQueryStringForResource(argoKinds, null, appData.targetNamespaces.toString(), appData.cluster)

    // Create separate queries for cluster-scoped resources
    if (kindsNotNamespaceScoped.length > 0) {
      kindsNotNamespaceScoped.forEach((item, i) => {
        queryNotNamespaceScoped.push(
          getQueryStringForResource(item, kindsNotNamespaceScopedNames[i], null, appData.cluster)
        )
      })
    }

    // Always ask for related pods, replicasets, and replicationcontrollers because they are tagged by the app instance
    // We'll get them if any are linked to the objects returned above
    query.relatedKinds.push('cluster', 'pod', 'replicaset', 'replicationcontroller')
  }

  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query }, ...queryNotNamespaceScoped],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}

/**
 * Attempts to find the cluster name for a remote cluster using the server URL.
 * This function handles the mapping between Argo CD server URLs and actual cluster names
 * using information from Argo secrets and cluster configurations.
 *
 * @param argoApp - The Argo application containing destination server information
 * @param argoMappingInfo - Array of Argo secrets containing cluster mapping information
 * @returns The cluster name if found, otherwise the server URL
 */
export const findMatchingCluster = (
  argoApp: ArgoApplicationItem,
  argoMappingInfo?: ResourceItem[]
): string | undefined => {
  const serverApi = argoApp.destinationServer as string | undefined

  // Handle in-cluster deployments (same cluster as Argo CD)
  if (
    (serverApi && serverApi === 'https://kubernetes.default.svc') ||
    (argoApp.destinationName ?? '') === 'in-cluster'
  ) {
    return argoApp.cluster as string // Target is the same as the Argo app cluster
  }

  // Try to resolve cluster name from Argo secrets mapping
  if (argoMappingInfo && serverApi) {
    try {
      // Extract hostname from server URL and truncate to 63 characters (Kubernetes label limit)
      const serverHostName = new URL(serverApi).hostname.substring(0, 63)
      const nameLabel = 'cluster-name='
      const serverLabel = `cluster-server=${serverHostName}`

      // Find the secret that contains mapping information for this server
      const mapServerInfo = argoMappingInfo
        .map((item) => item.label)
        .find((obj: unknown) => {
          return typeof obj === 'string' && obj.indexOf(serverLabel) !== -1
        })

      if (mapServerInfo && typeof mapServerInfo === 'string') {
        // Extract the cluster name from the label
        const labelsList = mapServerInfo.split(';')
        const clusterNameLabel = labelsList.find((obj) => obj.includes(nameLabel))

        if (clusterNameLabel) {
          return clusterNameLabel.split('=')[1]
        }
        return serverApi
      }
    } catch {
      // If URL parsing fails, return the server API as-is
      return serverApi
    }
  }

  return serverApi
}

/**
 * Retrieves Argo secrets that contain cluster authentication and mapping information.
 * These secrets are used to map Argo CD server URLs to actual cluster names and
 * provide authentication credentials for accessing remote clusters.
 *
 * @param appData - Application data containing ApplicationSet information for filtering
 * @param resourceStatuses - Resource status search results containing application information
 * @returns Promise resolving to search results containing Argo secrets, or undefined if no secrets found
 */
export const getArgoSecret = (
  appData: ArgoApplicationData,
  resourceStatuses: { data?: { searchResult?: Array<{ items?: ResourceItem[] }> } } = {}
): Promise<unknown> | Promise<void> => {
  const searchResult = resourceStatuses.data?.searchResult ?? []

  if (searchResult.length > 0 && searchResult[0].items) {
    // For non-ApplicationSet cases, ensure we don't include apps with ApplicationSet
    const allApps = (searchResult[0]?.items ?? []).filter(
      (app: ResourceItem) => app.applicationSet === appData.applicationSet
    )

    // Find Argo server mapping secrets in the namespaces where Argo applications are deployed
    const argoAppNS = [...new Set(allApps.map((app) => app.namespace).filter(Boolean))]

    if (argoAppNS.length > 0) {
      const query = convertStringToQuery(
        `kind:secret namespace:${argoAppNS.join()} label:apps.open-cluster-management.io/acm-cluster='true'`
      )

      return searchClient.query({
        query: SearchResultItemsAndRelatedItemsDocument,
        variables: {
          input: [{ ...query }],
          limit: 1000,
        },
        fetchPolicy: 'network-only',
      })
    }
  }

  return Promise.resolve()
}
