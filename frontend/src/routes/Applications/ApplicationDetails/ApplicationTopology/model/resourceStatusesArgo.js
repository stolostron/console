/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import { searchClient } from '../../../../Home/Search/search-sdk/search-client'
import { SearchResultRelatedItemsDocument } from '../../../../Home/Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../helpers/search-helper'

export async function getArgoResourceStatuses(application, appData, topology) {
  const argoSource = await getArgoSource(application, appData)

  // get resource statuses
  const resourceStatuses = await getResourceStatuses(application.app, appData, topology, argoSource)

  const secret = await getArgoSecret(appData, resourceStatuses)
  if (secret) {
    const secretItems = _.get(secret, 'data.searchResult', [{ items: [] }])[0]
    _.set(appData, 'argoSecrets', _.get(secretItems, 'items', []))
  }

  return { resourceStatuses }
}

async function getArgoSource(application, appData) {
  //get all argo apps with the same source repo as this one
  const { namespace } = application
  const query = convertStringToQuery('kind:application apigroup:argoproj.io')
  if (appData.applicationSet) {
    // ApplicationSet name is only unique within cluster and namespace
    ;['applicationSet', 'cluster'].forEach((property) => {
      query.filters.push({ property, values: [appData[property]] })
    })
    query.filters.push({ property: 'namespace', values: [namespace] })
  } else {
    let targetRevisionFound = false
    const searchProperties = _.pick(appData.source, ['repoURL', 'path', 'chart', 'targetRevision'])
    for (const [property, value] of Object.entries(searchProperties)) {
      // add argo app source filters
      let propValue = value
      if (property === 'targetRevision') {
        targetRevisionFound = true
        if (propValue.length === 0) {
          propValue = 'HEAD'
        }
      }

      query.filters.push({ property, values: [propValue] })
    }

    if (!targetRevisionFound) {
      query.filters.push({ property: 'targetRevision', values: ['HEAD'] })
    }
  }
  return searchClient.query({
    query: SearchResultRelatedItemsDocument,
    variables: {
      input: [{ ...query }],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}

async function getResourceStatuses(app, appData, topology, argoSource) {
  const name = _.get(app, 'metadata.name')
  const namespace = _.get(app, 'metadata.namespace')
  const kindsNotNamespaceScoped = []
  const kindsNotNamespaceScopedNames = []
  if (argoSource) {
    const { searchResult } = argoSource.data
    const searchResultItems = searchResult && searchResult.length && _.get(searchResult[0], 'items', [])
    const allApps = searchResultItems ? searchResultItems.filter((searchApp) => searchApp.kind === 'Application') : []
    const targetNS = []
    const targetClusters = []
    const targetNSForClusters = {} //keep track of what namespaces each cluster must deploy on
    allApps.forEach((argoApp) => {
      //get destination and clusters information
      const argoNS = argoApp.destinationNamespace
      argoNS && targetNS.push(argoNS)
      const argoServerDest = findMatchingCluster(argoApp, _.get(appData, 'argoSecrets'))
      const argoServerNameDest = argoServerDest || argoApp.destinationName
      _.set(argoApp, 'destinationCluster', argoServerNameDest || argoApp.destinationServer)
      const targetClusterName = argoServerNameDest ? argoServerNameDest : argoServerDest ? argoServerDest : null
      if (targetClusterName) {
        targetClusters.push(targetClusterName)
        //add namespace to target list
        if (!targetNSForClusters[targetClusterName]) {
          targetNSForClusters[targetClusterName] = []
        }
        if (argoNS && !_.includes(targetNSForClusters[targetClusterName], argoNS)) {
          targetNSForClusters[targetClusterName].push(argoNS)
        }
      }
    })

    const resources = _.get(app, 'status.resources', [])
    const resourceNS = []
    resources.forEach((rsc) => {
      const rscNS = _.get(rsc, 'namespace')
      if (rscNS) {
        resourceNS.push(rscNS)
      }
      if (!rscNS) {
        kindsNotNamespaceScoped.push(rsc.kind.toLowerCase())
        kindsNotNamespaceScopedNames.push(rsc.name)
      }
    })
    appData.targetNamespaces = resourceNS.length > 0 ? _.uniq(resourceNS) : _.uniq(targetNS)
    appData.clusterInfo = _.uniq(targetClusters)
    //store all argo apps and destination clusters info on the first app
    const topoResources = topology.nodes
    const firstNode = topoResources[0]
    const topoClusterNode = _.find(topoResources, {
      id: 'member--clusters--',
    })
    _.set(firstNode, 'specs.relatedApps', allApps)
    //desired deployment state
    _.set(firstNode, 'specs.clusterNames', appData.clusterInfo)
    _.set(topoClusterNode, 'specs.appClusters', appData.clusterInfo)
    const initialClusterData = []
    //make sure clusters array always contain only objects
    appData.clusterInfo.forEach((cls) => {
      initialClusterData.push({
        name: cls,
      })
    })
    _.set(topoClusterNode, 'specs.clusters', initialClusterData)
    _.set(topoClusterNode, 'specs.targetNamespaces', targetNSForClusters)
  }

  let query = getQueryStringForResource('Application', name, namespace)
  const queryNotNamespaceScoped = [] //= getQueryStringForResource('cluster', other kinds)
  if (appData && appData.targetNamespaces) {
    const argoKinds = appData.relatedKinds
      ? appData.relatedKinds.filter(function (el) {
          return !kindsNotNamespaceScoped.includes(el)
        })
      : null
    //get all resources from the target namespace since they are not linked to the argo application
    query = getQueryStringForResource(argoKinds, null, appData.targetNamespaces.toString())
    if (kindsNotNamespaceScoped.length > 0) {
      kindsNotNamespaceScoped.forEach((item, i) => {
        queryNotNamespaceScoped.push(getQueryStringForResource(item, kindsNotNamespaceScopedNames[i]))
      })
    }
    //get the cluster for each target namespace and all pods related to this objects only
    //always ask for related pods, replicaset and replocationcontroller because they are tagged by the app instance
    // we'll get them if any are linked to the objects returned above
    query.relatedKinds.push('cluster', 'pod', 'replicaset', 'replicationcontroller')
  }
  return searchClient.query({
    query: SearchResultRelatedItemsDocument,
    variables: {
      input: [{ ...query }, ...queryNotNamespaceScoped],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}

//try to find the name of the remote clusters using the server path
export const findMatchingCluster = (argoApp, argoMappingInfo) => {
  const serverApi = _.get(argoApp, 'destinationServer')
  if (
    (serverApi && serverApi === 'https://kubernetes.default.svc') ||
    _.get(argoApp, 'destinationName', '') === 'in-cluster'
  ) {
    return argoApp.cluster //target is the same as the argo app cluster
  }
  if (argoMappingInfo && serverApi) {
    // try to get server name from argo secret annotation
    try {
      const serverHostName = new URL(serverApi).hostname.substring(0, 63)
      const nameLabel = 'cluster-name='
      const serverLabel = `cluster-server=${serverHostName}`
      const mapServerInfo = _.find(_.map(argoMappingInfo, 'label', []), (obj) => obj.indexOf(serverLabel) !== -1)
      if (mapServerInfo) {
        // get the cluster name
        const labelsList = mapServerInfo.split(';')
        const clusterNameLabel = _.find(labelsList, (obj) => _.includes(obj, nameLabel))
        if (clusterNameLabel) {
          return clusterNameLabel.split('=')[1]
        }
        return serverApi
      }
    } catch (err) {
      // do nothing
      return serverApi
    }
  }
  return serverApi
}

export const getArgoSecret = (appData, resourceStatuses = {}) => {
  const searchResult = _.get(resourceStatuses, 'data.searchResult', [])
  if (searchResult.length > 0 && searchResult[0].items) {
    // For the no applicationSet case, make sure we don't include apps with applicationSet
    const allApps = _.get(searchResult[0], 'items', []).filter((app) => app.applicationSet === appData.applicationSet)
    // find argo server mapping
    const argoAppNS = _.uniqBy(_.map(allApps, 'namespace'))
    if (argoAppNS.length > 0) {
      const query = convertStringToQuery(
        `kind:secret namespace:${argoAppNS.join()} label:apps.open-cluster-management.io/acm-cluster='true'`
      )
      return searchClient.query({
        query: SearchResultRelatedItemsDocument,
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

export const getQueryStringForResource = (resourcename, name, namespace) => {
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
