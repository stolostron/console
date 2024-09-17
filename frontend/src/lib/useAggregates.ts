/* Copyright Contributors to the Open Cluster Management project */

import { ISortBy } from '@patternfly/react-table'
import { IResource, postRequest } from '../resources'
import { useQuery } from './useQuery'
import { useCallback, useEffect } from 'react'
import { usePluginDataContextValue } from './PluginDataContext'

const apiUrl = '/aggregate'

// save response for next query for performance
// last response expires after 5 mins
const STATUSESKEY = 'useAggregate-Statuses'
const EXPIRATION = 5 * 60 * 1000

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
  emptyResult: boolean
  processedItemCount: number
  isPreProcessed: boolean
  request?: IRequestListView
}
export interface IRequestStatuses {
  clusters?: string[]
}

export interface IResultStatuses {
  itemCount: number
  filterCounts: FilterCounts | undefined
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
  emptyResult: false,
  processedItemCount: 0,
  isPreProcessed: true,
}

const defaultStatusResponse: IResultStatuses = {
  itemCount: 0,
  filterCounts: undefined,
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
  let storedResponse: ResultViewType = undefined

  // get default response until backend replies
  // or if there's something stored from last query use that
  switch (aggregate) {
    case SupportedAggregate.applications:
      defaultResponse = defaultListResponse
      break
    case SupportedAggregate.statuses:
      storedResponse = getWithExpiry(STATUSESKEY)
      defaultResponse = defaultStatusResponse
      break
  }
  const usingStoredResponse = !!storedResponse
  if (usingStoredResponse) {
    defaultResponse = storedResponse
  }

  // make request to backend
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
      response = {
        page: response.page,
        loading: loading && !usingStoredResponse,
        items: response.items,
        processedItemCount: response.processedItemCount,
        emptyResult: response.emptyResult,
        isPreProcessed: response.isPreProcessed,
      }
      return response
    case SupportedAggregate.statuses:
      response = result as IResultStatuses
      response = {
        itemCount: response.itemCount,
        filterCounts: response.filterCounts,
        loading: loading && !usingStoredResponse,
      }
      // save response for next time
      if (!loading) setWithExpiry(STATUSESKEY, response)
      return response
  }
}

function getWithExpiry(key: string) {
  const itemStr = localStorage.getItem(key)
  if (!itemStr) {
    return null
  }
  const item = JSON.parse(itemStr)
  const now = new Date()
  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key)
    return null
  }
  return item.value
}
function setWithExpiry(key: string, value: any) {
  const now = new Date()
  const item = {
    value: value,
    expiry: now.getTime() + EXPIRATION,
  }
  localStorage.setItem(key, JSON.stringify(item))
}
