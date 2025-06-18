import { IResource } from '../../../src/common/resource'

export const PolicyAutomationGroup = 'policy.open-cluster-management.io'
export const PolicyAutomationApiVersion = 'policy.open-cluster-management.io/v1beta1'
export const PolicyAutomationKind = 'PolicyAutomation'
export const PolicyAutomationType = { apiVersion: PolicyAutomationApiVersion, kind: PolicyAutomationKind }

export interface IPolicyAutomation extends IResource {
    apiVersion: 'policy.open-cluster-management.io/v1beta1'
    kind: 'PolicyAutomation'
    spec: {
        policyRef: string
        mode: 'once' | 'disabled' | 'everyEvent'
        automationDef: {
            name: string
            secret: string
            type?: string // AnsibleJob
            extra_vars?: Record<string, string>
        }
        eventHook?: 'noncompliant'
        rescanAfter?: string
        delayAfterRunSeconds?: number
    }
}
