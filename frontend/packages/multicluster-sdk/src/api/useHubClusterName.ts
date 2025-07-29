/* Copyright Contributors to the Open Cluster Management project */
import { fetchFleetConfiguration, getCachedHubClusterName } from '../internal/cachedFleetConfiguration'
import { UseHubClusterName } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { useIsFleetAvailable } from './useIsFleetAvailable'

/**
 * Hook that provides hub cluster name.
 *
 * @returns Array with `hubclustername`, `loaded` and `error` values.
 */
export const useHubClusterName: UseHubClusterName = () => {
  const cachedHubClusterName = getCachedHubClusterName()
  const [hubClusterName, setHubClusterName] = useState<string | undefined>(cachedHubClusterName)
  const [loaded, setLoaded] = useState<boolean>(!!cachedHubClusterName)
  const [error, setError] = useState<any>(undefined)

  const fleetAvailable = useIsFleetAvailable()

  useEffect(() => {
    if (!fleetAvailable) {
      setHubClusterName(undefined)
      setLoaded(false)
      setError('A version of RHACM that is compatible with the multicluster SDK is not available')
      return
    }

    const currentCachedName = getCachedHubClusterName()
    if (!currentCachedName) {
      void (async () => {
        try {
          const configuration = await fetchFleetConfiguration()
          setHubClusterName(configuration?.localHubName)
          setLoaded(true)
        } catch (err) {
          setError(err)
        }
      })()
    }
  }, [fleetAvailable])

  return useMemo(() => [hubClusterName, loaded, error], [hubClusterName, loaded, error])
}
