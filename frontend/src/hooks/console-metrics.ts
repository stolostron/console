/* Copyright Contributors to the Open Cluster Management project */

import { useEffect } from 'react'
import { getBackendUrl, postRequest } from '../resources/utils'

export enum Pages {
  overviewFleet = 'overview-fleet',
  search = 'search',
  searchDetails = 'search-details',
  clusters = 'clusters',
  virtualMachines = 'virtual-machines',
  application = 'application',
  governance = 'governance',
}

export function isTelemetryEnabled(): boolean {
  return !(
    window.SERVER_FLAGS?.telemetry?.DISABLED === 'true' ||
    window.SERVER_FLAGS?.telemetry?.DEVSANDBOX_DISABLED === 'true' ||
    window.SERVER_FLAGS?.telemetry?.TELEMETER_CLIENT_DISABLED === 'true'
  )
}

export function usePageVisitMetricHandler(page: Pages) {
  useEffect(() => {
    if (isTelemetryEnabled()) {
      postRequest(getBackendUrl() + `/metrics?${page}`, {})
    }
  }, [page])
}
