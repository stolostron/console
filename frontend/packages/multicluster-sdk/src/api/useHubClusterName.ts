/* Copyright Contributors to the Open Cluster Management project */
import { UseHubClusterName } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { useFleetConfiguration } from '../internal/useFleetConfiguration'

/**
 * Hook that provides hub cluster name.
 *
 * @returns Array with `hubclustername`, `loaded` and `error` values.
 */
export const useHubClusterName: UseHubClusterName = () => {
  const [hubClusterName, setHubClusterName] = useState<string | undefined>()

  const [fleetConfiguration, loaded, error] = useFleetConfiguration()

  useEffect(() => {
    setHubClusterName(fleetConfiguration?.localHubName)
  }, [fleetConfiguration])

  return useMemo(() => [hubClusterName, loaded, error], [hubClusterName, loaded, error])
}
