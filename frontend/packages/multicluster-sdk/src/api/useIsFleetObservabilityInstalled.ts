/* Copyright Contributors to the Open Cluster Management project */
import { UseIsFleetObservabilityInstalled } from '../types'
import { useHubConfigurationItem } from '../internal/useHubConfigurationItem'

/**
 * Hook that provides is observability installed.
 *
 * @returns Array with `isObservabilityInstalled`, `loaded` and `error` values.
 */
export const useIsFleetObservabilityInstalled: UseIsFleetObservabilityInstalled = () =>
  useHubConfigurationItem('isObservabilityInstalled')
