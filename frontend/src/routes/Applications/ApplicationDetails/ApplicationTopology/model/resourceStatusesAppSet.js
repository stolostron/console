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
    const argoAppsLabelNames = []

    appSetApps.forEach((argoApp) => {
        //get destination and clusters information
        argoAppsLabelNames.push(`app.kubernetes.io/instance=${argoApp.metadata.name}`)
        const argoNS = argoApp.spec.destination.namespace
        argoNS && targetNS.push(argoNS)
    })

    const resources = appSetApps.length > 0 ? _.get(appSetApps[0], 'status.resources') : []
    let definedNamespace = ''
    let kindsNotNamespaceScoped = ['cluster']
    resources.forEach((resource) => {
        definedNamespace = _.get(resource, 'namespace')
        if (!resource.namespace) {
            kindsNotNamespaceScoped.push(resource.kind.toLowerCase())
        }
    })

    appData.targetNamespaces = definedNamespace ? definedNamespace : _.uniq(targetNS)
    appData.argoAppsLabelNames = _.uniq(argoAppsLabelNames)

    let query //= getQueryStringForResource('Application', name, namespace)
    let queryNotNamespaceScoped
    const argoKinds = appData.relatedKinds
        ? appData.relatedKinds.filter(function (el) {
              return !kindsNotNamespaceScoped.includes(el)
          })
        : null

    query = getQueryStringForResource(argoKinds, null, appData.targetNamespaces.toString())
    if (kindsNotNamespaceScoped.length > 0) {
        queryNotNamespaceScoped = getQueryStringForResource(kindsNotNamespaceScoped)
    }
    //get the cluster for each target namespace and all pods related to this objects only
    //always ask for related pods, replicaset and replocationcontroller because they are tagged by the app instance
    //we'll get them if any are linked to the objects returned above
    query.relatedKinds.push('cluster', 'pod', 'replicaset', 'replicationcontroller')

    return searchClient.query({
        query: SearchResultRelatedItemsDocument,
        variables: {
            input: [{ ...query }, { ...queryNotNamespaceScoped }],
            limit: 1000,
        },
        fetchPolicy: 'network-only',
    })
}
