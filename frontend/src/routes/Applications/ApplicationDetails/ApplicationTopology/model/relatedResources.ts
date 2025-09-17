/* Copyright Contributors to the Open Cluster Management project */

import { get, set } from 'lodash'
import { fireManagedClusterView } from '../../../../../resources/managedclusterview'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import {
  ResourceReport,
  RelatedResourcesMap,
  RelatedResourcesSearchQuery,
  RelatedResourcesSearchResponse,
  ManagedClusterViewResponse,
} from './types'

/**
 * Retrieves related resources for deployed applications by querying search and ManagedClusterView APIs.
 *
 * This function processes application reports to find successfully deployed resources and then:
 * 1. For Deployments/DeploymentConfigs: Searches for related ReplicaSets and Pods
 * 2. For Routes: Fetches the actual Route resource via ManagedClusterView
 *
 * @param reports - Array of resource reports containing deployment information and resources
 * @returns Promise that resolves to a map of related resources keyed by resource identifier (name-namespace)
 */
export async function getRelatedResources(reports: ResourceReport[] = []): Promise<RelatedResourcesMap | undefined> {
  // Array to collect all async operations for parallel execution
  const promises: Array<Promise<RelatedResourcesSearchResponse | ManagedClusterViewResponse>> = []

  // Process each report that contains resources
  reports
    .filter((report) => !!report.resources)
    .forEach(({ results, resources }) => {
      let cluster: string | undefined

      // Find the first cluster where this resource was successfully deployed
      // This prioritizes successfully deployed instances over failed ones
      results?.find(({ source, result }) => {
        if (result === 'deployed') {
          cluster = source
          return true
        }
        return false
      })

      // Process each resource in the current report
      resources?.forEach((resource) => {
        const { kind, name, namespace } = resource

        // Handle different resource types with specific related resource queries
        switch (kind) {
          case 'Deployment':
          case 'DeploymentConfig':
            // For deployments, fetch related ReplicaSets and Pods to show the full deployment hierarchy
            promises.push(getSearchPromise(cluster, kind, name, namespace, ['replicaset', 'pod']))
            break
          case 'Route':
            // For routes, fetch the actual Route resource to get detailed routing information
            if (cluster) {
              promises.push(fireManagedClusterView(cluster, 'route', 'route.openshift.io/v1', name, namespace))
            }
            break
        }
      })
    })

  // Execute all queries in parallel and process results
  let relatedResources: RelatedResourcesMap | undefined
  if (promises.length) {
    relatedResources = {}

    // Wait for all promises to settle (both fulfilled and rejected)
    const response = await Promise.allSettled(promises)

    // Process each response, handling both search and ManagedClusterView responses
    response.forEach(({ status, value }) => {
      if (status !== 'rejected' && value) {
        // Handle search API response (contains related resources)
        if ('data' in value && value.data) {
          const searchResponse = value as RelatedResourcesSearchResponse
          const item = get(searchResponse, 'data.searchResult[0].items[0]', {})
          const { name, namespace } = item

          if (name && namespace && relatedResources) {
            // Store related resources using name-namespace as the key
            set(
              relatedResources,
              [`${name}-${namespace}`, 'related'],
              get(searchResponse, 'data.searchResult[0].related')
            )
          }
        }
        // Handle ManagedClusterView API response (contains resource template)
        else if ('result' in value && value.result) {
          const mcvResponse = value as ManagedClusterViewResponse
          const item = get(mcvResponse, 'result.metadata', {})
          const { name, namespace } = item

          if (name && namespace && relatedResources) {
            // Store the full resource template for direct resource access
            set(relatedResources, [`${name}-${namespace}`, 'template'], mcvResponse.result)
          }
        }
      }
    })
  }

  return relatedResources
}

/**
 * Creates a search promise to find a resource and its related resources.
 *
 * This helper function constructs a search query to find a specific resource
 * and fetch its related resources of specified kinds (e.g., pods, replicasets).
 *
 * @param cluster - Target cluster name (optional, searches all clusters if not provided)
 * @param kind - Kubernetes resource kind (e.g., 'Deployment', 'Service')
 * @param name - Resource name
 * @param namespace - Resource namespace
 * @param relatedKinds - Array of related resource kinds to include in search results
 * @returns Promise that resolves to search response containing the resource and related items
 */
const getSearchPromise = (
  cluster: string | undefined,
  kind: string,
  name: string,
  namespace: string,
  relatedKinds: string[]
): Promise<RelatedResourcesSearchResponse> => {
  // Build search query with filters for the specific resource
  const query: RelatedResourcesSearchQuery = {
    keywords: [],
    filters: [
      { property: 'kind', values: [kind.toLowerCase()] },
      { property: 'name', values: [name] },
      { property: 'namespace', values: [namespace] },
    ],
  }

  // Add cluster filter if a specific cluster is targeted
  if (cluster) {
    query.filters.push({ property: 'cluster', values: [cluster] })
  }

  // Execute the search query with related kinds to get comprehensive resource information
  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query, relatedKinds }],
      limit: 1000, // Set high limit to ensure we get all related resources
    },
    fetchPolicy: 'network-only', // Always fetch fresh data from the server
  })
}
