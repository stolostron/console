/* Copyright Contributors to the Open Cluster Management project */

import { ISortBy } from '@patternfly/react-table'
import { IResource, getBackendUrl, postRequest } from '../resources'
import { useQuery } from './useQuery'
import { useCallback, useEffect, useMemo } from 'react'

const apiUrl = '/aggregate'

export interface IRequestListView {
  page: number
  perPage: number
  sortBy: ISortBy | undefined
  search?: string
  filter?: any
}

export interface IResultListView {
  page: number
  loading: boolean
  items: IResource[]
  itemCount: number
  isPreProcessed: boolean
}

export enum SupportedAggregate {
  applications = 'applications',
  applicationDetails = 'applicationDetails',
  clusters = 'clusters',
  clusterDetails = 'cluster-details',
}

export function useAggregate(aggregate: SupportedAggregate, requestedView: IRequestListView): IResultListView {
  const defaultResponse = useMemo<IResultListView>(
    () => ({
      page: 1,
      loading: true,
      items: [],
      itemCount: 0,
      isPreProcessed: false,
    }),
    []
  )

  const queryFunc = useCallback(() => {
    return postRequest<IRequestListView, IResultListView>(`${getBackendUrl()}${apiUrl}/${aggregate}`, requestedView)
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
    isPreProcessed: response.isPreProcessed,
  }
}
