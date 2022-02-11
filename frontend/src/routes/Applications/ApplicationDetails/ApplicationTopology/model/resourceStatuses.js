/* Copyright Contributors to the Open Cluster Management project */
import { getArgoResourceStatuses } from './resourceStatusesArgo'
import { getSubscriptionResourceStatuses } from './resourceStatusesSubscription'

export async function getResourceStatuses(application, appData, topology, lastRefresh) {
    let resourceStatuses
    if (application.isArgoApp) {
        resourceStatuses = await getArgoResourceStatuses(application, appData, topology)
    } else {
        resourceStatuses = await getSubscriptionResourceStatuses(application, appData, topology, lastRefresh)
    }
    return resourceStatuses
}
