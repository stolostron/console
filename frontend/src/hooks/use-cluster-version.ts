/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { fetchGet, getBackendUrl } from '../resources/utils/resource-request'

interface ClusterVersionResponse {
  version?: string
  error?: string
}

export interface UseClusterVersionResult {
  version?: string
  isLoading: boolean
  error?: string
}

/**
 * Custom hook to get the current cluster's version using the OpenShift ClusterVersion API
 * @returns Object containing the cluster version, loading state, and any error
 */
export function useClusterVersion(): UseClusterVersionResult {
  const [version, setVersion] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    const getClusterVersion = async () => {
      try {
        setIsLoading(true)
        setError(undefined)

        const url = `${getBackendUrl()}/cluster-version`
        const abortController = new AbortController()

        const response = await fetchGet<ClusterVersionResponse>(url, abortController.signal)
        const data = response.data

        if (data.error) {
          setError(data.error)
          setVersion(undefined)
        } else {
          setVersion(data.version)
          setError(undefined)
        }
      } catch (err) {
        // If the request fails, set error state
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cluster version'
        console.warn('Failed to fetch cluster version:', err)
        setError(errorMessage)
        setVersion(undefined)
      } finally {
        setIsLoading(false)
      }
    }

    getClusterVersion()
  }, [])

  return {
    version,
    isLoading,
    error,
  }
}
