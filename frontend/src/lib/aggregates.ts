/* Copyright Contributors to the Open Cluster Management project */

import { ISortBy } from '@patternfly/react-table'
import { IResource, getBackendUrl, postRequest } from '../resources'
import { useQuery } from './useQuery'
import { useCallback, useEffect, useMemo } from 'react'

const apiUrl = '/aggregate'

export type FilterCounts = {
  [id: string]: { [filter: string]: number }
}

export interface IRequestListView {
  page: number
  perPage: number
  sortBy: ISortBy | undefined
  search?: string
  filters?: any
}

export interface IResultListView {
  page: number
  loading: boolean
  items: IResource[]
  itemCount: number
  filterCounts: FilterCounts
  emptyResult: boolean
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
      filterCounts: {},
      emptyResult: false,
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
    page: response.page,
    loading,
    items: response.items,
    itemCount: response.itemCount,
    filterCounts: response.filterCounts,
    emptyResult: response.emptyResult,
    isPreProcessed: response.isPreProcessed,
  }
}
