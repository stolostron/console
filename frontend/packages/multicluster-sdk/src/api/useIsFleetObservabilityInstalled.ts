/* Copyright Contributors to the Open Cluster Management project */
import { UseIsFleetObservabilityInstalled } from '../types'
import { useEffect, useMemo, useState } from 'react'
import { useFleetConfiguration } from '../internal/useFleetConfiguration'

/**
 * Hook that provides true if observability is installed on the hub cluster.
 *
 * @returns Array with `isObservabilityInstalled`, `loaded` and `error` values.
 */
export const useIsFleetObservabilityInstalled: UseIsFleetObservabilityInstalled = () => {
  const [isObservabilityInstalled, setIsObservabilityInstalled] = useState<boolean | null>(null)

  const [fleetConfiguration, loaded, error] = useFleetConfiguration()

  useEffect(() => {
    setIsObservabilityInstalled(fleetConfiguration?.isObservabilityInstalled ?? null)
  }, [fleetConfiguration])

  return useMemo(() => [isObservabilityInstalled, loaded, error], [isObservabilityInstalled, loaded, error])
}
