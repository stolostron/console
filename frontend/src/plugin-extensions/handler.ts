/* Copyright Contributors to the Open Cluster Management project */
import { isResourceListPage, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isApplicationAction, isApplicationListColumn, isOverviewTab } from './extensions'
import { ApplicationActionProps, ApplicationListColumnProps } from './properties'
import { AcmExtension } from './types'
import { isSearchDetails } from './extensions/SearchDetails'
import { isKubevirtPluginContext } from './extensions/KubevirtContext'

// Type guards
export function useAcmExtension() {
  const acmExtension: AcmExtension = {}

  // Resolving application action to acm compatible type
  const [applicationAction, resolvedApplicationAction] = useResolvedExtensions(isApplicationAction)
  if (resolvedApplicationAction) {
    acmExtension.applicationAction = applicationAction.map((action) => action.properties as ApplicationActionProps)
  }

  // Resolving application list column to acm compatible type
  const [applicationListColumn, resolvedApplicationListColumn] = useResolvedExtensions(isApplicationListColumn)
  if (resolvedApplicationListColumn) {
    acmExtension.applicationListColumn = applicationListColumn.map(
      (column) => column.properties as ApplicationListColumnProps
    )
  }

  // Resolving overview tab to acm compatible type
  const [overviewTab, resolvedOverviewTab] = useResolvedExtensions(isOverviewTab)
  if (resolvedOverviewTab) {
    acmExtension.overviewTab = overviewTab
  }

  // Resolve search details extensions
  const [searchDetails, resolvedSearchDetails] = useResolvedExtensions(isSearchDetails)
  if (resolvedSearchDetails) {
    acmExtension.searchDetails = searchDetails
  }

  // Resolve kubevirt context extensions
  const [kubevirtContext, resolvedKubevirtContext] = useResolvedExtensions(isKubevirtPluginContext)
  if (resolvedKubevirtContext) {
    acmExtension.kubevirtContext = kubevirtContext
  }

  // Resolve VirtualMachines list page
  const [resourceListPages, resolvedResourceListPages] = useResolvedExtensions(isResourceListPage)
  if (resolvedResourceListPages) {
    acmExtension.virtualMachinesList = resourceListPages.find((rl) => {
      const { group, version, kind } = rl.properties.model
      return group === 'kubevirt.io' && version === 'v1' && kind == 'VirtualMachine'
    })
  }

  // list of all acm supported extensions
  return acmExtension
}
