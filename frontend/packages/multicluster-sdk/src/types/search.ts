/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
import { Fleet } from './fleet'

export type SearchResult<R extends K8sResourceCommon | K8sResourceCommon[]> = R extends (infer T)[]
  ? Fleet<T>[]
  : Fleet<R>

export type AdvancedSearchFilter = { property: string; values: string[] }[]
