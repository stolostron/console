/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ApplicationActionProps } from '../properties'

export type ApplicationAction = ExtensionDeclaration<'acm.application/action', ApplicationActionProps>

// Type guards
export const isApplicationAction = (e: Extension): e is ApplicationAction => e.type === 'acm.application/action'
