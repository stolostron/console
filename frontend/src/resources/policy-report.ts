/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'

export const PolicyReportApiVersion = 'wgpolicyk8s.io/v1alpha2'
export type PolicyReportApiVersionType = 'wgpolicyk8s.io/v1alpha2'

export const PolicyReportKind = 'PolicyReport'
export type PolicyReportKindType = 'PolicyReport'

export interface PolicyReport {
  apiVersion: PolicyReportApiVersionType
  kind: PolicyReportKindType
  metadata: Metadata
  results: PolicyReportResults[]
  scope?: {
    kind: string
    name: string
    namespace: string
  }
  summary?: {
    error?: number
    fail?: number
    pass?: number
    skip?: number
    warn?: number
  }
}

export interface PolicyReportResults {
  policy: string
  message: string
  scored?: boolean
  source: string
  category: string
  result: string
  properties: {
    created_at: string
    total_risk: string
    component: string
    extra_data?: string
  }
}
