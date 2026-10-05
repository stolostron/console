/* Copyright Contributors to the Open Cluster Management project */

import { useSharedValue, useSharedAtoms } from '../shared-atoms'

export function useLocalHubName() {
  const { localHubNameState } = useSharedAtoms()
  return useSharedValue(localHubNameState) || 'local-cluster'
}

export function useIsHubSelfManaged() {
  const { isHubSelfManagedState } = useSharedAtoms()
  return useSharedValue(isHubSelfManagedState)
}
