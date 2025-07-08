/* Copyright Contributors to the Open Cluster Management project */
import { fetchHubClusterName, getCachedHubClusterName } from '../internal/cachedHubClusterName'
import { UseHubClusterName } from '../types'
import { useEffect, useMemo, useState } from 'react'

export const useHubClusterName: UseHubClusterName = () => {
  const cachedhubClusterName = getCachedHubClusterName()
  const [hubClusterName, setHubClusterName] = useState<string | undefined>(cachedhubClusterName)
  const [loaded, setLoaded] = useState<boolean>(!cachedhubClusterName ? false : true)
  const [error, setError] = useState<any>(undefined)

  useEffect(() => {
    if (cachedhubClusterName) {
      return undefined
    }
    void (async () => {
      try {
        const hubName = await fetchHubClusterName()
        setHubClusterName(hubName)
        setLoaded(true)
      } catch (err) {
        setError(err)
      }
    })()
  }, [cachedhubClusterName])

  return useMemo(() => [hubClusterName, loaded, error], [hubClusterName, loaded, error])
}
