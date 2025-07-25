/* Copyright Contributors to the Open Cluster Management project */

import { FleetConfiguration, UseFleetConfiguration } from '../types'
import { useURLPoll as useFleetConfigurationPoll } from '../internal/useURLPoll'
import { getBackendUrl } from './apiRequests'
import { useEffect, useMemo, useState } from 'react'

/**
 * Hook that returns the fleet configuration. Checks periodically for changes in the fleet configuration.
 *
 * @returns {FleetConfiguration}
 */

export const useFleetConfiguration: UseFleetConfiguration = () => {
  const [fleetConfig, setFleetConfig] = useState<FleetConfiguration | null>(null)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [response, error, loading] = useFleetConfigurationPoll<FleetConfiguration>(`${getBackendUrl()}/hub`)
  useEffect(() => {
    if (!loading) {
      setFleetConfig(response)
      setLoaded(true)
    }
  }, [response, loading])
  return useMemo(() => [fleetConfig, loaded, error], [fleetConfig, loaded, error])
}
