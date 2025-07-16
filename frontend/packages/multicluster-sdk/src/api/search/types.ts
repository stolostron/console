/* Copyright Contributors to the Open Cluster Management project */
import { WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'

type MulticlusterResource<T> = { cluster?: string } & T
export type SearchResult<R extends K8sResourceCommon | K8sResourceCommon[]> = R extends (infer T)[]
  ? MulticlusterResource<T>[]
  : MulticlusterResource<R>

export type AdvacedSearchFilter = { property: string; values: string[] }[]

export type UseMulticlusterSearchWatch = <T extends K8sResourceCommon | K8sResourceCommon[]>(
  watchOptions: WatchK8sResource,
  advancedSearchFilters?: AdvacedSearchFilter
) => [SearchResult<T> | undefined, boolean, Error | undefined]
