/* Copyright Contributors to the Open Cluster Management project */
import { useEffect } from 'react'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import { isFineGrainedRbacEnabledState, isGlobalHubState, isHubSelfManagedState, localHubNameState } from '../../atoms'
import { useQuery } from '../../lib/useQuery'
import { MultiClusterHubComponent } from '../../resources/multi-cluster-hub-component'
import { getBackendUrl, getRequest } from '../../resources/utils'
import { GlobalStateData } from './types'

interface UseGlobalStateResult {
  isLoading: boolean
  globalHubData: GlobalStateData | null
  mchComponents: MultiClusterHubComponent[] | null
}

/**
 * Custom hook that manages global application state including:
 * - Global Hub configuration
 * - Multi-Cluster Hub components
 * - Fine-grained RBAC settings
 */
export function useGlobalState(): UseGlobalStateResult {
  const setIsGlobalHub = useSetRecoilState(isGlobalHubState)
  const setLocalHubName = useSetRecoilState(localHubNameState)
  const setIsHubSelfManaged = useSetRecoilState(isHubSelfManagedState)
  const setIsFineGrainedRbacEnabled = useSetRecoilState(isFineGrainedRbacEnabledState)

  const isGlobalHub = useRecoilValue(isGlobalHubState)
  const isFineGrainedRbacEnabled = useRecoilValue(isFineGrainedRbacEnabledState)

  // Query for Global Hub configuration
  const {
    data: globalHubRes,
    loading: globalHubLoading,
    startPolling: globalHubStartPoll,
    stopPolling: globalHubStopPoll,
  } = useQuery(globalHubQueryFn, [{ isGlobalHub: false, localHubName: 'local-cluster', isHubSelfManaged: undefined }], {
    pollInterval: 30,
  })

  // Query for Multi-Cluster Hub components
  const {
    data: mchResponse,
    loading: mchLoading,
    startPolling: startMCHPoll,
    stopPolling: stopMCHPoll,
  } = useQuery(mchQueryFn, [], { pollInterval: 30 })

  // Start polling for global hub data
  useEffect(() => {
    globalHubStartPoll()
    return () => {
      globalHubStopPoll()
    }
  }, [globalHubStartPoll, globalHubStopPoll])

  // Start polling for MCH data
  useEffect(() => {
    startMCHPoll()
    return () => {
      stopMCHPoll()
    }
  }, [startMCHPoll, stopMCHPoll])

  // Update global hub state when data is available
  useEffect(() => {
    if (globalHubRes && !globalHubLoading && !isGlobalHub) {
      const [hubData] = globalHubRes
      if (hubData) {
        setIsGlobalHub(hubData.isGlobalHub)
        setLocalHubName(hubData.localHubName)
        setIsHubSelfManaged(hubData.isHubSelfManaged)
      }
    }
  }, [globalHubRes, globalHubLoading, isGlobalHub, setIsGlobalHub, setLocalHubName, setIsHubSelfManaged])

  // Update fine-grained RBAC state from MCH response
  useEffect(() => {
    if (mchResponse && !mchLoading && !isFineGrainedRbacEnabled) {
      const fineGrainedRbacComponent = mchResponse.find((component) => component?.name === 'fine-grained-rbac-preview')

      if (fineGrainedRbacComponent) {
        setIsFineGrainedRbacEnabled(fineGrainedRbacComponent.enabled ?? false)
      }
    }
  }, [mchResponse, mchLoading, isFineGrainedRbacEnabled, setIsFineGrainedRbacEnabled])

  const isLoading = globalHubLoading || mchLoading
  const globalHubData = globalHubRes?.[0] || null

  return {
    isLoading,
    globalHubData,
    mchComponents: mchResponse?.filter((component) => component !== undefined) || null,
  }
}

/**
 * Query function for Global Hub configuration
 */
const globalHubQueryFn = () => {
  return getRequest<GlobalStateData>(getBackendUrl() + '/hub')
}

/**
 * Query function for Multi-Cluster Hub components
 */
const mchQueryFn = () => {
  return getRequest<MultiClusterHubComponent[] | undefined>(getBackendUrl() + '/multiclusterhub/components')
}
