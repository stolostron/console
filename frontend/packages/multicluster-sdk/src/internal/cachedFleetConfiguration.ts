/* Copyright Contributors to the Open Cluster Management project */
import { getBackendUrl } from '../api/apiRequests'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

const getFleetConfigurationUrl = '/hub'
let cachedFleetConfiguration: FleetConfiguration | undefined = undefined
let fetchPromise: Promise<FleetConfiguration | undefined> | undefined = undefined

export type FleetConfiguration = {
  isGlobalHub: boolean
  localHubName: string
  isHubSelfManaged: boolean
  isObservabilityInstalled: boolean
}

export const fetchFleetConfiguration = async (): Promise<FleetConfiguration | undefined> => {
  if (cachedFleetConfiguration) {
    return cachedFleetConfiguration
  }

  if (fetchPromise) {
    return fetchPromise
  }

  fetchPromise = (async () => {
    const url = getBackendUrl() + getFleetConfigurationUrl
    const data = await consoleFetchJSON(url, 'GET')
    cachedFleetConfiguration = data
    return cachedFleetConfiguration
  })()

  return fetchPromise
}

export const getCachedHubClusterName = (): string | undefined => {
  return cachedFleetConfiguration?.localHubName
}

export const getCachedIsObservabilityInstalled = (): boolean | undefined => {
  return cachedFleetConfiguration?.isObservabilityInstalled
}
