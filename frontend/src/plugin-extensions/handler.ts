/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isApplicationAction, isApplicationListColumn, isOverviewTab, isVirtualMachineAction } from './extensions'
import { ActionExtensionProps, ListColumnExtensionProps } from './properties'
import { AcmExtension } from './types'

// Type guards
export function useAcmExtension() {
  const acmExtension: AcmExtension = {}

  // Resolving application action to acm compatible type
  const [applicationAction, resolvedApplicationAction] = useResolvedExtensions(isApplicationAction)
  if (resolvedApplicationAction) {
    acmExtension.applicationAction = applicationAction.map((action) => action.properties as ActionExtensionProps)
  }

  // Resolving application list column to acm compatible type
  const [applicationListColumn, resolvedApplicationListColumn] = useResolvedExtensions(isApplicationListColumn)
  if (resolvedApplicationListColumn) {
    acmExtension.applicationListColumn = applicationListColumn.map(
      (column) => column.properties as ListColumnExtensionProps
    )
  }

  // Resolving overview tab to acm compatible type
  const [overviewTab, resolvedOverviewTab] = useResolvedExtensions(isOverviewTab)
  if (resolvedOverviewTab) {
    acmExtension.overviewTab = overviewTab
  }

  // Resolving virtualmachine action to acm compatible type
  const [virtualMachineAction, resolvedVirtualMachineAction] = useResolvedExtensions(isVirtualMachineAction)
  if (resolvedVirtualMachineAction) {
    acmExtension.virtualMachineAction = virtualMachineAction.map((action) => action.properties as ActionExtensionProps)
  }

  // Resolving virtualmachine list column to acm compatible type
  const [virtualMachineListColumn, resolvedVirtualMachineListColumn] = useResolvedExtensions(isApplicationListColumn)
  if (resolvedVirtualMachineListColumn) {
    acmExtension.virtualMachineListColumn = virtualMachineListColumn.map(
      (column) => column.properties as ListColumnExtensionProps
    )
  }

  // list of all acm supported extensions
  return acmExtension
}
