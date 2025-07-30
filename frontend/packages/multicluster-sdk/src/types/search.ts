/* Copyright Contributors to the Open Cluster Management project */
import { Fleet } from '.'

export type SearchResult<R extends K8sResourceCommon | K8sResourceCommon[]> = R extends (infer T)[]
  ? Fleet<T>[]
  : Fleet<R>

export type AdvancedSearchFilter = { property: string; values: string[] }[]
