/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist'
import { listNamespacedResources } from '../lib/resource-request'

export interface PolicyReport {
    apiVersion: string
    kind: string
    metadata?: V1ObjectMeta
    results?: [
        {
            category: string
            data: {
                created_at: string
                details: string
                reason: string
                resolution: string
                total_risk: string
            }
            message: string
            policy: string
            status: string
        }
    ]
}

export function listNamespacedPolicyReports(namespace: string) {
    return listNamespacedResources<PolicyReport>({
        apiVersion: 'wgpolicyk8s.io/v1alpha1',
        kind: 'PolicyReport',
        metadata: { namespace },
    })
}
