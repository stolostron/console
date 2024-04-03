/* Copyright Contributors to the Open Cluster Management project */

import { fetchRetry, getBackendUrl } from '../resources'

export function getUpgradeRiskPredictions(managedClusterIds: string[]) {
  const backendURLPath = getBackendUrl() + '/upgrade-risks-prediction'
  const abortController = new AbortController()
  return fetchRetry<any>({
    method: 'POST',
    url: backendURLPath,
    data: {
      clusterIds: managedClusterIds,
    },
    signal: abortController.signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    disableRedirectUnauthorizedLogin: true,
  })
    .then((res) => res.data)
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
      return []
    })
}
