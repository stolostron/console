/* Copyright Contributors to the Open Cluster Management project */
import { ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk'
import { ActionExtensionProps, ListColumnExtensionProps } from './properties'
import { OverviewTab } from './extensions'

export type AcmExtension = Partial<{
  applicationAction: ActionExtensionProps[]
  applicationListColumn: ListColumnExtensionProps[]
  overviewTab: ResolvedExtension<OverviewTab>[]
  virtualMachineAction: ActionExtensionProps[]
  virtualMachineListColumn: ListColumnExtensionProps[]
}>
