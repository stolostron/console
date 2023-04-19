/* Copyright Contributors to the Open Cluster Management project */
import { IResourceDefinition } from '.'
import { Metadata } from './metadata'
import { ResourceRef } from './resource-ref'
import { MatchExpressions } from './selector'

export const PolicyApiVersion = 'policy.open-cluster-management.io/v1'
export type PolicyApiVersionType = 'policy.open-cluster-management.io/v1'

export const PolicyKind = 'Policy'
export type PolicyKindType = 'Policy'

export const PolicyDefinition: IResourceDefinition = {
  apiVersion: PolicyApiVersion,
  kind: PolicyKind,
}

export interface Policy {
  apiVersion: PolicyApiVersionType
  kind: PolicyKindType
  metadata: Metadata
  spec: {
    disabled: boolean
    'policy-templates'?: PolicyTemplate[]
    remediationAction?: string
  }
  status?: {
    compliant?: 'Compliant' | 'NonCompliant' | 'Pending'
    details?: PolicyStatusDetails[]
    placement?: { placementBinding: string; placementRule?: string; placement?: string; policySet?: string }[]
    status?: { clustername: string; clusternamespace: string; compliant?: string }[]
  }
}

export interface PolicyTemplate {
  objectDefinition: {
    apiVersion: string
    kind: string
    metadata: { name: string }
    spec: {
      namespaceSelector?: {
        exclude?: string[]
        include?: string[]
        matchLabels?: Record<string, string>
        matchExpressions?: MatchExpressions[]
      }
      'object-templates'?: {
        complianceType: string
        objectDefinition: {
          apiVersion: string
          kind: string
          metadata: { name: string }
          rules?: { apiGroups?: string[]; resources?: string[]; verbs?: string[] }[]
          roleRef?: ResourceRef
          subjects?: ResourceRef[]
        }
      }[]
      remediationAction?: string
      severity?: string
      maxClusterRoleBindingUsers?: number
      pruneObjectBehavior?: string
    }
  }
}

export interface PolicyStatusDetails {
  compliant: string
  history?: { eventName: string; lastTimestamp: string; message: string }[]
  templateMeta: { creationTimestamp?: null; name: string }
}

export enum PolicySeverity {
  Unknown,
  Low,
  Medium,
  High,
}

export function getPolicySeverity(policy: Policy): PolicySeverity {
  if (!policy.spec['policy-templates']) return PolicySeverity.High
  let severity = PolicySeverity.Unknown
  for (const template of policy.spec['policy-templates']) {
    switch (template.objectDefinition.spec.severity) {
      case 'low':
        severity = severity < PolicySeverity.Low ? PolicySeverity.Low : severity
        break
      case 'medium':
        severity = severity < PolicySeverity.Medium ? PolicySeverity.Medium : severity
        break
      case 'high':
        severity = severity < PolicySeverity.High ? PolicySeverity.High : severity
        break
    }
  }
  if (severity === PolicySeverity.Unknown) severity = PolicySeverity.High
  return severity
}
