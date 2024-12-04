/* Copyright Contributors to the Open Cluster Management project */
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
import { isApplicationAction, isApplicationListColumn, isOverviewTab } from './extensions'
import { ApplicationActionProps, ApplicationListColumnProps } from './properties'
import { AcmExtension } from './types'
import { isSearchDetails } from './extensions/SearchDetails'

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
  // list of all acm supported extensions
  return acmExtension
}
