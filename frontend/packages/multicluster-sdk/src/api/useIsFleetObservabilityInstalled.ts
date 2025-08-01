/* Copyright Contributors to the Open Cluster Management project */
import { UseIsFleetObservabilityInstalled } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { NO_FLEET_AVAILABLE_ERROR } from '../internal/constants'
import { getCachedFleetObservabilityInstalled } from '../internal/cachedFleetObservabilityInstalled'

/**
 * Hook that provides is observability installed.
 *
 * @returns Array with `isObservabilityInstalled`, `loaded` and `error` values.
 */
export const useIsFleetObservabilityInstalled: UseIsFleetObservabilityInstalled = () => {
  const [fleetObservabilityInstalled, setFleetObservabilityInstalled] = useState<boolean | null>(null)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)

  const fleetAvailable = useIsFleetAvailable()

  useEffect(() => {
    if (!fleetAvailable) {
      setFleetObservabilityInstalled(null)
      setLoaded(false)
      setError(NO_FLEET_AVAILABLE_ERROR)
      return
    }

    getCachedFleetObservabilityInstalled()
      .then((fleetObservabilityInstalled) => {
        setFleetObservabilityInstalled(fleetObservabilityInstalled ?? null)
        setLoaded(true)
      })
      .catch((err) => {
        setError(err)
      })
  }, [fleetAvailable])

  return useMemo(() => [fleetObservabilityInstalled, loaded, error], [fleetObservabilityInstalled, loaded, error])
}
