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

export function usePageVisitMetricHandler(page: Pages) {
  useEffect(() => {
    postRequest(getBackendUrl() + `/metrics?${page}`, {})
  }, [page])
}
