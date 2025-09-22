/* Copyright Contributors to the Open Cluster Management project */

import { fireManagedClusterView } from '../../../../../resources/managedclusterview'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../elements/helpers/search-helper'
import {
  ApplicationModel,
  ResourceReport,
  RelatedResourcesMap,
  RelatedResourcesSearchQuery,
  RelatedResourcesSearchResponse,
  SubscriptionApplicationData,
  SubscriptionResourceStatusResult,
  SearchQuery,
} from '../types'

/**
 * Retrieves resource statuses and related resources for subscription-based applications.
 *
 * This function is the main entry point for getting resource status information for applications
 * that use the subscription model. It combines search data for resource statuses with related
 * resource information from subscription reports.
 *
 * @param application - The application model containing metadata and subscription reports
 * @param appData - Optional application data for filtering and customizing search queries
 * @returns Promise resolving to resource statuses and related resources mapping
 */
export async function getSubscriptionResourceStatuses(
  application: ApplicationModel & { reports?: ResourceReport[] },
  appData?: SubscriptionApplicationData
): Promise<SubscriptionResourceStatusResult> {
  // Need to constantly get search data since it will change even if subscription data doesn't.
  // With SubscriptionReport we need to find out what service/replicaset goes with what route/deployment
  let relatedResources: RelatedResourcesMap = {}
  if (application.reports) {
    relatedResources = (await getRelatedResources(application.reports)) || {}
  }

  // Get resource statuses from search API
  const resourceStatuses = await getResourceStatuses(application, appData)

  return { resourceStatuses, relatedResources }
}

/**
 * Retrieves resource statuses from the search API for a subscription application.
 *
 * This function builds search queries based on the application and optional filtering criteria.
 * It can query for all resources related to an application, or filter by specific subscription
 * and resource kinds.
 *
 * @param application - The application model containing name and namespace
 * @param appData - Optional data for filtering by subscription and resource kinds
 * @returns Promise resolving to search query results containing resource statuses
 */
async function getResourceStatuses(
  application: ApplicationModel,
  appData?: SubscriptionApplicationData
): Promise<unknown> {
  let query: SearchQuery
  const { name, namespace } = application

  if (appData) {
    // Query asking for a subset of related kinds and possibly for one subscription only
    if (appData.subscription) {
      // Get related resources only for the selected subscription
      query = getQueryStringForResource('Subscription', appData.subscription, namespace)
      // Ask only for these types of resources
      query.relatedKinds = appData.relatedKinds || []
    } else {
      // Get related resources only for the selected application
      query = getQueryStringForResource('Application', name, namespace)
      // Get related resources for the application, but only this subset
      query.relatedKinds = appData.relatedKinds || []
    }
  } else {
    // Get all related resources for the application
    query = getQueryStringForResource('Application', name, namespace)
  }

  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query }],
      limit: 1000,
    },
    fetchPolicy: 'network-only', // cache-first will result in stale search data
  })
}

/**
 * Retrieves related resources for subscription applications with local-host cluster preference.
 *
 * This is a specialized version of getRelatedResources that:
 * 1. Defaults to 'local-host' cluster for subscription deployments
 * 2. Handles additional resource types specific to subscription model (Ingress, StatefulSet)
 * 3. Uses different related resource queries for DeploymentConfig (replicationcontroller vs replicaset)
 *
 * @param reports - Array of resource reports containing deployment information and resources
 * @returns Promise that resolves to a map of related resources keyed by resource identifier (name-namespace)
 */
async function getRelatedResources(reports: ResourceReport[]): Promise<RelatedResourcesMap | undefined> {
  const promises: Array<Promise<RelatedResourcesSearchResponse | any>> = []

  reports
    .filter((report) => !!report.resources)
    .forEach(({ results, resources }) => {
      let cluster = 'local-host' // Default to local-host for subscription model

      // Find first cluster this was successfully deployed to, favoring local-host
      if (results) {
        results.some(({ source, result }) => {
          if (result === 'deployed') {
            cluster = source
            return source === 'local-host' // Stop searching if we find local-host
          }
          return false
        })
      }

      resources?.forEach((resource) => {
        const { kind, name, namespace } = resource

        // Handle different resource types with subscription-specific related resource queries
        switch (kind) {
          case 'Deployment':
            // For deployments, fetch related ReplicaSets and Pods
            promises.push(getSearchPromise(cluster, kind, name, namespace, ['replicaset', 'pod']))
            break
          case 'DeploymentConfig':
            // For deployment configs, fetch related ReplicationControllers and Pods (OpenShift specific)
            promises.push(getSearchPromise(cluster, kind, name, namespace, ['replicationcontroller', 'pod']))
            break
          case 'Route':
            // For routes, fetch the actual Route resource (OpenShift specific)
            promises.push(fireManagedClusterView(cluster, 'route', 'route.openshift.io/v1', name, namespace))
            break
          case 'Ingress':
            // For ingresses, fetch the actual Ingress resource
            promises.push(fireManagedClusterView(cluster, 'ingress', 'networking.k8s.io/v1', name, namespace))
            break
          case 'StatefulSet':
            // For stateful sets, fetch the actual StatefulSet resource
            promises.push(fireManagedClusterView(cluster, 'statefulset', 'apps/v1', name, namespace))
            break
        }
      })
    })

  let relatedResources: RelatedResourcesMap | undefined
  if (promises.length) {
    relatedResources = {}
    const response = await Promise.allSettled(promises)

    response.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const value = result.value
        // Handle search API response (contains related resources)
        if (value.data) {
          const item = value.data?.searchResult?.[0]?.items?.[0] ?? {}
          const { name, namespace } = item
          if (name && namespace && relatedResources) {
            relatedResources[`${name}-${namespace}`] = {
              ...relatedResources[`${name}-${namespace}`],
              related: value.data?.searchResult?.[0]?.related,
            }
          }
        }
        // Handle ManagedClusterView API response (contains resource template)
        else if (value.result) {
          const item = value.result?.metadata ?? {}
          const { name, namespace } = item
          if (name && namespace && relatedResources) {
            relatedResources[`${name}-${namespace}`] = {
              ...relatedResources[`${name}-${namespace}`],
              template: value.result,
            }
          }
        }
      }
    })
  }
  return relatedResources
}

/**
 * Creates a search promise to find a resource and its related resources for subscription model.
 *
 * This function constructs a search query to find a specific Kubernetes resource and its
 * related resources within a given cluster. It's optimized for subscription-based applications
 * where we need to discover relationships between deployed resources.
 *
 * @param cluster - Target cluster name where the resource is deployed
 * @param kind - Kubernetes resource kind (e.g., 'Deployment', 'Service')
 * @param name - Resource name to search for
 * @param namespace - Resource namespace to search within
 * @param relatedKinds - Array of related resource kinds to include in search results
 * @returns Promise that resolves to search response containing the resource and related items
 */
const getSearchPromise = (
  cluster: string,
  kind: string,
  name: string,
  namespace: string,
  relatedKinds: string[]
): Promise<RelatedResourcesSearchResponse> => {
  const query: RelatedResourcesSearchQuery = {
    keywords: [],
    filters: [
      { property: 'kind', values: [kind.toLowerCase()] },
      { property: 'name', values: [name] },
      { property: 'namespace', values: [namespace] },
    ],
  }

  // Add cluster filter if specified
  if (cluster) {
    query.filters.push({ property: 'cluster', values: [cluster] })
  }

  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query, relatedKinds }],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}

/**
 * Builds a search query string for finding resources of a specific type.
 *
 * This function constructs a search query string that can be used to find Kubernetes
 * resources by kind, name, and namespace. It handles special cases for Subscription
 * and Application resources and formats the query for the search API.
 *
 * @param resourcename - The type of resource to search for ('Subscription', 'Application', etc.)
 * @param name - The name of the resource to filter by
 * @param namespace - The namespace of the resource to filter by
 * @returns A SearchQuery object that can be used with the search API
 */
const getQueryStringForResource = (resourcename: string, name: string, namespace: string): SearchQuery => {
  let resource = ''
  const nameForQuery = name ? `name:${name}` : ''
  const namespaceForQuery = namespace ? ` namespace:${namespace}` : ''

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

  return convertStringToQuery(`${resource} ${nameForQuery} ${namespaceForQuery}`)
}
