/* Copyright Contributors to the Open Cluster Management project */
import { getBackendUrl } from '../api/apiRequests'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

const FLEET_CONFIGURATION_URL = '/hub'

export type HubConfiguration = {
  isGlobalHub: boolean
  localHubName: string
  isHubSelfManaged: boolean
  isObservabilityInstalled: boolean
}

let cachedHubConfiguration: HubConfiguration | undefined = undefined
let fetchPromise: Promise<HubConfiguration | undefined> | undefined = undefined

export const fetchHubConfiguration = async (): Promise<HubConfiguration | undefined> => {
  if (cachedHubConfiguration) {
    return cachedHubConfiguration
  }

  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (consoleFetchJSON(getBackendUrl() + FLEET_CONFIGURATION_URL, 'GET') as Promise<HubConfiguration>).then(
    (hc) => {
      cachedHubConfiguration = hc
      return hc
    }
  )
  return fetchPromise
}

export const getCachedHubConfiguration = (): HubConfiguration | undefined => {
  return cachedHubConfiguration
}
