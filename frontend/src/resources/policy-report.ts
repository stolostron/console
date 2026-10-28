/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { getResource, listResources, ResourceError, ResourceErrorCode } from './utils'

export const PolicyReportApiVersion = 'wgpolicyk8s.io/v1alpha2'
export type PolicyReportApiVersionType = 'wgpolicyk8s.io/v1alpha2'

export const PolicyReportKind = 'PolicyReport'
export type PolicyReportKindType = 'PolicyReport'

/** Insights PolicyReport name is `{clusterName}-policyreport` in the cluster namespace. */
export function clusterPolicyReportName(clusterName: string): string {
  return `${clusterName}-policyreport`
}

export function clusterPolicyReportIdentity(clusterName: string): PolicyReport {
  return {
    apiVersion: PolicyReportApiVersion,
    kind: PolicyReportKind,
    metadata: {
      name: clusterPolicyReportName(clusterName),
      namespace: clusterName,
    },
    results: [],
  }
}

/** One-shot get of a cluster Insights PolicyReport; 404 → undefined. */
export async function getClusterPolicyReport(clusterName: string): Promise<PolicyReport | undefined> {
  try {
    return await getResource<PolicyReport>(clusterPolicyReportIdentity(clusterName)).promise
  } catch (err) {
    if (err instanceof ResourceError && err.code === ResourceErrorCode.NotFound) {
      return undefined
    }
    throw err
  }
}

/** One-shot list of all PolicyReports (all namespaces). */
export async function listPolicyReports(): Promise<PolicyReport[]> {
  return listResources<PolicyReport>({
    apiVersion: PolicyReportApiVersion,
    kind: PolicyReportKind,
  }).promise
}

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
    reason?: string
    resolution?: string
  }
}
