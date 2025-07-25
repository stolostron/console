/* Copyright Contributors to the Open Cluster Management project */
import { ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk'
import { ActionExtensionProps, ListColumnExtensionProps } from './properties'
import { ResourceRouteExtensionProps } from '@stolostron/multicluster-sdk'
import { OverviewTab } from './extensions'

export type AcmExtension = Partial<{
  applicationAction: ActionExtensionProps[]
  applicationListColumn: ListColumnExtensionProps[]
  overviewTab: ResolvedExtension<OverviewTab>[]
  resourceRoutes: ResourceRouteExtensionProps[]
  virtualMachineAction: ActionExtensionProps[]
  virtualMachineListColumn: ListColumnExtensionProps[]
}>
