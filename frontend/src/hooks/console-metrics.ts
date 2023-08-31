/* Copyright Contributors to the Open Cluster Management project */

import { useEffect } from 'react'
import { getBackendUrl, postRequest } from '../resources'

export const handlePageVisitMetric = (page: string) => {
  console.log('handling page visit metric: ', page)
  useEffect(() => {
    console.log('Pre overview-fleet metrics POST')
    postRequest(getBackendUrl() + '/metrics', {
      page,
    })
  }, [page])
}
