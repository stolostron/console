/* Copyright Contributors to the Open Cluster Management project */
import { ExtensionK8sGroupKindModel } from '@openshift-console/dynamic-plugin-sdk'
import { CodeRef } from '@openshift-console/dynamic-plugin-sdk/lib/types'

export type ListPageProperties = {
  /** The model for which this resource page links to. */
  model: ExtensionK8sGroupKindModel
  /** The component to be rendered when the route matches. */
  component: CodeRef<React.ComponentType<{}>>
}
