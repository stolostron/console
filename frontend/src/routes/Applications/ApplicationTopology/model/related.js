/* Copyright Contributors to the Open Cluster Management project */

// import _ from 'lodash'

// import * as Actions from './index'
// import { RESOURCE_TYPES } from '../../lib/shared/constants'
// import apolloClient from '../../lib/client/apollo-client'
// import { fetchResource, receiveClusterOffline } from './common'
import { nodeMustHavePods } from '../../../../components/Topology/utils/diagram-helpers-utils'
// import { SEARCH_QUERY } from '../apollo-client/queries/SearchQueries'
// import {
//   convertStringToQuery,
//   searchError,
//   searchFailure,
//   searchSuccess
// } from '../../lib/client/search-helper'
// import msgs from '../../nls/platform.properties'
import { getSubscriptionRelatedQuery } from './subscription/related'

export const getRelatedQuery = (application, topology) => {
    const appData = getApplicationData(topology.nodes)
    const { name, namespace } = application
    if (appData.isArgoApp) {
        fetchArgoApplications(dispatch, appNS, appName, appData, resourceType, fetchFilters, response)
    } else {
        return getSubscriptionRelatedQuery(namespace, name, appData)
    }
}

export const getApplicationData = (nodes) => {
    let subscriptionName = ''
    let nbOfSubscriptions = 0
    let resourceMustHavePods = false
    const nodeTypes = []
    const result = {}
    let isArgoApp = false
    const appNode = nodes.find((r) => r.type === 'application')
    if (appNode) {
        isArgoApp = _.get(appNode, ['specs', 'raw', 'apiVersion'], '').indexOf('argo') !== -1
        result.isArgoApp = isArgoApp
        //get argo app destination namespaces 'show_search':
        if (isArgoApp) {
            const applicationSetRef = _.get(appNode, ['specs', 'raw', 'metadata', 'ownerReferences'], []).find(
                (owner) => owner.apiVersion.startsWith('argoproj.io/') && owner.kind === 'ApplicationSet'
            )
            if (applicationSetRef) {
                result.applicationSet = applicationSetRef.name
            }
            let cluster = 'local-cluster'
            const clusterNames = _.get(appNode, ['specs', 'cluster-names'], [])
            if (clusterNames.length > 0) {
                cluster = clusterNames[0]
            }
            result.cluster = cluster
            result.source = _.get(appNode, ['specs', 'raw', 'spec', 'source'], {})
        }
    }
    nodes.forEach((node) => {
        const nodeType = _.get(node, 'type', '')
        if (!(isArgoApp && _.includes(['application', 'cluster'], nodeType))) {
            nodeTypes.push(nodeType) //ask for this related object type
        }
        if (nodeMustHavePods(node)) {
            //request pods when asking for related resources, this resource can have pods
            resourceMustHavePods = true
        }
        if (nodeType === 'subscription') {
            subscriptionName = _.get(node, 'name', '')
            nbOfSubscriptions = nbOfSubscriptions + 1
        }
    })

    if (resourceMustHavePods) {
        nodeTypes.push('pod')
    }

    //if only one subscription, ask for resources only related to that subscription
    result.subscription = nbOfSubscriptions === 1 ? subscriptionName : null
    //ask only for these type of resources since only those are displayed
    result.relatedKinds = _.uniq(nodeTypes)

    return result
}

// return dispatch => {
//   dispatch(requestResource(resourceType))
//   return apolloClient
//     .search(SEARCH_QUERY_RELATED, { input: [query] })
//     .then(response => {
//       if (response.errors) {
//         searchFailure()
//         return dispatch(
//           receiveResourceError(response.errors[0], resourceType)
//         )
//       }
//       const searchResult = _.get(response, 'data.searchResult', [])
//       if (
//         !querySettings.isArgoApp &&
//         (searchResult.length === 0 ||
//           _.get(searchResult[0], 'items', []).length === 0)
//       ) {
//         //ignore this for argo apps, if we got to this point the app exists
//         //app not found
//         const err = {
//           err: msgs.get(
//             'load.app.info.notfound',
//             [`${namespace}/${name}`],
//             'en-US'
//           )
//         }
//         return dispatch(receiveResourceNotFound(err, resourceType))
//       }
//       searchSuccess()
//       return dispatch(
//         receiveResourceSuccess(
//           {
//             items: mapSingleApplication(
//               _.cloneDeep(response.data.searchResult[0])
//             )
//           },
//           resourceType
//         )
//       )
//     })
//     .catch(err => {
//       searchError()
//       dispatch(receiveResourceError(err, resourceType))
//     })
// }
// }
