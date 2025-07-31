/* Copyright Contributors to the Open Cluster Management project */

import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { useEffect, useMemo, useState } from 'react'
import { getBackendUrl, useIsFleetAvailable } from '../api'
import { FLEET_CONFIGURATION_URL, NO_FLEET_AVAILABLE_ERROR } from './constants'

export type FleetConfiguration = {
  isGlobalHub: boolean
  localHubName: string
  isHubSelfManaged: boolean
  isObservabilityInstalled: boolean
}

export type UseFleetConfiguration = () => [fleetConfiguration: FleetConfiguration | null, loaded: boolean, error: any]

let cachedFleetConfiguration: FleetConfiguration | undefined = undefined

export const useFleetConfiguration: UseFleetConfiguration = () => {
  const [fleetConfiguration, setFleetConfiguration] = useState<FleetConfiguration | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const fleetAvailable = useIsFleetAvailable()

  useEffect(() => {
    if (!fleetAvailable) {
      setFleetConfiguration(null)
      setLoading(false)
      setError(new Error(NO_FLEET_AVAILABLE_ERROR))
      return
    }

    consoleFetchJSON(`${getBackendUrl()}${FLEET_CONFIGURATION_URL}`, 'GET')
      .then((data) => {
        setFleetConfiguration(data)
        cachedFleetConfiguration = data
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [fleetAvailable])
  return useMemo(() => [fleetConfiguration, loading, error], [fleetConfiguration, loading, error])
}

export const getCachedHubClusterName = (): string | undefined => {
  return cachedFleetConfiguration?.localHubName
}

export const getCachedIsObservabilityInstalled = (): boolean | undefined => {
  return cachedFleetConfiguration?.isObservabilityInstalled
}
