/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist'

export const PolicyReportApiVersion = 'wgpolicyk8s.io/v1alpha2'
export type PolicyReportApiVersionType = 'wgpolicyk8s.io/v1alpha2'

export const PolicyReportKind = 'PolicyReport'
export type PolicyReportKindType = 'PolicyReport'

export interface PolicyReport {
    apiVersion: PolicyReportApiVersionType
    kind: PolicyReportKindType
    metadata: V1ObjectMeta
    results: PolicyReportResults[]
}

export interface PolicyReportResults {
    policy: string
    message: string
    scored: boolean
    category: string
    result: string
    properties: {
        created_at: string
        total_risk: string
        component: string
    }
}
