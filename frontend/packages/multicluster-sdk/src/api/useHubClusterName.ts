/* Copyright Contributors to the Open Cluster Management project */
import { fetchHubClusterName, getCachedHubClusterName } from '../internal/cachedHubClusterName'
import { UseHubClusterName } from '../types'
import { useEffect, useMemo, useState } from 'react'

export const useHubClusterName: UseHubClusterName = () => {
  const cachedHubClusterName = getCachedHubClusterName()
  const [hubClusterName, setHubClusterName] = useState<string | undefined>(cachedHubClusterName)
  const [loaded, setLoaded] = useState<boolean>(!!cachedHubClusterName)
  const [error, setError] = useState<any>(undefined)

  useEffect(() => {
    if (cachedHubClusterName) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return useMemo(() => [hubClusterName, loaded, error], [hubClusterName, loaded, error])
}
