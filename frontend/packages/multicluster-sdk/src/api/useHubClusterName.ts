/* Copyright Contributors to the Open Cluster Management project */
import { UseHubClusterName } from '../types'
import { useHubConfigurationItem } from '../internal/useHubConfigurationItem'

/**
 * Hook that provides hub cluster name.
 *
 * @returns Array with `hubclustername`, `loaded` and `error` values.
 */
export const useHubClusterName: UseHubClusterName = () => useHubConfigurationItem('localHubName')
