/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ListColumnExtensionProps } from '../properties'

export type ApplicationListColumn = ExtensionDeclaration<'acm.application/list/column', ListColumnExtensionProps>
export type VirtualMachineListColumn = ExtensionDeclaration<'acm.virtualmachine/list/column', ListColumnExtensionProps>

// Type guards
export const isApplicationListColumn = (e: Extension): e is ApplicationListColumn =>
  e.type === 'acm.application/list/column'
export const isVirtualMachineistColumn = (e: Extension): e is VirtualMachineListColumn =>
  e.type === 'acm.virtualmachine/list/column'
