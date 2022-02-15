/* Copyright Contributors to the Open Cluster Management project */

import { fireManagedClusterView } from '../../../../../resources/managedclusterview'
import { searchClient } from '../../../../Home/Search/search-sdk/search-client'
import { convertStringToQuery } from '../helpers/search-helper'
import { SearchResultRelatedItemsDocument } from '../../../../Home/Search/search-sdk/search-sdk'
import { get, set, isEqual } from 'lodash'

export async function getSubscriptionResourceStatuses(application, appData, topology, lastRefresh) {
    // get related resources -- only need to do if subscription report changes
    // with SubscriptionReport need to find out what service/replicaset goes with what route/deployment
    let relatedResources
    if (application.reports && (!lastRefresh || !isEqual(application.reports, lastRefresh.application.reports))) {
        relatedResources = await getRelatedResources(application.reports)
    } else {
        relatedResources = lastRefresh.relatedResources
    }

    // get resource statuses
    resourceStatuses = await getResourceStatuses(application, appData)

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
            //filter out any argo app with the same name and ns, we are looking here for acm apps
            query = { filters: [{ property: 'apigroup', values: ['!argoproj.io'] }] }

            //get related resources for the application, but only this subset
            query.relatedKinds = appData.relatedKinds
        }
    } else {
        query = getQueryStringForResource('Application', name, namespace)
    }
    return searchClient.query({
        query: SearchResultRelatedItemsDocument,
        variables: {
            input: [{ ...query }],
            limit: 10000,
        },
        fetchPolicy: 'cache-first',
    })
}

async function getRelatedResources(reports) {
    const promises = []
    reports
        .filter((report) => !!report.resources)
        .forEach(({ results, resources }) => {
            let cluster
            // find first cluster this was successfully deployed to
            // favor local-host
            results.some(({ source, result }) => {
                if (result === 'deployed') {
                    cluster = source
                    return source === 'local-host'
                }
                return false
            })
            resources.forEach((resource) => {
                const { kind, name, namespace } = resource
                const query = {
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
                switch (kind) {
                    case 'Deployment':
                    case 'DeploymentConfig':
                        promises.push(getSearchPromise(cluster, kind, name, namespace, ['replicaset', 'pod']))
                        break
                    case 'Route':
                        promises.push(
                            fireManagedClusterView(cluster, 'route', 'route.openshift.io/v1', name, namespace)
                        )
                        break
                    case 'Ingress':
                        promises.push(
                            fireManagedClusterView(cluster, 'ingress', 'networking.k8s.io/v1', name, namespace)
                        )
                        break
                    case 'StatefulSet':
                        promises.push(fireManagedClusterView(cluster, 'statefulset', 'apps/v1', name, namespace))
                        break
                }
            })
        })
    let relatedResources
    if (promises.length) {
        relatedResources = {}
        const response = await Promise.allSettled(promises)
        response.forEach(({ status, value }) => {
            if (status !== 'rejected') {
                // search response
                if (value.data) {
                    const item = get(value, 'data.searchResult[0].items[0]', {})
                    const { name, namespace } = item
                    set(
                        relatedResources,
                        [`${name}-${namespace}`, 'related'],
                        get(value, 'data.searchResult[0].related')
                    )
                    // managedclusterview response
                } else if (value.result) {
                    const item = get(value, 'result.metadata', {})
                    const { name, namespace } = item
                    set(relatedResources, [`${name}-${namespace}`, 'template'], value.result)
                }
            }
        })
    }
    return relatedResources
}

const getSearchPromise = (cluster, kind, name, namespace, relatedKinds) => {
    const query = {
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
        query: SearchResultRelatedItemsDocument,
        variables: {
            input: [{ ...query, relatedKinds }],
            limit: 10000,
        },
        fetchPolicy: 'cache-first',
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
