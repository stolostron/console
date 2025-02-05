/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import * as OpenshiftDynamicPluginSDK from '@openshift-console/dynamic-plugin-sdk'
import { WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'
import { Context, FC } from 'react'
import { getResourceUrl } from '../../routes/Search/Details/KubevirtPluginWrapper'
import { ClusterScope } from '../ClusterScopeContext'

/** Properties type */
export type KubevirtPluginData = {
  clusterScope: { ClusterScope: FC<ClusterScope>; withCluster: (cluster?: string) => typeof OpenshiftDynamicPluginSDK }
  currentCluster?: string
  currentNamespace?: string
  dynamicPluginSDK: typeof OpenshiftDynamicPluginSDK
  getResourceUrl: typeof getResourceUrl
  k8sAPIPath: string
  supportsMulticluster: boolean
  useMulticlusterSearchWatch: <T>(watchOptions: WatchK8sResource) => [T | undefined, boolean, Error | undefined]
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
