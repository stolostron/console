/* Copyright Contributors to the Open Cluster Management project */

import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import {
  areSourcesUniform,
  fetchArgoAppStatusResources,
  getAppTargetCluster,
  getQueryStringForResource,
} from '../model/topologyUtils'
import {
  AppSetApplication,
  AppSetApplicationData,
  AppSetApplicationModel,
  AppSetClusterInfo,
  AppSetResourceStatusResult,
  ArgoAppResource,
  SearchQuery,
} from '../types'
import { getArgoSecret } from './resourceStatusesArgo'

/**
 * Retrieves resource statuses for ApplicationSet applications.
 *
 * This function processes ApplicationSet applications to gather resource status information
 * by querying the search API for related Kubernetes resources across multiple clusters.
 * It handles both namespaced and cluster-scoped resources, and retrieves Argo secrets
 * for authentication purposes.
 *
 * For pull-model ApplicationSets, hub Application CRs will not have status.resources populated.
 * In that case, this function fetches the remote Application CRs to get the expected resource list.
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

  // For pull-model, hub apps lack status.resources; fetch from remote clusters
  const appsWithResources = await ensureAppResources(appSetApps, namespace, appSetClusters)

  // Get resource statuses by querying the search API
  const resourceStatuses = await getResourceStatuses(name, namespace, appsWithResources, appData, appSetClustersList)

  // Retrieve Argo secrets for authentication, if available
  const secret = await getArgoSecret(appData, resourceStatuses as Record<string, unknown>)
  if (secret) {
    const secretItems = (secret as any)?.data?.searchResult?.[0] ?? { items: [] }
    appData.argoSecrets = secretItems?.items ?? []
  }

  return { resourceStatuses }
}

/**
 * Ensures that the Application list has status.resources populated.
 * For pull-model, the hub Application CRs lack status.resources because ArgoCD
 * runs on the managed cluster. This function fetches the remote Application CRs to get
 * the expected resource list for cluster-scoped resources (CRDs, StorageClasses, etc.).
 *
 * Optimization: Checks whether all apps share the same source spec (repoURL + path +
 * targetRevision). If uniform, one fetch suffices for all apps. If sources differ
 * (matrix/merge generator), each app is fetched individually.
 */
async function ensureAppResources(
  appSetApps: AppSetApplication[],
  namespace: string,
  clusters: AppSetClusterInfo[]
): Promise<AppSetApplication[]> {
  if (
    appSetApps.length === 0 ||
    clusters.length === 0 ||
    appSetApps.every((app) => (app.status?.resources?.length ?? 0) > 0)
  ) {
    // if there are no appSets/clusters or we already have all resources populated, no need to fetch
    return appSetApps
  }

  const sharedResources = areSourcesUniform(appSetApps, (app: AppSetApplication) => ({
    source: app.spec?.source,
    sources: (app.spec as any)?.sources,
  }))
    ? fetchFirstAvailableResources(appSetApps, namespace, clusters)
    : undefined

  return Promise.all(
    appSetApps.map(async (app: AppSetApplication) => {
      if (app.status?.resources?.length) return app
      const resources = await (sharedResources ?? fetchSingleAppResources(app, namespace, clusters))
      if (!resources) return app
      return { ...app, status: { ...app.status, resources } } as AppSetApplication
    })
  )
}

/** Tries each app in order, returning resources from the first reachable one. */
async function fetchFirstAvailableResources(
  appSetApps: AppSetApplication[],
  namespace: string,
  clusters: AppSetClusterInfo[]
): Promise<any[] | null> {
  for (const app of appSetApps) {
    const resources = await fetchSingleAppResources(app, namespace, clusters)
    if (resources) return resources
  }
  return null
}

/** Resolves the app's target cluster from its destination and fetches status.resources. */
async function fetchSingleAppResources(
  app: AppSetApplication,
  namespace: string,
  clusters: AppSetClusterInfo[]
): Promise<any[] | null> {
  const appName = app.metadata?.name
  if (!appName) return null

  const clusterName = getAppTargetCluster(app.spec.destination, clusters, appName)
  if (!clusterName) return null

  return fetchArgoAppStatusResources(clusterName, appName, namespace)
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
      const normalizedKind = rscKind.toLowerCase() === 'project' ? 'Namespace' : rscKind
      const pairKey = `${normalizedKind}::${rscName}`
      if (clusterScopedPairs.has(pairKey)) {
        return
      }
      clusterScopedPairs.add(pairKey)
      if (normalizedKind === 'namespace') {
        // OpenShift Project resources are represented as Namespace resources in search
        kindsNotNamespaceScoped.push('Namespace')
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

  // Build separate queries for each cluster-scoped resource, scoped to the target clusters
  if (kindsNotNamespaceScoped.length > 0) {
    kindsNotNamespaceScoped.forEach((item: string, i: number) => {
      queryNotNamespaceScoped.push(
        getQueryStringForResource([item], kindsNotNamespaceScopedNames[i], '', appSetClusters.toString())
      )
    })
  }

  // Always include these related resource types for comprehensive topology information
  // - cluster: for cluster information
  // - pod: for workload status
  // - replicaset: for deployment status
  // - replicationcontroller: for legacy deployment status
  query.relatedKinds.push('Cluster', 'Pod', 'ReplicaSet', 'ReplicationController')

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
