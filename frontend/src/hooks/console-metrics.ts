/* Copyright Contributors to the Open Cluster Management project */

import { useEffect } from 'react'
import { getBackendUrl, postRequest } from '../resources'

export enum Pages {
  overview = 'overview-classic',
  overviewFleet = 'overview-fleet',
  search = 'search',
  searchDetails = 'search-details',
  clusters = 'clusters',
  application = 'application',
  governance = 'governance',
}

export function usePageVisitMetricHandler(page: Pages) {
  useEffect(() => {
    postRequest(getBackendUrl() + `/metrics?${page}`, {})
  }, [page])
}
