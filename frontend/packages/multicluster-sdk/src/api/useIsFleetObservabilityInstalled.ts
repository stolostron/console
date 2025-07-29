/* Copyright Contributors to the Open Cluster Management project */
import { fetchFleetConfiguration, getCachedIsObservabilityInstalled } from '../internal/cachedFleetConfiguration'
import { UseIsFleetObservabilityInstalled } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { useIsFleetAvailable } from './useIsFleetAvailable'

/**
 * Hook that provides hub cluster name.
 *
 * @returns Array with `isObservabilityInstalled`, `loaded` and `error` values.
 */
export const useIsFleetObservabilityInstalled: UseIsFleetObservabilityInstalled = () => {
  const cachedIsObservabilityInstalled = getCachedIsObservabilityInstalled()
  const [isObservabilityInstalled, setIsObservabilityInstalled] = useState<boolean | null>(
    cachedIsObservabilityInstalled ?? null
  )
  const [loaded, setLoaded] = useState<boolean>(!!cachedIsObservabilityInstalled)
  const [error, setError] = useState<any>(undefined)

  const fleetAvailable = useIsFleetAvailable()

  useEffect(() => {
    if (!fleetAvailable) {
      setIsObservabilityInstalled(null)
      setLoaded(false)
      setError('A version of RHACM that is compatible with the multicluster SDK is not available')
      return
    }

    const currentCachedIsObservabilityInstalled = getCachedIsObservabilityInstalled()
    if (!currentCachedIsObservabilityInstalled) {
      void (async () => {
        try {
          const configuration = await fetchFleetConfiguration()
          setIsObservabilityInstalled(configuration?.isObservabilityInstalled ?? null)
          setLoaded(true)
        } catch (err) {
          setError(err)
        }
      })()
    }
  }, [fleetAvailable])

  return useMemo(() => [isObservabilityInstalled, loaded, error], [isObservabilityInstalled, loaded, error])
}
