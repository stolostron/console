/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'

export const PolicyAutomationApiVersion = 'policy.open-cluster-management.io/v1beta1'
export type PolicyAutomationApiVersionType = 'policy.open-cluster-management.io/v1beta1'

export const PolicyAutomationKind = 'PolicyAutomation'
export type PolicyAutomationKindType = 'PolicyAutomation'

export interface PolicyAutomation {
    apiVersion: PolicyAutomationApiVersionType
    kind: PolicyAutomationKindType
    metadata: Metadata
    spec: PolicyAutomationSpec
}

export interface PolicyAutomationSpec {
    automationDef: AutomationDef
    mode: 'disabled' | 'once'
    policyRef: string
    eventHook?: 'noncompliant'
    rescanAfter?: string
}

interface AutomationDef {
    name: string
    secret: string
    type?: string
    extra_vars?: object
}
