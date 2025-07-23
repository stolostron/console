/* Copyright Contributors to the Open Cluster Management project */

import { useEffect, useMemo, useState } from 'react'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { UseIsFleetPrometheusInstalled } from '../types'
import { getBackendUrl } from './apiRequests'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'

/**
 * Hook that determines if the fleet Prometheus is installed.
 *
 * Checks if any of the cluster addons is a 'observability-controller'
 * we coukld also see if a MultiClusterObservability resource has been installed but that would require rbac support
 * Prometheus metrics data from fleet clusters usch as CPU and Memory.
 *
 * @returns `[isInstalled, loaded, error]` where `isInstalled` is `true` if a MultiClusterObservability resource has been installed and is available; `false` otherwise
 */

export const useIsFleetPrometheusInstalled: UseIsFleetPrometheusInstalled = () => {
  const [isFleetPrometheusInstalled, setIsFleetPrometheusInstalled] = useState<boolean>(false)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)

  const fleetAvailable = useIsFleetAvailable()

  useEffect(() => {
    if (!fleetAvailable) {
      setLoaded(false)
      setError('A version of RHACM that is compatible with the multicluster SDK is not available')
    }

    void (async () => {
      try {
        const url = getBackendUrl() + '/apis/addon.open-cluster-management.io/v1alpha1/managedclusteraddons'
        const data = await consoleFetchJSON(url, 'GET')
        const isInstalled = data.items.filter((cma: any) => cma.metadata.name === 'observability-controller').length > 0
        setIsFleetPrometheusInstalled(isInstalled)
        setLoaded(true)
      } catch (err) {
        setError(err)
      }
    })()
  }, [fleetAvailable])

  return useMemo(() => [isFleetPrometheusInstalled, loaded, error], [isFleetPrometheusInstalled, loaded, error])
}
