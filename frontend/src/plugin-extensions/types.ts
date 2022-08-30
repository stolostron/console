/* Copyright Contributors to the Open Cluster Management project */
import { ApplicationActionProps, ApplicationListColumnProps } from './properties'

export type AcmExtension = Partial<{
    applicationAction: ApplicationActionProps[]
    applicationListColumn: ApplicationListColumnProps[]
}>
