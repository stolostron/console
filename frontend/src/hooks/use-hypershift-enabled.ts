/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { fetchGet, getBackendUrl } from '../resources/utils'
import { useLocalHubName } from '../hooks/use-local-hub'

interface HypershiftStatusResponse {
  isHypershiftEnabled: boolean
}

export const useIsHypershiftEnabled = () => {
  const [loaded, setLoaded] = useState(false)
  const [isHypershiftEnabled, setIsHypershiftEnabled] = useState<boolean>(false)
  const localHubName = useLocalHubName()

  useEffect(() => {
    const getHypershiftStatus = async () => {
      try {
        const url = `${getBackendUrl()}/hypershift-status?hubName=${encodeURIComponent(localHubName)}`
        const abortController = new AbortController()

        const response = await fetchGet<{ body: HypershiftStatusResponse }>(url, abortController.signal)
        setIsHypershiftEnabled(response.data.body.isHypershiftEnabled)
        setLoaded(true)
      } catch (error) {
        // If the request fails, default to false but log the error for debugging
        console.warn('Failed to fetch hypershift status:', error)
        setIsHypershiftEnabled(false)
        setLoaded(true)
      }
    }

    if (localHubName) {
      getHypershiftStatus()
    }
  }, [localHubName])

  return [isHypershiftEnabled, loaded]
}
