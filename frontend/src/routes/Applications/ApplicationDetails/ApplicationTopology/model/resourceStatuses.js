/* Copyright Contributors to the Open Cluster Management project */
import { getArgoResourceStatuses } from './resourceStatusesArgo'
import { getSubscriptionResourceStatuses } from './resourceStatusesSubscription'
import { getAppSetResourceStatuses } from './resourceStatusesAppSet'
import { cloneDeep } from 'lodash'

export async function getResourceStatuses(application, appData, topology) {
  let results
  const appDataWithStatuses = cloneDeep(appData)
  if (application.isArgoApp) {
    results = await getArgoResourceStatuses(application, appDataWithStatuses, topology)
  } else if (application.isAppSet) {
    results = await getAppSetResourceStatuses(application, appDataWithStatuses)
  } else if (application.isOCPApp || application.isFluxApp) {
    results = {
      // reuse the search data we fetched before
      resourceStatuses: topology.rawSearchData,
      relatedResources: {},
    }
  } else {
    results = await getSubscriptionResourceStatuses(application, appDataWithStatuses, topology)
  }
  const { resourceStatuses, relatedResources } = results
  return { resourceStatuses: cloneDeep(resourceStatuses), relatedResources, appDataWithStatuses }
}
