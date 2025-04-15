/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import * as OpenshiftDynamicPluginSDK from '@openshift-console/dynamic-plugin-sdk'
import { K8sResourceCommon, WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'
import { Context, FC } from 'react'
import { getGetStandaloneVMConsoleUrl, getResourceUrlOverride } from '../../routes/Search/Details/KubevirtPluginWrapper'
import { ClusterScope } from '../ClusterScopeContext'

type MulticlusterResource<T> = { cluster?: string } & T
export type SearchResult<R extends K8sResourceCommon | K8sResourceCommon[]> = R extends (infer T)[]
  ? MulticlusterResource<T>[]
  : MulticlusterResource<R>
export type UseUtilizationQueries = (
  prometheusQueries: Record<string, string>,
  duration: string
) => Record<string, string>

/** Properties type */
export type KubevirtPluginData = {
  clusterScope: { ClusterScope: FC<ClusterScope>; withCluster: (cluster?: string) => typeof OpenshiftDynamicPluginSDK }
  currentCluster?: string
  currentNamespace?: string
  dynamicPluginSDK: typeof OpenshiftDynamicPluginSDK
  getResourceUrl: ReturnType<typeof getResourceUrlOverride>
  getResourceUrlOverride: typeof getResourceUrlOverride
  getStandaloneVMConsoleUrl: ReturnType<typeof getGetStandaloneVMConsoleUrl>
  k8sAPIPath: string
  supportsMulticluster: boolean
  useMulticlusterSearchWatch: <T extends K8sResourceCommon | K8sResourceCommon[]>(
    watchOptions: WatchK8sResource
  ) => [SearchResult<T> | undefined, boolean, Error | undefined]
  useUtilizationQueries: UseUtilizationQueries
}

export type KubevirtPluginDataProps = {
  context: CodeRef<Context<KubevirtPluginData>>
}

/** This extension allows plugins to contribute a tab to Overview page */
export type KubevirtPluginContextExtension = ExtensionDeclaration<'acm.kubevirt-context', KubevirtPluginDataProps>

// Type guard
export const isKubevirtPluginContext = (e: Extension): e is KubevirtPluginContextExtension => {
  return e.type === 'acm.kubevirt-context'
}
