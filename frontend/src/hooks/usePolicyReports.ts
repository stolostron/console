/* Copyright Contributors to the Open Cluster Management project */

import { getClusterPolicyReport, listPolicyReports, type PolicyReport } from '../resources/policy-report'
import { useSharedReactQuery } from './shared-react-query'

/** Insights PolicyReports change infrequently (~30 min); cache briefly to avoid refetch thrash. */
export const POLICY_REPORT_STALE_TIME_MS = 5 * 60 * 1000

export const policyReportQueryKeys = {
  all: ['policyreports'] as const,
  list: () => [...policyReportQueryKeys.all, 'list'] as const,
  cluster: (clusterName: string) => [...policyReportQueryKeys.all, 'cluster', clusterName] as const,
}

/**
 * One-shot getResource for a single cluster Insights PolicyReport.
 * Uses React Query with a 5-minute staleTime (insights-client ~30 min poll).
 */
export function useClusterPolicyReport(clusterName: string | undefined): {
  policyReport: PolicyReport | undefined
  isLoading: boolean
  isError: boolean
} {
  const { useQuery } = useSharedReactQuery()
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: policyReportQueryKeys.cluster(clusterName ?? ''),
    queryFn: () => getClusterPolicyReport(clusterName!),
    enabled: !!clusterName,
    staleTime: POLICY_REPORT_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  })

  return {
    policyReport: data,
    isLoading: !!clusterName && (isLoading || isFetching),
    isError,
  }
}

/**
 * One-shot listResources for Overview Insights aggregates.
 * Fetches only when `enabled` (e.g. Insights section open).
 */
export function usePolicyReportsList(enabled: boolean): {
  policyReports: PolicyReport[]
  isLoading: boolean
  isError: boolean
} {
  const { useQuery } = useSharedReactQuery()
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: policyReportQueryKeys.list(),
    queryFn: listPolicyReports,
    enabled,
    staleTime: POLICY_REPORT_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  })

  return {
    policyReports: data ?? [],
    isLoading: enabled && (isLoading || isFetching),
    isError,
  }
}
