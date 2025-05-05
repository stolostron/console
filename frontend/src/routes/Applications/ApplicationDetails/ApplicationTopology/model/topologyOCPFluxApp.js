/* Copyright Contributors to the Open Cluster Management project */

import { filter, get, includes, uniqBy } from 'lodash'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../helpers/search-helper'
import { createReplicaChild } from './topologySubscription'
import { addClusters, getClusterName, processMultiples } from './utils'

const excludedKindList = ['Cluster', 'Pod', 'ReplicaSet', 'ReplicationController']

export async function getOCPFluxAppTopology(application, hubClusterName) {
  let searchResults = {}
  // Need to get data from search first before we can generate the topology
  searchResults = await getResourcesWithAppLabel(application)

  const resources = processSearchResults(searchResults)

  return generateTopology(application, resources, searchResults, hubClusterName)
}

// Fetch data from search
async function getResourcesWithAppLabel(application) {
  const { name, namespace, app } = application
  const { cluster } = app
  const label = application.isOCPApp
    ? `label:app=${name},app.kubernetes.io/part-of=${name}`
    : `label:kustomize.toolkit.fluxcd.io/name=${name},helm.toolkit.fluxcd.io/name=${name}`
  const query = getQueryStringForLabel(label, namespace, cluster?.name)

  return searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query }],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}

export const getQueryStringForLabel = (label, namespace, cluster) => {
  const namespaceQuery = `namespace:${namespace}`
  const clusterQuery = `cluster:${cluster}`

  return convertStringToQuery(`${label} ${namespaceQuery} ${clusterQuery}`)
}

// Use search results to generate the topology data model
export function generateTopology(application, resources, searchResults, hubClusterName) {
  const links = []
  const nodes = []
  const { name, namespace } = application
  const clusters = []
  const clusterNames = []

  if (application.app.cluster) {
    clusterNames.push(application.app.cluster.name)
    clusters.push({
      metadata: { name: application.app.cluster.name, namespace: application.app.cluster.namespace },
      status: application.app.cluster.status,
    })
  }

  const appId = `application--${name}`
  nodes.push({
    name,
    namespace,
    type: application.isOCPApp ? 'ocpapplication' : 'fluxapplication',
    id: appId,
    uid: appId,
    specs: {
      isDesign: true,
      resourceCount: 0,
      raw: application.app,
      allClusters: {
        isLocal: clusterNames.includes(hubClusterName),
        remoteCount: clusterNames.includes(hubClusterName) ? clusterNames.length - 1 : clusterNames.length,
      },
      clusterNames,
      pulse: 'green',
    },
  })

  const clusterId = addClusters(appId, null, null, clusterNames, clusters, links, nodes, null)

  const others = filter(resources, (obj) => {
    const kind = get(obj, 'kind', '')
    return !includes(excludedKindList, kind)
  })
  processMultiples(others).forEach((resource) => {
    addOCPFluxResource(clusterId, clusterNames, resource, links, nodes, hubClusterName)
  })

  return { nodes: uniqBy(nodes, 'uid'), links, rawSearchData: searchResults }
}

const addOCPFluxResource = (clusterId, clusterNames, resource, links, nodes, hubClusterName) => {
  const {
    name: deployableName,
    namespace: deployableNamespace,
    kind,
    apiversion,
    apigroup,
    resources,
    resourceCount,
  } = resource
  const type = kind.toLowerCase()

  const memberId = `member--member--deployable--member--clusters--${getClusterName(
    clusterId,
    hubClusterName
  )}--${type}--${deployableNamespace}--${deployableName}`

  const raw = {
    metadata: {
      name: deployableName,
      namespace: deployableNamespace,
    },
  }

  let apiVersion = null
  if (apiversion) {
    apiVersion = apigroup ? `${apigroup}/${apiversion}` : apiversion
  }
  if (apiVersion) {
    raw.apiVersion = apiVersion
  }

  const deployableObj = {
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
      resources,
      resourceCount: resourceCount || 0 + clusterNames.length,
    },
  }

  nodes.push(deployableObj)
  links.push({
    from: { uid: clusterId },
    to: { uid: memberId },
    type: '',
  })

  const template = { metadata: {} }
  // create replica subobject, if this object defines a replicas
  createReplicaChild(deployableObj, clusterNames, template, links, nodes)
}

// Put all search results together
export function processSearchResults(searchResults) {
  const items = get(searchResults, 'data.searchResult[0].items', []) ?? []
  const related = get(searchResults, 'data.searchResult[0].related', []) ?? []
  let allItems = items.slice()

  related.forEach((itm) => {
    allItems = allItems.concat(itm.items)
  })

  return allItems
}
