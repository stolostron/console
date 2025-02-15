/* Copyright Contributors to the Open Cluster Management project */
import { ExtensionK8sGroupKindModel } from '@openshift-console/dynamic-plugin-sdk'
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'

export type ResourceListProps = {
  component: CodeRef<React.ComponentType>
  model: ExtensionK8sGroupKindModel
}

/** This extension allows plugins to contribute a tab to Overview page */
export type ResourceList = ExtensionDeclaration<'acm.page/resource/list', ResourceListProps>

// Type guard
export const isResourceList = (e: Extension): e is ResourceList => {
  return e.type === 'acm.page/resource/list'
}
