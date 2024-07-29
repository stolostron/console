/* Copyright Contributors to the Open Cluster Management project */
import { ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk'
import { ApplicationActionProps, ApplicationListColumnProps } from './properties'
import { OverviewTab } from './extensions'

export type AcmExtension = Partial<{
  applicationAction: ApplicationActionProps[]
  applicationListColumn: ApplicationListColumnProps[]
  overviewTab: ResolvedExtension<OverviewTab>[]
}>
