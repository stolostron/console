import { V1ObjectMeta } from '@kubernetes/client-node/dist'
import { getResource } from '../lib/resource-request'

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

export function getPolicyReport(metadata: { name: string; namespace: string }) {
    return getResource<PolicyReport>({ apiVersion: 'wgpolicyk8s.io/v1alpha1', kind: 'PolicyReport', metadata })
}
