/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ActionExtensionProps } from '../properties'

export type ApplicationAction = ExtensionDeclaration<'acm.application/action', ActionExtensionProps>
export type VirtualMachineAction = ExtensionDeclaration<'acm.virtualmachine/action', ActionExtensionProps>

// Type guards
export const isApplicationAction = (e: Extension): e is ApplicationAction => e.type === 'acm.application/action'
export const isVirtualMachineAction = (e: Extension): e is VirtualMachineAction =>
  e.type === 'acm.virtualmachine/action'
