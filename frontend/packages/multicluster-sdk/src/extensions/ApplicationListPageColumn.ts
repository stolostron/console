/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ApplicationListColumnProps } from '../properties'

export type ApplicationListColumn = ExtensionDeclaration<'acm.application/list/column', ApplicationListColumnProps>

// Type guards
export const isApplicationListColumn = (e: Extension): e is ApplicationListColumn =>
  e.type === 'acm.application/list/column'
