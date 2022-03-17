/* Copyright Contributors to the Open Cluster Management project */

import { fireManagedClusterView } from '../../../../../resources/managedclusterview'
import { searchClient } from '../../../../Home/Search/search-sdk/search-client'
import { SearchResultRelatedItemsDocument } from '../../../../Home/Search/search-sdk/search-sdk'
import { get, set } from 'lodash'

export async function getRelatedResources(reports = []) {
    const promises = []
    reports
        .filter((report) => !!report.resources)
        .forEach(({ results, resources }) => {
            let cluster
            // find first cluster this was successfully deployed to
            results.find(({ source, result }) => {
                if (result === 'deployed') {
                    cluster = source
                    return true
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
