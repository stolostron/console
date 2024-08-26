/* Copyright Contributors to the Open Cluster Management project */

import { ISortBy } from '@patternfly/react-table'
import { IResource, postRequest } from '../resources'
import { useQuery } from './useQuery'
import { useCallback, useContext, useEffect, useMemo } from 'react'
import isEqual from 'lodash/isEqual'
import { PluginContext } from './PluginContext'

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
  filterCounts: FilterCounts | undefined
  emptyResult: boolean
  isPreProcessed: boolean
  request?: IRequestListView
}

export enum SupportedAggregate {
  applications = 'applications',
  applicationDetails = 'applicationDetails',
  clusters = 'clusters',
  clusterDetails = 'cluster-details',
}

export function useAggregate(
  aggregate: SupportedAggregate,
  requestedView: IRequestListView | undefined
): IResultListView {
  const defaultResponse = useMemo<IResultListView>(
    () => ({
      page: 1,
      loading: true,
      items: [],
      itemCount: 0,
      filterCounts: undefined,
      emptyResult: false,
      isPreProcessed: true,
      request: {
        page: 0,
        perPage: 0,
        sortBy: undefined,
      },
    }),
    []
  )
  const { dataContext } = useContext(PluginContext)
  const { backendUrl } = useContext(dataContext)
  const queryFunc = useCallback(() => {
    return requestedView
      ? postRequest<IRequestListView, IResultListView>(`${backendUrl}${apiUrl}/${aggregate}`, requestedView)
      : undefined
  }, [aggregate, backendUrl, requestedView])

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
  const isLoading = process.env.NODE_ENV !== 'test' && (loading || !isEqual(response.request, requestedView))
  return {
    page: response.page,
    loading: isLoading,
    items: response.items,
    itemCount: response.itemCount,
    filterCounts: response.filterCounts,
    emptyResult: response.emptyResult,
    isPreProcessed: response.isPreProcessed,
  }
}
