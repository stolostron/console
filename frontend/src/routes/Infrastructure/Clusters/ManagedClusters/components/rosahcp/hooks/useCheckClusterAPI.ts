/* Copyright Contributors to the Open Cluster Management project */

import { useRecoilValue, useSharedAtoms } from '~/shared-recoil'

export const useCheckClusterAPI = () => {
  const { multiClusterEnginesState } = useSharedAtoms()
  const [multiClusterEngine] = useRecoilValue(multiClusterEnginesState)
  const mceComponents = multiClusterEngine?.spec?.overrides?.components ?? []

  const isCapiEnabled = mceComponents.some((component) => component.name === 'cluster-api' && component.enabled)
  const isCapaEnabled = mceComponents.some(
    (component) => component.name === 'cluster-api-provider-aws' && component.enabled
  )
  return {
    isCapiEnabled,
    isCapaEnabled,
  }
}
