/* Copyright Contributors to the Open Cluster Management project */
import { Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'
import { ListPageProperties } from '../properties/listPageProps'

export type VirtualMachineListPage = ExtensionDeclaration<'acm.virtualmachine/list', ListPageProperties>

// Type guards
export const isVirtualMachineListPage = (e: Extension): e is VirtualMachineListPage => e.type === 'acm.application/list'
