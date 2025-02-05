/* Copyright Contributors to the Open Cluster Management project */
import { CodeRef, Extension, ExtensionDeclaration } from '@openshift-console/dynamic-plugin-sdk/lib/types'

export type VirtualMachineConsoleProps = {
  component: CodeRef<React.ComponentType>
}

/** This extension allows plugins to contribute the VirtualMachineConsole */
export type VirtualMachineConsole = ExtensionDeclaration<'acm.page/virtualmachine/console', VirtualMachineConsoleProps>

// Type guard
export const isVirtualMachineConsole = (e: Extension): e is VirtualMachineConsole => {
  return e.type === 'acm.page/virtualmachine/console'
}
