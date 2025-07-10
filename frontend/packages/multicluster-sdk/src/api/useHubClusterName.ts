/* Copyright Contributors to the Open Cluster Management project */
import { fetchHubClusterName, getCachedHubClusterName } from '../internal/cachedHubClusterName'
import { UseHubClusterName } from '../types'
import { useEffect, useMemo, useState } from 'react'

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

  useEffect(() => {
    if (!cachedHubClusterName) {
      void (async () => {
        try {
          const hubName = await fetchHubClusterName()
          setHubClusterName(hubName)
          setLoaded(true)
        } catch (err) {
          setError(err)
        }
      })()
    }
  }, [cachedHubClusterName])

  return useMemo(() => [hubClusterName, loaded, error], [hubClusterName, loaded, error])
}
