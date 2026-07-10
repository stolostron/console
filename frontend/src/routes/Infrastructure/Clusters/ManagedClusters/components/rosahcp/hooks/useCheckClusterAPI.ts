import { useMultiClusterEngineComponents } from '~/hooks/use-multi-cluster-engine-components'

/* Copyright Contributors to the Open Cluster Management project */
export const useCheckClusterAPI = () => {
  const { components, loaded } = useMultiClusterEngineComponents()
  const isCapiEnabled = components.some((component) => component.name === 'cluster-api' && component.enabled)
  const isCapaEnabled = components.some(
    (component) => component.name === 'cluster-api-provider-aws' && component.enabled
  )
  return { isCapiEnabled, isCapaEnabled, loaded }
}
