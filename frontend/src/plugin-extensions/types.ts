/* Copyright Contributors to the Open Cluster Management project */
import { ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk'
import { ActionExtensionProps, ListColumnExtensionProps } from './properties'
import { OverviewTab } from './extensions'
import { ResourceDetails } from '@stolostron/multicluster-sdk'

export type AcmExtension = Partial<{
  applicationAction: ActionExtensionProps[]
  applicationListColumn: ListColumnExtensionProps[]
  overviewTab: ResolvedExtension<OverviewTab>[]
  virtualMachineAction: ActionExtensionProps[]
  virtualMachineListColumn: ListColumnExtensionProps[]
  resourceDetails: ResolvedExtension<ResourceDetails>['properties'][]
}>
