/* Copyright Contributors to the Open Cluster Management project */

import { ISortBy } from '@patternfly/react-table'
import { IResource, postRequest } from '../resources'
import { useQuery } from './useQuery'
import { useCallback, useEffect } from 'react'
import { usePluginDataContextValue } from './PluginDataContext'

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
export interface IRequestStatuses {
  clusters?: string[]
}

export interface IResultStatuses {
  applicationCount: number
  loading: boolean
}

export enum SupportedAggregate {
  applications = 'applications',
  applicationDetails = 'applicationDetails',
  clusters = 'clusters',
  clusterDetails = 'cluster-details',
  statuses = 'statuses',
}

const defaultListResponse: IResultListView = {
  page: 1,
  loading: true,
  items: [],
  itemCount: 0,
  filterCounts: undefined,
  emptyResult: false,
  isPreProcessed: true,
}

const defaultStatusResponse: IResultStatuses = {
  applicationCount: 0,
  loading: true,
}

type RequestStatusesType = IRequestStatuses | undefined
type RequestListType = IRequestListView | undefined
type RequestViewType = RequestStatusesType | RequestListType
type ResultViewType = IResultStatuses | IResultListView | undefined
export function useAggregate(aggregate: SupportedAggregate, requestedView: RequestStatusesType): IResultStatuses
export function useAggregate(aggregate: SupportedAggregate, requestedView: RequestListType): IResultListView
export function useAggregate(
  aggregate: SupportedAggregate,
  requestedView: IRequestStatuses | IRequestListView | undefined
): ResultViewType {
  let defaultResponse: ResultViewType = undefined

  switch (aggregate) {
    case SupportedAggregate.applications:
      defaultResponse = defaultListResponse
      break
    case SupportedAggregate.statuses:
      defaultResponse = defaultStatusResponse
      break
  }

  const { backendUrl } = usePluginDataContextValue()
  const requestedViewStr = requestedView && JSON.stringify(requestedView)
  const queryFunc = useCallback(() => {
    return requestedViewStr
      ? postRequest<RequestViewType, IResultListView>(
          `${backendUrl}${apiUrl}/${aggregate}`,
          JSON.parse(requestedViewStr)
        )
      : undefined
  }, [aggregate, backendUrl, requestedViewStr])

  const { data, loading, startPolling, stopPolling } = useQuery(queryFunc, [defaultResponse], {
    pollInterval: 15,
  })

  useEffect(() => {
    startPolling()
    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

  const result = { ...(data?.[0] ?? defaultResponse) }

  let response
  switch (aggregate) {
    case SupportedAggregate.applications:
      response = result as IResultListView
      return {
        page: response.page,
        loading,
        items: response.items,
        itemCount: response.itemCount,
        filterCounts: response.filterCounts,
        emptyResult: response.emptyResult,
        isPreProcessed: response.isPreProcessed,
      }
    case SupportedAggregate.statuses:
      response = result as IResultStatuses
      return {
        applicationCount: response.applicationCount,
        loading,
      }
  }
}
