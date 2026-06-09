/* Copyright Contributors to the Open Cluster Management project */
import type { Extension } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ActionExtensionProps } from '../properties'

export type ApplicationAction = Extension<'acm.application/action', ActionExtensionProps>
export type VirtualMachineAction = Extension<'acm.virtualmachine/action', ActionExtensionProps>

// Type guards
export const isApplicationAction = (e: Extension): e is ApplicationAction => e.type === 'acm.application/action'
export const isVirtualMachineAction = (e: Extension): e is VirtualMachineAction =>
  e.type === 'acm.virtualmachine/action'
