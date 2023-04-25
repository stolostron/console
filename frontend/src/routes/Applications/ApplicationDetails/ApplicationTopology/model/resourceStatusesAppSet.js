/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import { searchClient } from '../../../../Home/Search/search-sdk/search-client'
import { SearchResultRelatedItemsDocument } from '../../../../Home/Search/search-sdk/search-sdk'
import { getArgoSecret, getQueryStringForResource } from './resourceStatusesArgo'

export async function getAppSetResourceStatuses(application, appData) {
  const { name, namespace, appSetApps } = application
  const resourceStatuses = await getResourceStatuses(name, namespace, appSetApps, appData)

  const secret = await getArgoSecret(appData, resourceStatuses)
  if (secret) {
    const secretItems = _.get(secret, 'data.searchResult', [{ items: [] }])[0]
    _.set(appData, 'argoSecrets', _.get(secretItems, 'items', []))
  }

  return { resourceStatuses }
}

async function getResourceStatuses(name, namespace, appSetApps, appData) {
  const targetNS = []

  appSetApps.forEach((argoApp) => {
    //get destination and clusters information
    const argoNS = argoApp.spec.destination.namespace
    argoNS && targetNS.push(argoNS)
  })

  const resources = appSetApps.length > 0 ? _.get(appSetApps[0], 'status.resources', []) : []
  const definedNamespace = []
  const kindsNotNamespaceScoped = []
  const kindsNotNamespaceScopedNames = []
  resources.forEach((resource) => {
    const rscNS = _.get(resource, 'namespace')
    const rscKind = _.get(resource, 'kind')
    if (rscNS) {
      definedNamespace.push(rscNS)
    }
    if (!rscNS) {
      if (rscKind.toLowerCase() === 'project') {
        kindsNotNamespaceScoped.push('namespace')
      } else {
        kindsNotNamespaceScoped.push(resource.kind.toLowerCase())
      }
      kindsNotNamespaceScopedNames.push(resource.name)
    }
  })

  appData.targetNamespaces = definedNamespace.length > 0 ? _.uniq(definedNamespace) : _.uniq(targetNS)

  let query //= getQueryStringForResource('Application', name, namespace)
  let queryNotNamespaceScoped = [] //= getQueryStringForResource('cluster', other kinds)
  const argoKinds = appData.relatedKinds
    ? appData.relatedKinds.filter(function (el) {
        return !kindsNotNamespaceScoped.includes(el)
      })
    : null

  query = getQueryStringForResource(argoKinds, null, appData.targetNamespaces.toString())
  if (kindsNotNamespaceScoped.length > 0) {
    kindsNotNamespaceScoped.forEach((item, i) => {
      queryNotNamespaceScoped.push(getQueryStringForResource(item, kindsNotNamespaceScopedNames[i]))
    })
  }
  //get the cluster for each target namespace and all pods related to this objects only
  //always ask for related pods, replicaset and replocationcontroller because they are tagged by the app instance
  //we'll get them if any are linked to the objects returned above
  query.relatedKinds.push('cluster', 'pod', 'replicaset', 'replicationcontroller')

  return searchClient.query({
    query: SearchResultRelatedItemsDocument,
    variables: {
      input: [{ ...query }, ...queryNotNamespaceScoped],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })
}
