/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { OverviewTabProps } from '../properties'

/** This extension allows plugins to contribute a tab to Overview page */
export type OverviewTab = ExtensionDeclaration<'acm.overview/tab', OverviewTabProps>

// Type guards

export const isOverviewTab = (e: Extension): e is OverviewTab => {
  return e.type === 'acm.overview/tab'
}
