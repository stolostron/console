/* Copyright Contributors to the Open Cluster Management project */

import { IResource, getBackendUrl, postRequest } from '../resources'
import { useQuery } from './useQuery'
import { useCallback, useEffect, useMemo } from 'react'

const apiUrl = '/aggregate'

export interface IRequestView {
  page: number
  perPage: number
  search?: string
  filter?: any
  sort?: any
}

export interface IResultView {
  page: number
  loading: boolean
  items: IResource[]
  itemCount: number
}

export enum SupportedAggregate {
  applications = 'applications',
  applicationDetails = 'applicationDetails',
  clusters = 'clusters',
  clusterDetails = 'cluster-details',
}

export function useAggregate(aggregate: SupportedAggregate, requestedView: IRequestView): IResultView {
  const defaultResponse = useMemo<IResultView>(
    () => ({
      page: 1,
      loading: true,
      items: [],
      itemCount: 0,
    }),
    []
  )

  const queryFunc = useCallback(() => {
    return postRequest<IRequestView, IResultView>(`${getBackendUrl()}${apiUrl}/${aggregate}`, requestedView)
  }, [aggregate, requestedView])

  const { data, loading, startPolling, stopPolling } = useQuery(queryFunc, [defaultResponse], {
    pollInterval: 15,
  })

  useEffect(() => {
    startPolling()
    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

  const response = { ...(data?.[0] ?? defaultResponse) }
  return {
    page: requestedView.page,
    loading,
    items: response.items,
    itemCount: response.itemCount,
  }
}
