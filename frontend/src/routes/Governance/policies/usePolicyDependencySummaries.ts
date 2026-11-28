/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import type { Policy } from '~/resources'
import { useSharedAtoms, useSharedValue } from '~/shared-atoms'
import { searchClient } from '../../Search/search-sdk/search-client'
import { useSearchResultItemsQuery } from '../../Search/search-sdk/search-sdk'
import { buildDependencySummaryPlan, summarizeDependencyPlan, type SearchObservation } from './policyDependencySummary'

export function usePolicyDependencySummaries(policies: Policy[]) {
  const { managedClusterAddonsState, policiesState, policySetsState } = useSharedAtoms()
  const allPolicies = useSharedValue(policiesState)
  const policySets = useSharedValue(policySetsState)
  const addons = useSharedValue(managedClusterAddonsState)

  const hostedClusters = useMemo(() => {
    const locations = new Map<string, { cluster: string; namespace: string }>()
    for (const [cluster, clusterAddons] of Object.entries(addons)) {
      const governance = clusterAddons.find((addon) => addon.metadata.name === 'governance-policy-framework')
      const host = governance?.metadata.annotations?.['addon.open-cluster-management.io/hosting-cluster-name']
      if (host) {
        locations.set(cluster, {
          cluster: host,
          namespace: governance?.spec.installNamespace ?? 'open-cluster-management-agent-addon',
        })
      }
    }
    return locations
  }, [addons])

  const plan = useMemo(
    () => buildDependencySummaryPlan(policies, allPolicies, policySets, hostedClusters),
    [policies, allPolicies, policySets, hostedClusters]
  )

  const { data, loading, error } = useSearchResultItemsQuery({
    client: searchClient,
    variables: { input: plan.searchQueries },
    skip: plan.searchQueries.length === 0,
    pollInterval: 30000,
  })

  return useMemo(() => {
    const results =
      !loading && !error
        ? data?.searchResult?.map((batch) => batch?.items as SearchObservation[] | undefined)
        : undefined
    return summarizeDependencyPlan(plan, results)
  }, [plan, data, loading, error])
}
