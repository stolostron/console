/* Copyright Contributors to the Open Cluster Management project */

import { DiscoveredPolicyItem } from '../discovered/useFetchPolicies'

/**
 * Check if a label key is user-defined (not a system label)
 * System labels include: cluster-name, cluster-namespace, and policy.open-cluster-management.io/*
 */
export const isUserDefinedPolicyLabel = (key: string): boolean => {
  return key !== 'cluster-name' && key !== 'cluster-namespace' && !key.startsWith('policy.open-cluster-management.io/')
}

/**
 * Parse labels from a single discovered policy item
 * Filters out system labels (cluster-name, cluster-namespace, policy.open-cluster-management.io/*)
 */
export const parsePolicyItemLabels = (item: DiscoveredPolicyItem): Record<string, string> => {
  const pairs: Record<string, string> = {}

  if (!item.label) {
    return pairs
  }

  item.label.split(';').forEach((lbl) => {
    const firstEquals = lbl.indexOf('=')
    if (firstEquals === -1) return // No '=' found, skip

    const key = lbl.slice(0, firstEquals).trim()
    const value = lbl.slice(firstEquals + 1).trim()

    if (key && isUserDefinedPolicyLabel(key)) {
      pairs[key] = value
    }
  })

  return pairs
}

/**
 * Get all unique label options from an array of discovered policy items for filtering
 */
export const getLabelFilterOptions = (policies: DiscoveredPolicyItem[]): { label: string; value: string }[] => {
  const allLabels = new Set<string>()

  policies?.forEach((item) => {
    const pairs = parsePolicyItemLabels(item)
    Object.entries(pairs).forEach(([key, value]) => {
      allLabels.add(`${key}=${value}`)
    })
  })

  return Array.from(allLabels)
    .sort((a, b) => a.localeCompare(b))
    .map((lbl) => ({ label: lbl, value: lbl }))
}

/**
 * Check if a discovered policy item matches the selected label filters
 * Supports both equality (key=value) and inequality (!key=value) filters
 */
export const matchesSelectedLabels = (selectedValues: string[], item: DiscoveredPolicyItem): boolean => {
  const itemLabels = parsePolicyItemLabels(item)
  let equalityMatched = false
  let hasEqualityFilter = false

  for (const selectedValue of selectedValues) {
    const isInequality = selectedValue.startsWith('!')
    const value = isInequality ? selectedValue.substring(1) : selectedValue

    // Split only on first '=' to preserve values containing '='
    const firstEquals = value.indexOf('=')
    if (firstEquals === -1) continue // No '=' found, skip this filter

    const key = value.slice(0, firstEquals).trim()
    const val = value.slice(firstEquals + 1).trim()

    if (isInequality) {
      // Inequality: label should NOT match - reject immediately if it does
      if (itemLabels[key] === val) {
        return false
      }
    } else {
      // Equality: track that we have equality filters and if any matched
      hasEqualityFilter = true
      if (itemLabels[key] === val) {
        equalityMatched = true
      }
    }
  }

  // If there are equality filters, at least one must have matched
  // If there are only inequality filters, all must have passed (which they did if we got here)
  return hasEqualityFilter ? equalityMatched : true
}
