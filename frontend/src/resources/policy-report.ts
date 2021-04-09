/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist'
import { listNamespacedResources } from '../lib/resource-request'

export const PolicyReportApiVersion = 'wgpolicyk8s.io/v1alpha2'
export type PolicyReportApiVersionType = 'wgpolicyk8s.io/v1alpha2'

export const PolicyReportKind = 'PolicyReport'
export type PolicyReportKindType = 'PolicyReport'

export interface PolicyReport {
    apiVersion: PolicyReportApiVersionType
    kind: PolicyReportKindType
    metadata: V1ObjectMeta
    results: [
        {
            category: string
            properties: {
                created_at: string
                details: string
                reason: string
                resolution: string
                total_risk: string
            }
            message: string
            policy: string
            result: string
        }
    ]
}

export function listNamespacedPolicyReports(namespace: string) {
    return listNamespacedResources<PolicyReport>({
        apiVersion: PolicyReportApiVersion,
        kind: PolicyReportKind,
        metadata: { namespace },
    })
}
