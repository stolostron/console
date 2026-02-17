/* Copyright Contributors to the Open Cluster Management project */

import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { getQueryStringForResource } from '../model/topologyUtils'
import { getArgoSecret } from './resourceStatusesArgo'
import {
  AppSetApplicationModel,
  AppSetApplicationData,
  AppSetResourceStatusResult,
  AppSetApplication,
  AppSetClusterInfo,
  SearchQuery,
  ArgoAppResource,
} from '../types'

/**
 * Retrieves resource statuses for ApplicationSet applications.
 *
 * This function processes ApplicationSet applications to gather resource status information
 * by querying the search API for related Kubernetes resources across multiple clusters.
 * It handles both namespaced and cluster-scoped resources, and retrieves Argo secrets
 * for authentication purposes.
 *
 * @param application - The ApplicationSet application model containing metadata and app/cluster lists
 * @param appData - Application data structure that will be populated with search results and target namespaces
 * @returns Promise resolving to an object containing the resource statuses from the search query
 */
export async function getAppSetResourceStatuses(
  application: AppSetApplicationModel,
  appData: AppSetApplicationData
): Promise<AppSetResourceStatusResult> {
  const { name, namespace, appSetApps, appSetClusters = [] } = application

  // Extract cluster names from the ApplicationSet cluster list
  const appSetClustersList: string[] = []
  appSetClusters.forEach((cls: AppSetClusterInfo) => {
    appSetClustersList.push(cls.name)
  })

  // Get resource statuses by querying the search API
  const resourceStatuses = await getResourceStatuses(name, namespace, appSetApps, appData, appSetClustersList)

  // Retrieve Argo secrets for authentication, if available
  const secret = await getArgoSecret(appData, resourceStatuses as Record<string, unknown>)
  if (secret) {
    const secretItems = (secret as any)?.data?.searchResult?.[0] ?? { items: [] }
    appData.argoSecrets = secretItems?.items ?? []
  }

  return { resourceStatuses }
}

/**
 * Internal function to build and execute search queries for ApplicationSet resources.
 *
 * This function analyzes the ApplicationSet applications to determine target namespaces
 * and resource types, then constructs appropriate search queries for both namespaced
 * and cluster-scoped resources. It handles the complexity of querying across multiple
 * clusters and resource types.
 *
 * @param name - ApplicationSet name (currently unused but kept for consistency)
 * @param namespace - ApplicationSet namespace (currently unused but kept for consistency)
 * @param appSetApps - Array of Argo applications managed by this ApplicationSet
 * @param appData - Application data structure to populate with target namespaces and search results
 * @param appSetClusters - List of cluster names where the ApplicationSet is deployed
 * @returns Promise resolving to the search query result containing resource statuses
 */
async function getResourceStatuses(
  _name: string,
  _namespace: string,
  appSetApps: AppSetApplication[] = [],
  appData: AppSetApplicationData,
  appSetClusters: string[]
): Promise<unknown> {
  // Collect target namespaces from Argo application destinations
  const targetNS: string[] = []

  appSetApps.forEach((argoApp: AppSetApplication) => {
    // Get destination namespace information from each Argo application
    const argoNS = argoApp.spec.destination.namespace
    if (argoNS) {
      targetNS.push(argoNS)
    }
  })

  // Extract resource information from the first application's status (if available)
  // All applications in an ApplicationSet typically deploy the same resources
  const resources: ArgoAppResource[] = []
  if (appSetApps.length > 0) {
    appSetApps.forEach((argoApp: any) => {
      resources.push(...(argoApp?.status?.resources ?? []))
    })
  }

  // Separate resources into namespaced and cluster-scoped categories
  const definedNamespace: string[] = []
  const kindsNotNamespaceScoped: string[] = []
  const kindsNotNamespaceScopedNames: string[] = []
  const clusterScopedPairs = new Set<string>()

  resources.forEach((resource: any) => {
    const rscNS = resource?.namespace
    const rscKind = resource?.kind
    const rscName = resource?.name

    if (rscNS) {
      // Resource has a namespace - add to namespaced resources
      definedNamespace.push(rscNS)
    }

    if (!rscNS) {
      // Resource is cluster-scoped - handle special cases and add to cluster-scoped list
      if (!rscKind || !rscName) {
        return
      }
      const normalizedKind = rscKind.toLowerCase() === 'project' ? 'namespace' : rscKind.toLowerCase()
      const pairKey = `${normalizedKind}::${rscName}`
      if (clusterScopedPairs.has(pairKey)) {
        return
      }
      clusterScopedPairs.add(pairKey)
      if (normalizedKind === 'namespace') {
        // OpenShift Project resources are represented as Namespace resources in search
        kindsNotNamespaceScoped.push('namespace')
      } else {
        kindsNotNamespaceScoped.push(normalizedKind)
      }
      kindsNotNamespaceScopedNames.push(rscName)
    }
  })

  // Set target namespaces in appData - use defined namespaces if available, otherwise use destination namespaces
  appData.targetNamespaces = definedNamespace.length > 0 ? [...new Set(definedNamespace)] : [...new Set(targetNS)]

  // Build search queries for namespaced and cluster-scoped resources
  const queryNotNamespaceScoped: SearchQuery[] = []

  // Filter out cluster-scoped resource kinds from the related kinds list
  const argoKinds = appData.relatedKinds
    ? appData.relatedKinds.filter(function (el) {
        return !kindsNotNamespaceScoped.includes(el)
      })
    : null

  // Build main query for namespaced resources
  const query = getQueryStringForResource(
    argoKinds,
    null,
    appData.targetNamespaces.toString(),
    appSetClusters.toString()
  )

  // Build separate queries for each cluster-scoped resource
  if (kindsNotNamespaceScoped.length > 0) {
    kindsNotNamespaceScoped.forEach((item: string, i: number) => {
      queryNotNamespaceScoped.push(getQueryStringForResource([item], kindsNotNamespaceScopedNames[i], '', ''))
    })
  }

  // Always include these related resource types for comprehensive topology information
  // - cluster: for cluster information
  // - pod: for workload status
  // - replicaset: for deployment status
  // - replicationcontroller: for legacy deployment status
  query.relatedKinds.push('cluster', 'pod', 'replicaset', 'replicationcontroller')

  // Execute the search query with both namespaced and cluster-scoped resource queries
  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query }, ...queryNotNamespaceScoped],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}
