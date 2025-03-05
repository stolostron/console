/* Copyright Contributors to the Open Cluster Management project */
import { ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk'
import { ApplicationActionProps, ApplicationListColumnProps } from './properties'
import { OverviewTab } from './extensions'
import { SearchDetails } from './extensions/SearchDetails'
import { KubevirtPluginContextExtension } from './extensions/KubevirtContext'
import { ResourceList } from './extensions/ResourceList'
import { ComponentType } from 'react'

export type AcmExtension = Partial<{
  applicationAction: ApplicationActionProps[]
  applicationListColumn: ApplicationListColumnProps[]
  overviewTab: ResolvedExtension<OverviewTab>[]
  searchDetails: ResolvedExtension<SearchDetails>[]
  kubevirtContext: ResolvedExtension<KubevirtPluginContextExtension>[]
  virtualMachinesList: ResolvedExtension<ResourceList>
  ConsoleStandAlone: ComponentType
}>
