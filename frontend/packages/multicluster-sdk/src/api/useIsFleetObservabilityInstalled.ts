/* Copyright Contributors to the Open Cluster Management project */

import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { UseIsFleetObservabilityInstalled } from '../types'
import { getBackendUrl } from './apiRequests'
import { useEffect, useMemo, useState } from 'react'

/**
 * Hook that returns the fleet observation installed. Checks periodically for changes in the fleet observation installed.
 *
 * @returns {boolean}
 */

export const useIsFleetObservationInstalled: UseIsFleetObservabilityInstalled = () => {
  const [fleetIsObservationInstalled, setIsFleetObservationInstalled] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  useEffect(() => {
    consoleFetchJSON(`${getBackendUrl()}/hub`, 'GET')
      .then((data) => {
        setIsFleetObservationInstalled(data.isObservabilityInstalled)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [])
  return useMemo(() => [fleetIsObservationInstalled, loading, error], [fleetIsObservationInstalled, loading, error])
}
