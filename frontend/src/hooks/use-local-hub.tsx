/* Copyright Contributors to the Open Cluster Management project */

import { useRecoilValue, useSharedAtoms } from '../shared-recoil'

export function useLocalHubName() {
  const { localHubNameState } = useSharedAtoms()
  return useRecoilValue(localHubNameState) || 'local-cluster'
}

export function useIsHubSelfManaged() {
  const { isHubSelfManagedState } = useSharedAtoms()
  return useRecoilValue(isHubSelfManagedState)
}
