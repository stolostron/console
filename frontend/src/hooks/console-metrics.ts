/* Copyright Contributors to the Open Cluster Management project */

import { useEffect } from 'react'
import { fetchRetry, getBackendUrl } from '../resources'

export function usePageVisitMetricHandler(page: string) {
  console.log('handling page visit metric: ', page)
  useEffect(() => {
    console.log('Pre overview-fleet metrics POST')
    const abortController = new AbortController()
    fetchRetry({
      method: 'POST',
      url: getBackendUrl() + '/metrics',
      data: {
        page,
      },
      signal: abortController.signal,
      retries: /* istanbul ignore next */ process.env.NODE_ENV === 'production' ? 2 : 0,
    })
  }, [page])
}
