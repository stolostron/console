import _ from 'lodash'
import { convertStringToQuery } from '../../../../../components/Topology/utils/search-helper'

export const getSubscriptionRelatedQuery = (namespace, name, appData) => {
    let query = getQueryStringForResource('Application', name, namespace)
    if (appData) {
        //query asking for a subset of related kinds and possibly for one subscription only
        if (appData.subscription) {
            //get related resources only for the selected subscription
            query = getQueryStringForResource('Subscription', appData.subscription, namespace)
            //ask only for these type of resources
            query.relatedKinds = appData.relatedKinds
        } else {
            //filter out any argo app with the same name and ns, we are looking here for acm apps
            query.filters.push({ property: 'apigroup', values: ['!argoproj.io'] })

            //get related resources for the application, but only this subset
            query.relatedKinds = appData.relatedKinds
        }
    }
    return query
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
    return convertStringToQuery(`${resource}${nameForQuery}${namespaceForQuery}`)
}
