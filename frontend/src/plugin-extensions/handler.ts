/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isApplicationAction, isApplicationListColumn, isOverviewTab } from './extensions'
import { ApplicationActionProps, ApplicationListColumnProps } from './properties'
import { AcmExtension } from './types'

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

  // list of all acm supported extensions
  return acmExtension
}
