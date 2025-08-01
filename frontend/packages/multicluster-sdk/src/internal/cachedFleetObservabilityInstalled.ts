/* Copyright Contributors to the Open Cluster Management project */
import { getBackendUrl } from '../api/apiRequests'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { FLEET_CONFIGURATION_URL } from './constants'

let cachedFleetObservabilityInstalled: boolean | undefined = undefined
let fetchPromise: Promise<boolean | undefined> | undefined = undefined

export const fetchFleetObservabilityInstalled = async (): Promise<boolean | undefined> => {
  if (cachedFleetObservabilityInstalled) {
    return cachedFleetObservabilityInstalled
  }

  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (async () => {
    const url = getBackendUrl() + FLEET_CONFIGURATION_URL
    const data = await consoleFetchJSON(url, 'GET')
    cachedFleetObservabilityInstalled = data.isObservabilityInstalled
    return cachedFleetObservabilityInstalled
  })()

  return fetchPromise
}

export const getCachedFleetObservabilityInstalled = (): boolean | undefined => {
  return cachedFleetObservabilityInstalled
}
