/* Copyright Contributors to the Open Cluster Management project */

import { useEffect } from 'react'
import { getBackendUrl, postRequest } from '../resources'

export enum Pages {
  overview = 'overview-classic',
  overviewFleet = 'overview-fleet',
}

export function usePageVisitMetricHandler(page: Pages) {
  useEffect(() => {
    postRequest(getBackendUrl() + `/metrics?${page}`, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
