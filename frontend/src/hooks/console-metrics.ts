/* Copyright Contributors to the Open Cluster Management project */

import { useEffect } from 'react'
import { getBackendUrl, postRequest } from '../resources'

export function usePageVisitMetricHandler(page: string) {
  useEffect(() => {
    postRequest(getBackendUrl() + `/metrics?${page}`, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
