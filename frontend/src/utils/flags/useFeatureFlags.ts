/* Copyright Contributors to the Open Cluster Management project */
import { SetFeatureFlag } from '@openshift-console/dynamic-plugin-sdk'
import { REQUIRED_PROVIDER_FLAG } from '@stolostron/multicluster-sdk'
import { useEffect } from 'react'
import { useQuery } from '../../lib/useQuery'
import { MultiClusterHubComponent } from '../../resources/multi-cluster-hub-component'
import { getBackendUrl, getRequest } from '../../resources/utils'
import { FEATURE_FLAGS } from './consts'

// Query function defined outside component to prevent re-creation on every render
const featureFlagsQueryFn = () => {
  return getRequest<MultiClusterHubComponent[]>(getBackendUrl() + '/multiclusterhub/components')
}

const useFeatureFlags = (setFeatureFlag: SetFeatureFlag) => {
  const pollingInterval = 120
  const { data: mchComponents, loading, error, startPolling, stopPolling } = useQuery(featureFlagsQueryFn, [])

  // Process feature flags when data is available
  useEffect(() => {
    if (mchComponents && !loading) {
      Object.entries(FEATURE_FLAGS).forEach(([featureFlag, componentName]) =>
        setFeatureFlag(featureFlag, mchComponents.find((e) => e.name === componentName)?.enabled || false)
      )
    }
  }, [mchComponents, loading, setFeatureFlag])

  // Handle error logging (similar to original behavior)
  useEffect(() => {
    if (error) {
      console.warn('Failed to fetch feature flags:', error)
    }
  }, [error])

  // Start polling when component mounts, stop when unmounts
  useEffect(() => {
    if (pollingInterval > 0) {
      startPolling(pollingInterval * 1000) // Convert seconds to milliseconds
      return () => {
        stopPolling()
      }
    }
  }, [startPolling, stopPolling, pollingInterval])

  // Set the required provider flag once
  useEffect(() => {
    setFeatureFlag(REQUIRED_PROVIDER_FLAG, true)
  }, [setFeatureFlag])
}

export default useFeatureFlags
