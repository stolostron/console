/* Copyright Contributors to the Open Cluster Management project */
import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk'
import { useCallback, useEffect, useRef } from 'react'
import { MultiClusterHubComponent } from '../../resources/multi-cluster-hub-component'
import { getBackendUrl, getRequest } from '../../resources/utils'
import { FEATURE_FLAGS } from './consts'

const REQUIRED_PROVIDER_FLAG = 'MULTICLUSTER_SDK_PROVIDER_1'

const useFeatureFlags = (setFeatureFlag: SetFeatureFlag, pollingInterval: number = 30000) => {
  const requestRef = useRef<ReturnType<typeof getRequest<MultiClusterHubComponent[] | undefined>> | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // useCallback to prevent re-rendering when the function is called
  const fetchFeatureFlags = useCallback(() => {
    // Abort any existing request to prevent race conditions
    if (requestRef.current) {
      requestRef.current.abort()
    }

    // Create new request
    requestRef.current = getRequest<MultiClusterHubComponent[] | undefined>(
      getBackendUrl() + '/multiclusterhub/components'
    )

    requestRef.current.promise
      .then((response) => {
        Object.entries(FEATURE_FLAGS).forEach(([featureFlag, componentName]) =>
          setFeatureFlag(featureFlag, response?.find((e) => e.name === componentName)?.enabled || false)
        )
      })
      .catch((error) => {
        // Handle errors gracefully - log but don't throw
        console.warn('Failed to fetch feature flags:', error)
      })
  }, [setFeatureFlag])

  useEffect(() => {
    // Fetch immediately on mount
    fetchFeatureFlags()

    // Set up polling if interval is provided and > 0
    if (pollingInterval > 0) {
      intervalRef.current = setInterval(fetchFeatureFlags, pollingInterval)
    }

    // Cleanup function
    return () => {
      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      // Abort any pending request
      if (requestRef.current) {
        requestRef.current.abort()
        requestRef.current = null
      }
    }
  }, [fetchFeatureFlags, pollingInterval])

  // Set the required provider flag once
  useEffect(() => {
    setFeatureFlag(REQUIRED_PROVIDER_FLAG, true)
  }, [setFeatureFlag])
}

export default useFeatureFlags
