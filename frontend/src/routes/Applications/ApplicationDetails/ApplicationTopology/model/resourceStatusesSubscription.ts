/* Copyright Contributors to the Open Cluster Management project */

import { get, set } from 'lodash'
import { fireManagedClusterView } from '../../../../../resources/managedclusterview'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../helpers/search-helper'
import {
  ResourceReport,
  RelatedResourcesMap,
  RelatedResourcesSearchQuery,
  RelatedResourcesSearchResponse,
} from './types'

export async function getSubscriptionResourceStatuses(application, appData) {
  // need to constantly get search data since it will change even if subscription data doesn't
  // with SubscriptionReport need to find out what service/replicaset goes with what route/deployment
  let relatedResources: RelatedResourcesMap = {}
  if (application.reports) {
    relatedResources = (await getRelatedResources(application.reports)) || {}
  }

  // get resource statuses
  const resourceStatuses = await getResourceStatuses(application, appData)

  return { resourceStatuses, relatedResources }
}

async function getResourceStatuses(application, appData) {
  let query
  const { name, namespace } = application
  if (appData) {
    //query asking for a subset of related kinds and possibly for one subscription only
    if (appData.subscription) {
      //get related resources only for the selected subscription
      query = getQueryStringForResource('Subscription', appData.subscription, namespace)
      //ask only for these type of resources
      query.relatedKinds = appData.relatedKinds
    } else {
      //get related resources only for the selected application
      query = getQueryStringForResource('Application', name, namespace)

      //get related resources for the application, but only this subset
      query.relatedKinds = appData.relatedKinds
    }
  } else {
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

    response.forEach(({ status, value }) => {
      if (status !== 'rejected' && value) {
        // Handle search API response (contains related resources)
        if (value.data) {
          const item = get(value, 'data.searchResult[0].items[0]', {})
          const { name, namespace } = item
          if (name && namespace && relatedResources) {
            set(relatedResources, [`${name}-${namespace}`, 'related'], get(value, 'data.searchResult[0].related'))
          }
        }
        // Handle ManagedClusterView API response (contains resource template)
        else if (value.result) {
          const item = get(value, 'result.metadata', {})
          const { name, namespace } = item
          if (name && namespace && relatedResources) {
            set(relatedResources, [`${name}-${namespace}`, 'template'], value.result)
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
 * @param cluster - Target cluster name
 * @param kind - Kubernetes resource kind
 * @param name - Resource name
 * @param namespace - Resource namespace
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

const getQueryStringForResource = (resourcename, name, namespace) => {
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
