/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import * as OpenshiftDynamicPluginSDK from '@openshift-console/dynamic-plugin-sdk'
import { Context } from 'react'
import { getResourceUrl } from '../../routes/Search/Details/KubevirtPluginWrapper'

/** Properties type */
export type KubevirtPluginData = {
  dynamicPluginSDK: typeof OpenshiftDynamicPluginSDK
  getResourceURL: typeof getResourceUrl
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
