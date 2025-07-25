/* Copyright Contributors to the Open Cluster Management project */
import { WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'
import { Fleet } from '../../types'

export type SearchResult<R extends K8sResourceCommon | K8sResourceCommon[]> = R extends (infer T)[]
  ? Fleet<T>[]
  : Fleet<R>

export type AdvancedSearchFilter = { property: string; values: string[] }[]

export type UseFleetSearchPoll = <T extends K8sResourceCommon | K8sResourceCommon[]>(
  watchOptions: WatchK8sResource,
  advancedSearchFilters?: AdvancedSearchFilter
) => [SearchResult<T> | undefined, boolean, Error | undefined]
