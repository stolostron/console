/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { NO_FLEET_AVAILABLE_ERROR } from './constants'
import { fetchHubConfiguration, getCachedHubConfiguration, HubConfiguration } from './cachedHubConfiguration'
import { useIsFleetAvailable } from '../api'

export const useHubConfigurationItem = <K extends keyof HubConfiguration>(
  key: K
): [HubConfiguration[K] | undefined, boolean, any] => {
  type ItemType = HubConfiguration[K]
  const fleetAvailable = useIsFleetAvailable()
  const cachedResult = getCachedHubConfiguration()?.[key]
  const [item, setItem] = useState<ItemType | undefined>(fleetAvailable ? cachedResult : undefined)
  const [loaded, setLoaded] = useState<boolean>(fleetAvailable ? cachedResult !== undefined : false)
  const [error, setError] = useState<any>(fleetAvailable ? undefined : NO_FLEET_AVAILABLE_ERROR)

  const setResult = useCallback((item: ItemType) => {
    setItem(item)
    setLoaded(true)
    setError(undefined)
  }, [])

  useEffect(() => {
    if (!fleetAvailable) {
      setItem(undefined)
      setLoaded(false)
      setError(NO_FLEET_AVAILABLE_ERROR)
    } else {
      const cachedHubConfiguration = getCachedHubConfiguration()
      if (cachedHubConfiguration) {
        setResult(cachedHubConfiguration[key])
      } else {
        fetchHubConfiguration()
          .then((hc) => {
            if (hc) {
              setResult(hc[key])
            }
          })
          .catch((err) => {
            setLoaded(false)
            setError(err)
          })
      }
    }
  }, [fleetAvailable, key, setResult])

  return useMemo(() => [item, loaded, error], [item, loaded, error])
}
